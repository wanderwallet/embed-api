import { publicProcedure, protectedProcedure } from "../trpc";
import {
  logoutUser,
  refreshSession,
  getUser,
} from "../services/auth";
import { z } from "zod";
import { createServerClient } from "../utils/supabase/supabase-server-client";
import { Provider } from "@supabase/supabase-js";
import { AuthProviderType } from "@prisma/client";
import { passkeysRoutes } from "./authenticate/authProviders/passkeys";

const SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE: Record<AuthProviderType, Provider | null> = {
  [AuthProviderType.PASSKEYS]: null,
  [AuthProviderType.EMAIL_N_PASSWORD]: null,
  [AuthProviderType.GOOGLE]: "google",
  [AuthProviderType.FACEBOOK]: "facebook",
  [AuthProviderType.X]: "twitter",
  [AuthProviderType.APPLE]: "apple",
};

export const authenticateRouter = {
  debugSession: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),

  ...passkeysRoutes,

  authenticate: publicProcedure
    .input(
      z.discriminatedUnion("authProviderType", [
        z.object({
          authProviderType: z.literal(AuthProviderType.EMAIL_N_PASSWORD),
          email: z.string().email(),
          // See https://supabase.com/docs/guides/auth/password-security
          // See `SELECT * FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'encrypted_password'`
          password: z.string().min(8).max(255),
        }),
        ...Object.values(AuthProviderType)
          .filter((authProviderType) => authProviderType !== AuthProviderType.EMAIL_N_PASSWORD)
          .map((authProviderType) =>
            z.object({
              authProviderType: z.literal(authProviderType),
            }),
          ),
      ])
    )
    .mutation(async ({ input }) => {
      const supabase = await createServerClient();

      if (input.authProviderType === AuthProviderType.EMAIL_N_PASSWORD) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          throw new Error(error.message);
        }

        return {
          user: data.user,
          url: null,
        };
      }

      const provider = SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE[input.authProviderType];

      if (!provider) throw new Error("Unsupported auth provider type");

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" 
            ? `${window.location.origin}/auth/callback/${provider}` 
            : undefined,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        user: null,
        data: data.url,
      };
    }),

  getUser: protectedProcedure.query(async () => {
    const user = await getUser();
    return { user };
  }),

  logout: protectedProcedure.mutation(async () => {
    await logoutUser();
    return { success: true, message: "Logged out successfully" };
  }),

  refreshSession: protectedProcedure.mutation(async () => {
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
