import { publicProcedure, protectedProcedure } from "../../trpc";
import { getUser, supabase } from "../../../lib/supabaseClient";
import {
  loginWithGoogle,
  logoutUser,
  refreshSession,
  startAuthenticateWithPasskeys,
  verifyAuthenticateWithPasskeys,
} from "../../../services/auth";
import { z } from "zod";
import { googleRoutes } from "./authProviders/google";

enum AuthProviderType {
  PASSKEYS = "PASSKEYS",
  EMAIL_N_PASSWORD = "EMAIL_N_PASSWORD",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  X = "X",
  APPLE = "APPLE",
}

export const authenticateRouter = {
  ...googleRoutes,
  authenticate: publicProcedure
    .input(
      z.object({ authProviderType: z.string(), options: z.any().optional() })
    )
    .mutation(async ({ input }) => {
      let response;
      switch (input.authProviderType) {
        case AuthProviderType.GOOGLE:
          const url = await loginWithGoogle(input.authProviderType);
          return { url };

        case AuthProviderType.PASSKEYS:
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
          return {}
        case AuthProviderType.FACEBOOK:
          response = await supabase.auth.signInWithOAuth({ provider: "facebook" });
          return { url: response.data.url };

        case AuthProviderType.X:
          response = await supabase.auth.signInWithOAuth({ provider: "twitter" });
          return { url: response.data.url };

        case AuthProviderType.APPLE:
          response = await supabase.auth.signInWithOAuth({ provider: "apple" });
          return { url: response.data.url };

        case AuthProviderType.EMAIL_N_PASSWORD:
          if (!input?.options?.email || !input?.options?.password) {
            throw new Error("Email and password are required for this login method");
          }
          const { error, data } = await supabase.auth.signInWithPassword({
            email: input.options.email,
            password: input.options.password,
          });
          if (error) throw new Error(error.message);
          return { user: data.user };

        default:
          throw new Error("Unsupported auth provider type");
      }
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
