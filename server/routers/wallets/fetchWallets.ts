import { protectedProcedure } from "@/server/trpc"

export const fetchWallets = protectedProcedure
  .query(async ({ ctx }) => {
    // TODO: Once we support other chains, we need to add an optional Chain filter and maybe pagination.

    const wallets = await ctx.prisma.wallet.findMany({
      where: {
        userId: ctx.user.id,
      },
    });

    return {
      wallets,
    };
  });
