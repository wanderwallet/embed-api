import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { ChallengePurpose, WalletStatus, WalletUsageStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { BackupUtils } from "@/server/utils/backup/backup.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getShareHashValidator } from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { getSilentErrorLoggerFor } from "@/server/utils/error/error.utils";

export const RecoverWalletSchema = z
  .object({
    walletId: z.string().uuid(),
    recoveryBackupShareHash: getShareHashValidator().optional(),
    recoveryFileServerSignature: z.string().length(684).optional(), // RSA 4096 signature => 512 bytes => 684 characters in base64
    challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
  })
  .superRefine((data, ctx) => {
    const hasBackupShareHash = !!data.recoveryBackupShareHash;
    const hasFileServerSignature = !!data.recoveryFileServerSignature;

    if (hasBackupShareHash !== hasFileServerSignature) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Both recoveryBackupShareHash and recoveryFileServerSignature must be provided together.",
        path: ["recoveryBackupShareHash", "recoveryFileServerSignature"],
      });
    }
  });

export const recoverWallet = protectedProcedure
  .input(RecoverWalletSchema)
  .mutation(async ({ input, ctx }) => {
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

    const recoveryKeySharePromise = input.recoveryBackupShareHash
      ? ctx.prisma.recoveryKeyShare.findFirst({
          select: {
            id: true,
            recoveryAuthShare: true,
            recoveryBackupShareHash: true,
            recoveryBackupSharePublicKey: true,

            wallet: {
              select: {
                id: true,
                status: true,
                publicKey: true,
              }
            },
          },
          where: {
            userId: ctx.user.id,
            walletId: input.walletId,
            recoveryBackupShareHash: input.recoveryBackupShareHash,
          },
        })
      : null;

    const walletPromise = !input.recoveryBackupShareHash
      ? ctx.prisma.wallet.findFirst({
          select: {
            id: true,
            status: true,
            publicKey: true,
          },
          where: {
            id: input.walletId,
            userId: ctx.user.id,
          },
        })
      : null;

    const [
      challenge,
      recoveryKeyShare,
      wallet,
    ] = await Promise.all([
      challengePromise,
      recoveryKeySharePromise,
      walletPromise,
    ]);

    const userWallet = recoveryKeyShare?.wallet || wallet;
    const walletPublicKey = userWallet?.publicKey;

    // If both `walletId` and `recoveryBackupShareHash` are provided, AND `recoveryBackupSharePublicKey` is
    // EdDSA, we validate a v2 challenge, otherwise a v1 challenge.
    //
    // Note this will temporarily break the previous version, where only `walletId` was required to load a
    // RecoveryKeyShare.

    const verificationPublicKey = recoveryKeyShare?.recoveryBackupSharePublicKey || userWallet?.publicKey;

    if (!challenge) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    // No await, just fail silently. Regardless of whether there challenge is valid or not, it is one-time-use only, so at this point we can delete it already.
    // We don't care if there's an error because if there is, the challenge will remain in the DB until it is upserted (updated) once the user re-tries, so it's
    // better to just let them complete this request:

    ctx.prisma.challenge.delete({
      where: { id: challenge.id },
    }).catch(getSilentErrorLoggerFor("recoverWallet's challenge.delete(...)"));

    if (
      !recoveryKeyShare &&
      input.recoveryBackupShareHash &&
      input.recoveryFileServerSignature
    ) {
      const isSignatureValid = await BackupUtils.verifyRecoveryFileSignature({
        walletId: input.walletId,
        recoveryBackupShareHash: input.recoveryBackupShareHash,
        recoveryFileServerSignature: input.recoveryFileServerSignature,
      });

      if (isSignatureValid) {
        return {
          recoveryAuthShare: null,
          recoveryBackupServerPublicKey: Config.BACKUP_FILE_PUBLIC_KEY,
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERY_SHARE_NOT_FOUND,
      });
    }

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      throw new TRPCError(userWallet ? {
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      } : {
        code: "FORBIDDEN",
        message: ErrorMessages.WALLET_NOT_ENABLED,
      });
    }

    if (!walletPublicKey || !verificationPublicKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_MISSING_PUBLIC_KEY,
      });
    }

    const challengeErrorMessage = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: recoveryKeyShare?.recoveryBackupShareHash || null,
      now,
      solution: input.challengeSolution,
      publicKey: verificationPublicKey,
    });

    if (challengeErrorMessage) {
      // TODO: Add a wallet recovery attempt limit?
      // TODO: How to limit the # of recoveries per user?

      const deviceAndLocationId = await deviceAndLocationIdPromise;

      // Log failed recovery attempt:
      await ctx.prisma.walletRecovery.create(
        {
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: userWallet.id,
            recoveryKeyShareId: recoveryKeyShare?.id || null,
            deviceAndLocationId,
          },
        }
      );

      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
      });
    }

    const [rotationChallenge, updatedWallet] = await ctx.prisma.$transaction(
      async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        const challengeUpsertData = ChallengeUtils.generateChallengeUpsertData({
          purpose: ChallengePurpose.SHARE_ROTATION,
          publicKey: walletPublicKey,
          ip: ctx.session.ip,

          // Relations:
          userId: ctx.user.id,
          walletId: input.walletId,
        });

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
          where: { id: input.walletId },
          data: {
            lastRecoveredAt: new Date(),
            totalRecoveries: { increment: 1 },
          },
        });

        // TODO: How to limit the # of recoveries per user?
        const registerWalletRecoveryPromise = tx.walletRecovery.create({
          data: {
            status: WalletUsageStatus.SUCCESSFUL,
            userId: ctx.user.id,
            walletId: userWallet.id,
            recoveryKeyShareId: recoveryKeyShare?.id || null,
            deviceAndLocationId,
          },
        });

        return Promise.all([
          rotationChallengePromise,
          updateWalletStatsPromise,
          registerWalletRecoveryPromise,
        ]);
      }
    );

    return {
      wallet: updatedWallet as DbWallet,
      recoveryAuthShare: recoveryKeyShare?.recoveryAuthShare,
      rotationChallenge,
    };
  });
