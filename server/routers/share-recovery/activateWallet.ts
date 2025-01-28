import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils, generateChangeValue } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const ActivateWalletSchema = z.object({
  walletId: z.string(),
  challengeSolution: z.string(),
});

export const activateWallet = protectedProcedure
  .input(ActivateWalletSchema)
  .mutation(async ({ input, ctx }) => {

    const now = Date.now();

    const workKeySharePromise = ctx.prisma.workKeyShare.findFirst({
      where: {
        userId: ctx.user.id,
        deviceNonce: ctx.deviceAndLocation.deviceNonce,
        walletId: input.walletId,
      },
    });

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        purpose: ChallengePurpose.ACTIVATION,
      },
    });

    // TODO: Should all procedures update DeviceAndLocation if data has changed?

    const [
      workKeyShare,
      challenge,
    ] = await Promise.all([
      workKeySharePromise,
      challengePromise,
    ]);

    if (!workKeyShare) {
      // The wallet must be recovered.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WORK_SHARE_NOT_FOUND,
      });
    }

    if (!challenge) {
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      solution: input.challengeSolution,
      now,
    });

    // TODO: Add a wallet activation attempt limit?

    if (!isChallengeValid) {
      // TODO: Register the failed attempt anyway!

      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    if (workKeyShare.rotationWarnings >= Config.SHARE_ROTATION_IGNORE_LIMIT) {
      // TODO: If rotationWarnings too high, delete workKeyShare...
      await ctx.prisma.workKeyShare.delete({
        where: {
          id: workKeyShare.id,
        },
      });

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const shouldRotate = now - workKeyShare.sharesRotatedAt.getTime() >= Config.SHARE_TTL_MS;

    const [
      rotationChallenge
    ] = await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();
      const challengeValue = generateChangeValue();

      const rotationChallengePromise = shouldRotate ? ctx.prisma.challenge.create({
        data: {
          type: Config.CHALLENGE_TYPE,
          purpose: ChallengePurpose.SHARE_ROTATION,
          value: challengeValue, // TODO: Update schema size if needed...
          version: Config.CHALLENGE_VERSION,

          // Relations:
          userId: ctx.user.id,
          walletId: ctx.user.id,
        },
      }) : null;

      const updateRotationWarningPromise = shouldRotate ? tx.workKeyShare.update({
        where: {
          id: workKeyShare.id,
        },
        data: {
          rotationWarnings: { increment: 1 },
        }
      }) : null;

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: workKeyShare.walletId,
        },
        data: {
          lastActivatedAt: dateNow,
          totalActivations: { increment: 1 },
        },
      });

      // TODO: How to limit the # of activations per user?
      const registerWalletActivationPromise = tx.walletActivation.create({
        data: {
          userId: ctx.user.id,
          walletId: workKeyShare.walletId,
          workKeyShareId: workKeyShare.id,
          deviceAndLocationId: ctx.deviceAndLocation.id,
        },
      });

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.resolve([
        rotationChallengePromise,
        updateRotationWarningPromise,
        updateWalletStatsPromise,
        registerWalletActivationPromise,
        deleteChallengePromise,
      ]);
    });

    return {
      authShare: workKeyShare.authShare,
      rotationChallenge,
    };
  });
