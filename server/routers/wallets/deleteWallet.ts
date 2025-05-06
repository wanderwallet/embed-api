import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"

export const DeleteWalletInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const deleteWallet = protectedProcedure
  .input(DeleteWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    // The trigger should take care of deleting all these automatically:
    // - WalletActivation
    // - WalletRecovery
    // - WalletExport
    // - WorkKeyShare
    // - RecoveryKeyShare
    // - Challenge

    await ctx.prisma.wallet.delete({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    return {};
  });
