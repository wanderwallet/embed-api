import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { Challenge, ChallengePurpose, WalletUsageStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import {
  ChallengeUtils,
  generateChangeValue,
} from "@/server/utils/challenge/challenge.utils";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { BackupUtils } from "@/server/utils/backup/backup.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getShareHashValidator } from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { createHash } from "crypto";

export const RecoverWalletSchema = z
  .object({
    walletId: z.string().uuid(),
    recoveryBackupShareHash: getShareHashValidator().optional(),
    recoveryBackupShare: z.string().optional(),
    recoveryFileServerSignature: z.string().length(684).optional(), // RSA 4096 signature => 512 bytes => 684 characters in base64
    challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
  })
  .superRefine((data, ctx) => {
    // If recoveryBackupShare is provided, we'll compute the hash, so no need for recoveryBackupShareHash
    const hasBackupShareHash = !!data.recoveryBackupShareHash || !!data.recoveryBackupShare;
    const hasFileServerSignature = !!data.recoveryFileServerSignature;

    if (hasBackupShareHash !== hasFileServerSignature) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Both recoveryBackupShare/recoveryBackupShareHash and recoveryFileServerSignature must be provided together.",
        path: ["recoveryBackupShareHash", "recoveryFileServerSignature"],
      });
    }
  });

// Helper function to generate hash from recoveryBackupShare
function calculateShareHash(recoveryBackupShare: string): string {
  return createHash('sha256').update(recoveryBackupShare).digest('base64');
}

export const recoverWallet = protectedProcedure
  .input(RecoverWalletSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);
    const now = Date.now();

    console.log(`Starting wallet recovery for wallet: ${input.walletId}, user: ${ctx.user.id}`);

    // If recoveryBackupShare is provided, calculate its hash
    let recoveryBackupShareHash = input.recoveryBackupShareHash;
    if (input.recoveryBackupShare && !recoveryBackupShareHash) {
      console.log('Computing hash from recoveryBackupShare');
      recoveryBackupShareHash = calculateShareHash(input.recoveryBackupShare);
      console.log(`Computed hash: ${recoveryBackupShareHash.substring(0, 10)}...`);
    }

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        walletId: input.walletId,
        purpose: ChallengePurpose.SHARE_RECOVERY,
      },
    });

    const recoveryKeySharePromise = recoveryBackupShareHash
      ? ctx.prisma.recoveryKeyShare.findFirst({
          where: {
            userId: ctx.user.id,
            walletId: input.walletId,
            recoveryBackupShareHash: recoveryBackupShareHash,
          },
        })
      : null;

    const [challenge, recoveryKeyShare] = await Promise.all([
      challengePromise,
      recoveryKeySharePromise,
    ]);

    console.log(`Challenge found: ${!!challenge}, Recovery key share found: ${!!recoveryKeyShare}`);

    if (!challenge) {
      // Just try again.
      console.error(`Challenge not found for wallet: ${input.walletId}, user: ${ctx.user.id}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    if (
      !recoveryKeyShare &&
      recoveryBackupShareHash &&
      input.recoveryFileServerSignature
    ) {
      console.log(`Verifying recovery file signature for wallet: ${input.walletId}`);
      try {
        const isSignatureValid = await BackupUtils.verifyRecoveryFileSignature({
          walletId: input.walletId,
          recoveryBackupShareHash: recoveryBackupShareHash,
          recoveryFileServerSignature: input.recoveryFileServerSignature,
        });

        if (isSignatureValid) {
          console.log(`Recovery file signature valid for wallet: ${input.walletId}`);
          return {
            recoveryAuthShare: null,
            recoveryBackupServerPublicKey: Config.BACKUP_FILE_PUBLIC_KEY,
          };
        }
        
        console.error(`Invalid recovery file signature for wallet: ${input.walletId}`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: ErrorMessages.WORK_SHARE_NOT_FOUND,
        });
      } catch (error: any) {
        console.error('Error during signature verification:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying recovery file: ${error.message || 'Unknown error'}`,
        });
      }
    }

    // Look up wallet without userId constraint to allow recovering shared wallets
    const walletQuery = await ctx.prisma.wallet.findFirst({
      select: { id: true, publicKey: true, userId: true },
      where: {
        id: input.walletId,
        // Removed userId constraint to allow recovering shared wallets
      },
    });

    console.log(`Wallet found: ${!!walletQuery}, owner: ${walletQuery?.userId}, current user: ${ctx.user.id}`);

    const publicKey =
      recoveryKeyShare?.recoveryBackupSharePublicKey ||
      walletQuery?.publicKey ||
      null;

    console.log(`Using public key from: ${
      recoveryKeyShare ? 'recovery key share' : 
      (walletQuery?.publicKey ? 'wallet' : 'none')
    }`);

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: recoveryKeyShare?.recoveryBackupShareHash || recoveryBackupShareHash || null,
      now,
      solution: input.challengeSolution,
      publicKey,
    });

    console.log(`Challenge validation result: ${isChallengeValid}`);

    if (!isChallengeValid) {
      // TODO: Add a wallet recovery attempt limit?
      // TODO: How to limit the # of recoveries per user?

      await ctx.prisma.$transaction(async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        const deleteChallengePromise = tx.challenge.delete({
          where: { id: challenge.id },
        });

        // Log failed recovery attempt:
        const registerWalletActivationAttemptPromise = tx.walletRecovery.create(
          {
            data: {
              status: WalletUsageStatus.FAILED,
              userId: ctx.user.id,
              walletId: recoveryKeyShare?.walletId || input.walletId,
              recoveryKeyShareId: recoveryKeyShare?.id || null,
              deviceAndLocationId,
            },
          }
        );

        return Promise.all([
          deleteChallengePromise,
          registerWalletActivationAttemptPromise,
        ]);
      });

      console.error(`Invalid challenge solution for wallet: ${input.walletId}`);
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    try {
      const [rotationChallenge, wallet] = await ctx.prisma.$transaction(
        async (tx) => {
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
              id: input.walletId,
              // Removed userId constraint to allow recovering shared wallets 
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
              walletId: recoveryKeyShare?.walletId || input.walletId,
              recoveryKeyShareId: recoveryKeyShare?.id || null,
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
        }
      );

      console.log(`Wallet recovery successful for wallet: ${input.walletId}`);

      return {
        wallet: wallet as DbWallet,
        recoveryAuthShare: recoveryKeyShare?.recoveryAuthShare,
        rotationChallenge,
      };
    } catch (error) {
      console.error(`Error during wallet recovery transaction for ${input.walletId}:`, error);
      throw error;
    }
  });
