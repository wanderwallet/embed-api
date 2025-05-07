import { protectedProcedure, router } from "../../trpc";

export const testRouter = router({
  getSessionInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
      timestamp: new Date().toISOString(),
    };
  }),
});
