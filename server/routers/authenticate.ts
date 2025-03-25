import { publicProcedure, protectedProcedure } from "../trpc";
import {
  logoutUser,
  refreshSession,
  getUser,
} from "../services/auth";
import { z } from "zod";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { Provider } from "@supabase/supabase-js";
import { AuthProviderType } from "@prisma/client";
import { passkeysRoutes } from "./authenticate/authProviders/passkeys";
import { createWebAuthnAccessTokenForUser, createWebAuthnRefreshTokenForUser } from "@/server/utils/passkey/session";
import { getClientIp, getClientCountryCode } from "@/server/utils/ip/ip.utils";
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

  refreshPasskeySession: publicProcedure
    .mutation(async ({ ctx }) => {
      const refreshTokenFromInput = ctx.req?.headers.get("x-refresh-token");
      const userId = ctx.user?.id;
      let deviceNonce = ctx.req?.headers.get("x-device-nonce");
    
      const supabase = await createServerClient();
      
      if (!deviceNonce && ctx.req) {
        deviceNonce = ctx.req.headers.get("x-device-nonce") || undefined;
      }
      
      // If refresh token is provided, use it
      if (refreshTokenFromInput) {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: refreshTokenFromInput,
        });
        
        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Failed to refresh session: ${error.message}`,
          });
        }
        
        return {
          message: "Session refreshed successfully.",
          session: data.session,
        };
      }
      
      // Otherwise, use userId and deviceNonce
      if (!userId || !deviceNonce) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either refreshToken or both userId and deviceNonce must be provided",
        });
      }
      
      // Verify the session exists in our database
      const session = await ctx.prisma.session.findUnique({
        where: {
          userSession: {
            userId,
            deviceNonce,
          },
        },
        include: {
          userProfile: true,
        },
      });
      
      if (!session) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session not found.",
        });
      }
      
      // Create new tokens
      const accessToken = createWebAuthnAccessTokenForUser(session.userProfile);
      const refreshToken = createWebAuthnRefreshTokenForUser(session.userProfile);
      
      // Set the session in Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (sessionError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to refresh session: ${sessionError.message}`,
        });
      }
      
      // Get request information from context
      const req = ctx.req;
      const userAgent = req?.headers.get("user-agent") || session.userAgent;
      const ip = req ? getClientIp(req) : session.ip;
      const countryCode = req ? getClientCountryCode(req) : session.countryCode;
      
      // Update the session in our database
      await ctx.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          updatedAt: new Date(),
          userAgent,
          ip,
          countryCode,
        },
      });
      
      return {
        message: "Session refreshed successfully.",
        session: sessionData.session,
      };
    }),
};
