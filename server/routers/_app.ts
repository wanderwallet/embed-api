import { publicProcedure, protectedProcedure, router } from "../trpc"
import { signJWT } from "../auth"
// import { supabase } from '@/utils/supabaseClient';

export const appRouter = router({
  authenticate: publicProcedure.mutation(async () => {
    const token = await signJWT({ userId: "123" }) // TODO: replace with actual user data
    return { token }
  }),
  protectedRoute: protectedProcedure.query(() => {
    return { message: "This is a protected route" } // TODO: remove, just an example for protected route
  }),
})

export type AppRouter = typeof appRouter

