import { publicProcedure, protectedProcedure } from "../../trpc"
import {getUser} from '../../../lib/supabaseClient'
import { loginWithGoogle,logoutUser, refreshSession } from "../../../services/auth"
import { z } from "zod"
import { googleRoutes } from "./authProviders/google"

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
  .input(z.object({ authProviderType: z.string(), options: z.any().optional() }))
  .mutation(async ({input}) => {
    if(AuthProviderType.GOOGLE === input.authProviderType){
        const url = await loginWithGoogle(input.authProviderType)
        return { url: url }
    }
    if(AuthProviderType.PASSKEYS === input.authProviderType){
      const url = await loginWithGoogle(input.authProviderType)
      return { url: url }
  }
    return
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

