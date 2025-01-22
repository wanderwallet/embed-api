import { publicProcedure } from "@/server/trpc"
import { handleGoogleCallback } from "@/services/auth"

export const googleRoutes = {
  handleGoogleCallback: publicProcedure.query(async () => {
    const user = await handleGoogleCallback()
    return { user }
  }),
  // Add any other google auth related routes here
}