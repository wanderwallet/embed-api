import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { DbWallet } from "@/prisma/types/types";

export const DeleteCloudBackupInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const deleteCloudBackup = protectedProcedure
  .input(DeleteCloudBackupInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Verify the user owns the wallet and the backup exists
    const existingBackup = await ctx.prisma.cloudBackup.findFirst({
      where: {
        walletId: input.walletId,
        wallet: {
          userId: ctx.user.id,
        },
      },
    });

    if (!existingBackup) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CLOUD_BACKUP_NOT_FOUND,
      });
    }

    // Delete the cloud backup and update wallet stats
    const [, wallet] = await ctx.prisma.$transaction(async (tx) => {
      const deletedCloudBackupPromise = tx.cloudBackup.delete({
        where: {
          id: existingBackup.id,
        },
      });

      const updatedWalletPromise = tx.wallet.update({
        where: {
          id: input.walletId,
          userId: ctx.user.id,
        },
        data: {
          totalCloudBackups: { decrement: 1 },
          lastCloudBackedUpAt: null,
        },
      });

      return Promise.all([deletedCloudBackupPromise, updatedWalletPromise]);
    });

    return { wallet: wallet as DbWallet };
  });
