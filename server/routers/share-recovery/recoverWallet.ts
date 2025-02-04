import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export const RecoverWalletSchema = z.object({
  walletId: z.string(),
  recoveryBackupShareHash: z.string(), // TODO: Validate length/format
  challengeSolution: z.string(),
});

export const recoverWallet = protectedProcedure
  .input(RecoverWalletSchema)
  .mutation(async ({ input, ctx }) => {
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

    // TODO: Should all procedures update Session info if data has changed?

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
      // TODO: Differentiate between invalid share and deleted share that was once valid.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WORK_SHARE_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      solution: input.challengeSolution,
      now,
    });

    if (!isChallengeValid) {
      // TODO: Add a wallet recovery attempt limit?
      // TODO: How to limit the # of recoveries per user?

      await ctx.prisma.$transaction(async (tx) => {
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

    await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();

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
      const registerWalletActivationPromise = tx.walletRecovery.create({
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

      return Promise.resolve([
        updateWalletStatsPromise,
        registerWalletActivationPromise,
        deleteChallengePromise,
      ]);
    });

    return {
      recoveryAuthShare: recoveryKeyShare.recoveryAuthShare,
    };
  });
