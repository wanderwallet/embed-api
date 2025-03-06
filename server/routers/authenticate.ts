import { publicProcedure, protectedProcedure } from "../trpc";
import {
  loginWithGoogle,
  logoutUser,
  refreshSession,
  getUser,
} from "../services/auth";
import { z } from "zod";
import { createServerClient } from "../utils/supabase/supabase-server-client";
import { Provider } from "@supabase/supabase-js";

type AuthEmailPasswordInput = {
  email: string;
  authProviderType: AuthProviderType.EMAIL_N_PASSWORD;
  password: string;
}

type AuthSocialInput = {
  authProviderType: AuthProviderType.GOOGLE | AuthProviderType.FACEBOOK | AuthProviderType.X | AuthProviderType.APPLE;
}

enum AuthProviderType {
  PASSKEYS = "PASSKEYS",
  EMAIL_N_PASSWORD = "EMAIL_N_PASSWORD",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  X = "X",
  APPLE = "APPLE",
}

const SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE: Record<string, Provider> = {
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

  authenticate: publicProcedure
    .input(
      z.discriminatedUnion("authProviderType", [
        z.object({
          authProviderType: z.literal(AuthProviderType.EMAIL_N_PASSWORD),
          email: z.string().email(),
          // https://supabase.com/docs/guides/auth/password-security
          // Unable to find password schema but no max length seems to be suggested and min length is 8
          password: z.string().min(8)
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
    .mutation(async (opts) => {
      const input = opts.input as AuthEmailPasswordInput | AuthSocialInput;
      const supabase = await createServerClient();

      // social auth
      if (input.authProviderType in SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE) {
        let oauthOptions = {
          provider:
            SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE[input.authProviderType],
        }
        if(input.authProviderType === AuthProviderType.GOOGLE) {
          oauthOptions = {
            ...oauthOptions,
            options: {
              redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback/google` : undefined,
            }
          }
        }
        supabase.auth.signInWithOAuth(oauthOptions);
      }

      // email and password auth
      if (
        input.authProviderType === AuthProviderType.EMAIL_N_PASSWORD &&
        input?.email &&
        input?.password
      ) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });
        if (error) {
          throw new Error(error.message);
        }
        return { user: data.user };
      }

      throw new Error("Unsupported auth provider type");
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
