import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";

export const RegisterRecoveryShareInputSchema = z.object({
  walletId: z.string(),
  recoveryAuthShare: z.string(), // TODO: Validate length/format
  recoveryBackupShareHash: z.string(), // TODO: Validate length/format
  recoveryBackupSharePublicKey: z.string(), // TODO: Validate length/format
});

export const generateAuthShareChallenge = protectedProcedure
  .input(RegisterRecoveryShareInputSchema)
  .mutation(async ({ input, ctx }) => {

    // Make sure the user is the owner of the wallet:
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true },
      where: {
        // TODO: Do I need to add userIds or are they implicit?
        userId: ctx.user.id,
        id: input.walletId,
      },
    });

    if (!userWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: userWallet.id,
        },
        data: {
          lastBackedUpAt: dateNow,
          totalBackups: { increment: 1 },
        },
      });

      const createRecoverySharePromise = ctx.prisma.recoveryKeyShare.create({
        data: {
          status: "",
          recoveryAuthShare: input.recoveryAuthShare,
          recoveryBackupShareHash: input.recoveryBackupShareHash,
          recoveryBackupSharePublicKey: input.recoveryBackupSharePublicKey,

          // Relations:
          userId: ctx.user.id,
          walletId: userWallet.id,
          deviceAndLocationId,
        }
      });

      return Promise.all([
        updateWalletStatsPromise,
        createRecoverySharePromise,
      ]);
    });

    // TODO: Return server signature to be able to verify this backup file was once valid
    // even if the db share is deleted.
    return {};
  });
