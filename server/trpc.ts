import { initTRPC, TRPCError } from "@trpc/server"
import type { Context } from "./context"
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // We re-create `ctx` in here so that user is typed as `User` rather than `User | null`:

  return opts.next({
    ctx: {
      ...ctx,
      prisma: ctx.prisma,
      session: ctx.session,
      user: ctx.user,
    },
  });
});
