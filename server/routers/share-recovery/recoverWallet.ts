import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Challenge, ChallengePurpose, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils, generateChangeValue } from "@/server/utils/challenge/challenge.utils";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { BackupUtils } from "@/server/utils/backup/backup.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getShareHashValidator } from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";

export const RecoverWalletSchema = z.object({
  walletId: z.string().uuid(),
  recoveryBackupShareHash: getShareHashValidator(),
  recoveryFileServerSignature: z.string().length(684), // RSA 4096 signature => 512 bytes => 684 characters in base64
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
  crossAuthRecovery: z.boolean().optional(), // Optional flag to indicate cross-auth recovery
});

export const recoverWallet = protectedProcedure
  .input(RecoverWalletSchema)
  .mutation(async ({ input, ctx }) => {
    console.log("Recover wallet called with input:", { 
      walletId: input.walletId,
      crossAuthRecovery: input.crossAuthRecovery || false,
      challengeSolutionPrefix: input.challengeSolution?.substring(0, 5) + '...',
      authMethod: ctx.user ? 'available' : 'unknown'
    });

    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);
    const now = Date.now();

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        walletId: input.walletId,
        purpose: ChallengePurpose.SHARE_RECOVERY,
      },
    });

    const recoveryKeySharePromise = ctx.prisma.recoveryKeyShare.findFirst({
      where: {
        userId: ctx.user.id,
        walletId: input.walletId,
        recoveryBackupShareHash: input.recoveryBackupShareHash,
      },
    });

    const [
      challenge,
      recoveryKeyShare,
    ] = await Promise.all([
      challengePromise,
      recoveryKeySharePromise,
    ]);

    if (!challenge) {
      // Just try again.
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    if (!recoveryKeyShare) {
      const isSignatureValid = await BackupUtils.verifyRecoveryFileSignature({
        walletId: input.walletId,
        recoveryBackupShareHash: input.recoveryBackupShareHash,
        recoveryFileServerSignature: input.recoveryFileServerSignature
      });

      if (isSignatureValid) {
        return {
          recoveryAuthShare: null,
          recoveryBackupServerPublicKey: Config.BACKUP_FILE_PUBLIC_KEY,
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WORK_SHARE_NOT_FOUND,
      });
    }

    // Check if this is a cross-auth recovery attempt
    const isCrossAuthRecovery = input.crossAuthRecovery === true;
    
    // Log auth provider and the cross-auth recovery flag
    if (isCrossAuthRecovery) {
      console.log("Cross-auth recovery requested, user authenticated:", ctx.user ? 'yes' : 'no');
    }

    // For normal auth or if cross-auth has already been validated by signature,
    // proceed with standard or simplified validation
    let isChallengeValid = false;
    
    // Special handling for signature-based challenge solution (v1.signature format)
    const isSignatureChallenge = input.challengeSolution.startsWith('v1.') && 
                                input.challengeSolution.substring(3) === input.recoveryFileServerSignature;

    if (isCrossAuthRecovery && isSignatureChallenge) {
      console.log("Using signature-based validation for cross-auth recovery");
      
      // Verify the recovery file signature directly
      const isSignatureValid = await BackupUtils.verifyRecoveryFileSignature({
        walletId: input.walletId,
        recoveryBackupShareHash: input.recoveryBackupShareHash,
        recoveryFileServerSignature: input.recoveryFileServerSignature
      });
      
      if (!isSignatureValid) {
        console.log("Cross-auth recovery signature verification failed");
        isChallengeValid = false;
      } else {
        console.log("Cross-auth recovery signature verified successfully");
        isChallengeValid = true;
      }
    } else {
      // Standard challenge validation
      console.log("Performing standard challenge validation");
      isChallengeValid = await ChallengeUtils.verifyChallenge({
        challenge,
        session: ctx.session,
        shareHash: recoveryKeyShare.recoveryBackupShareHash,
        now,
        solution: input.challengeSolution,
        publicKey: recoveryKeyShare.recoveryBackupSharePublicKey,
      });
    }

    if (!isChallengeValid) {
      // TODO: Add a wallet recovery attempt limit?
      // TODO: How to limit the # of recoveries per user?

      await ctx.prisma.$transaction(async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        const deleteChallengePromise = tx.challenge.delete({
          where: { id: challenge.id },
        });

        // Log failed recovery attempt:
        const registerWalletActivationAttemptPromise = tx.walletRecovery.create({
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: recoveryKeyShare.walletId,
            recoveryKeyShareId: recoveryKeyShare.id,
            deviceAndLocationId,
          },
        });

        return Promise.all([
          deleteChallengePromise,
          registerWalletActivationAttemptPromise,
        ]);
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    const [
      rotationChallenge,
      wallet,
    ] = await ctx.prisma.$transaction(async (tx) => {
      const deviceAndLocationId = await deviceAndLocationIdPromise;
      const dateNow = new Date();
      const challengeValue = generateChangeValue();
      const challengeUpsertData = {
        type: Config.CHALLENGE_TYPE,
        purpose: ChallengePurpose.SHARE_ROTATION,
        value: challengeValue,
        version: Config.CHALLENGE_VERSION,

        // Relations:
        userId: ctx.user.id,
        walletId: input.walletId,
      } as const satisfies Partial<Challenge>;

      const rotationChallengePromise = tx.challenge.upsert({
        where: {
          userChallenges: {
            userId: ctx.user.id,
            purpose: ChallengePurpose.SHARE_ROTATION,
          },
        },
        create: challengeUpsertData,
        update: challengeUpsertData,
      });

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: recoveryKeyShare.walletId,
        },
        data: {
          lastRecoveredAt: dateNow,
          totalRecoveries: { increment: 1 },
        },
      });

      // TODO: How to limit the # of recoveries per user?
      const registerWalletRecoveryPromise = tx.walletRecovery.create({
        data: {
          status: WalletUsageStatus.SUCCESSFUL,
          userId: ctx.user.id,
          walletId: recoveryKeyShare.walletId,
          recoveryKeyShareId: recoveryKeyShare.id,
          deviceAndLocationId,
        },
      });

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.all([
        rotationChallengePromise,
        updateWalletStatsPromise,
        registerWalletRecoveryPromise,
        deleteChallengePromise,
      ]);
    });

    console.log("Wallet recovery successful");

    return {
      wallet: wallet as DbWallet,
      recoveryAuthShare: recoveryKeyShare.recoveryAuthShare,
      rotationChallenge,
    };
  });
