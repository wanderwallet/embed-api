import { publicProcedure, protectedProcedure } from "../trpc"
import { loginWithGoogle, logoutUser, refreshSession, getUser } from "../services/auth"
import { z } from "zod"

enum AuthProviderType {
  PASSKEYS = "PASSKEYS",
  EMAIL_N_PASSWORD = "EMAIL_N_PASSWORD",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  X = "X",
  APPLE = "APPLE",
}

export const authenticateRouter = {
  debugSession: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    }
  }),

  authenticate: publicProcedure
  .input(z.object({ authProviderType: z.string() }))
  .mutation(async ({input}) => {
    let url = ''

    if(AuthProviderType.GOOGLE === input.authProviderType){
        url = await loginWithGoogle(input.authProviderType)
        return { url: url }
    }

    return { url: url }
  }),

  getUser: protectedProcedure.query(async () => {
    const user = await getUser()
    return { user }
  }),

  logout: protectedProcedure.mutation(async () => {
    await logoutUser()
    return { success: true, message: "Logged out successfully" }
  }),

  refreshSession: protectedProcedure.query(async () => {
    const { session, user } = await refreshSession()
    return {
      message: "Session refreshed successfully.",
      user,
      session: {
        expires_at: session?.expires_at,
        expires_in: session?.expires_in,
      },
    }
  }),
}

