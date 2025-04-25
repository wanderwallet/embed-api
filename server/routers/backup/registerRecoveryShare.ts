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

    console.log(`Starting registerRecoveryShare for wallet: ${input.walletId}, user: ${ctx.user.id}`);

    // Make sure the wallet exists (removed userId filter to allow recovery key creation for any wallet)
    console.log(`Looking for wallet with ID: ${input.walletId}, by user: ${ctx.user.id}`);

    // Try direct query without RLS filtering
    const directQuery = await ctx.prisma.$queryRaw`SELECT id, "userId", chain FROM "Wallets" WHERE id = ${input.walletId}::uuid`;
    console.log('Direct query result:', directQuery);

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

    // Log for debugging
    console.log(`Found wallet: ${wallet.id}, chain: ${wallet.chain}, owner: ${wallet.userId}, current user: ${ctx.user.id}`);

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
      ] = await ctx.prisma.$transaction(async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;
        const dateNow = new Date();

        console.log(`Creating recovery key share for wallet: ${wallet.id}, user: ${ctx.user.id}`);

        const recoveryFileServerSignaturePromise = BackupUtils.generateRecoveryFileSignature({
          walletId: wallet.id,
          recoveryBackupShareHash: input.recoveryBackupShareHash,
        });

        const updateWalletStatsPromise = tx.wallet.update({
          where: {
            id: wallet.id,
            // Don't restrict by userId for recovery operations
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

      console.log(`Recovery share registered successfully for wallet: ${wallet.id}`);

      return {
        wallet: updatedWallet as DbWallet,
        recoveryFileServerSignature,
      };
    } catch (error) {
      console.error(`Error registering recovery share for wallet ${wallet.id}:`, error);
      throw error;
    }
  });
