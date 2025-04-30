import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { BackupUtils } from "@/server/utils/backup/backup.utils";
import { getShareHashValidator, getSharePublicKeyValidator, getShareValidator, validateShare } from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";

export const RegisterRecoveryShareInputSchema = z.object({
  walletId: z.string().uuid(),
  recoveryAuthShare: getShareValidator(),
  recoveryBackupShareHash: getShareHashValidator(),
  recoveryBackupSharePublicKey: getSharePublicKeyValidator(),
});

export const registerRecoveryShare = protectedProcedure
  .input(RegisterRecoveryShareInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    // Changed from findUnique to findFirst
    const wallet = await ctx.prisma.wallet.findFirst({
      select: { id: true, chain: true, userId: true },
      where: {
        id: input.walletId,
        // No userId constraint - allows registering recovery shares for shared wallets
      },
    });

    if (!wallet) {
      console.error(`Wallet not found: ${input.walletId}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    if (validateShare(wallet.chain, input.recoveryAuthShare, ["recoveryAuthShare"]).length > 0) {
      console.error(`Invalid share format for chain: ${wallet.chain}`);
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.INVALID_SHARE,
      });
    }

    try {
      const [
        recoveryFileServerSignature,
        updatedWallet,
        updateWalletStatsPromise,
      ] = await ctx.prisma.$transaction(async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;
        const dateNow = new Date();

        const recoveryFileServerSignaturePromise = BackupUtils.generateRecoveryFileSignature({
          walletId: wallet.id,
          recoveryBackupShareHash: input.recoveryBackupShareHash,
        });

        const updateWalletStatsPromise = tx.wallet.update({
          where: {
            id: wallet.id,
            userId: ctx.user.id,
          },
          data: {
            canBeRecovered: true,
            lastBackedUpAt: dateNow,
            totalBackups: { increment: 1 },
          },
        });

        const createRecoverySharePromise = tx.recoveryKeyShare.create({
          data: {
            recoveryAuthShare: input.recoveryAuthShare,
            recoveryBackupShareHash: input.recoveryBackupShareHash,
            recoveryBackupSharePublicKey: input.recoveryBackupSharePublicKey,

            // Relations:
            userId: ctx.user.id,  // Current user is creating the recovery share
            walletId: wallet.id,
            deviceAndLocationId,
          }
        });

        return Promise.all([
          recoveryFileServerSignaturePromise,
          updateWalletStatsPromise,
          createRecoverySharePromise,
        ]);
      });

      return {
        wallet: updatedWallet as DbWallet,
        recoveryFileServerSignature,
        updateWalletStatsPromise,
      };
    } catch (error) {
      console.error(`Error registering recovery share for wallet ${wallet.id}:`, error);
      throw error;
    }
  });
