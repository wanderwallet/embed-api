import { publicProcedure, protectedProcedure } from "../../trpc";
import { getUser } from "@/server/services/auth";
import {
  loginWithGoogle,
  logoutUser,
  refreshSession,
  startAuthenticateWithPasskeys,
  verifyAuthenticateWithPasskeys,
} from "@/server/services/auth";
import { z } from "zod";
import { googleRoutes } from "./authProviders/google";
import { AuthProviderType } from "@prisma/client";

export const authenticateRouter = {
  ...googleRoutes,
  authenticate: publicProcedure
    .input(
      z.object({ authProviderType: z.string(), options: z.any().optional() })
    )
    .mutation(async ({ input }) => {
      if (AuthProviderType.GOOGLE === input.authProviderType) {
        const url = await loginWithGoogle(input.authProviderType);
        return { url: url };
      }
      if (AuthProviderType.PASSKEYS === input.authProviderType) {
        if (input?.options?.type === "authenticate")
          return await startAuthenticateWithPasskeys(
            input.authProviderType,
            input.options?.userId
          );
        if (input?.options?.type === "verify")
            return await verifyAuthenticateWithPasskeys(
              input.authProviderType,
              input.options?.userId,
              input.options?.assertionResponse
            );
      }
      return;
    }),

  getUser: protectedProcedure.query(async () => {
    const user = await getUser();
    return { user };
  }),

  logout: protectedProcedure.mutation(async () => {
    await logoutUser();
    return { success: true, message: "Logged out successfully" };
  }),

  refreshSession: protectedProcedure.query(async () => {
    const { session, user } = await refreshSession();
    return {
      message: "Session refreshed successfully.",
      user,
      session: {
        expires_at: session?.expires_at,
        expires_in: session?.expires_in,
      },
    };
  }),
};
