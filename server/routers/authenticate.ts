import { publicProcedure, protectedProcedure } from "../trpc";
import {
  refreshSession,
  getUser,
} from "../services/auth";
import { z } from "zod";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { Provider } from "@supabase/supabase-js";
import { AuthProviderType } from "@prisma/client";
import { passkeysRoutes } from "./authenticate/authProviders/passkeys";
import { TRPCError } from "@trpc/server";

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
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServerClient();

      if (input.authProviderType === AuthProviderType.EMAIL_N_PASSWORD) {
        // Check if the user exists using prisma
        const userExists = await ctx.prisma.userProfile.findFirst({
          where: { supEmail: input.email },
        });

        if (userExists) {
          // User exists, proceed with sign-in
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
        } else {
          // User does not exist, proceed with sign-up
          const { error: error2, data: data2 } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
              data: {
                registration_date: new Date().toISOString(),
                email_confirmed_at: new Date().toISOString(),
                confirmation_sent_at: new Date().toISOString(),
              }
            }
          });

          if (error2) {
            throw new Error(error2.message);
          }

          return {
            user: data2.user,
            url: null,
          };
        }
      }

      const provider = SUPABASE_PROVIDER_BY_AUTH_PROVIDER_TYPE[input.authProviderType];

      if (!provider) throw new Error("Unsupported auth provider type");

      // Determine correct callback URL based on the origin
      let redirectTo = "";
      if (typeof window !== "undefined") {
        // Browser context - get from window
        redirectTo = `${window.location.origin}/auth/callback/${provider}`;
        console.log("Using client-side redirect URL:", redirectTo);
      } else {
        // Server context - get from env or use localhost
        // For extension, this should be 5173, for web app, should be 3000
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
        redirectTo = `${baseUrl}/auth/callback/${provider}`;
        console.log("Using server-side redirect URL:", redirectTo);
      }

      const { error, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: provider === 'google' ? 'email profile' : undefined,
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

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { user, session } = ctx;
      
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }
      
      // Only try to update the session if we have a valid session ID
      if (session?.id) {
        try {
          // Try to update the session, but don't fail if it doesn't exist
          await ctx.prisma.session.update({
            where: {
              id: session.id,
            },
            data: {
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          // Log the error but don't fail the logout
          console.error("Error updating session:", error);
        }
      }
      
      // Always proceed with Supabase logout
      const supabase = await createServerClient();
      await supabase.auth.signOut();
      
      return {
        success: true,
      };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
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
