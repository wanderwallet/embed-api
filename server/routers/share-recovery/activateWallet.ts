import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, ChallengeType } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils, generateChangeValue } from "@/server/utils/challenge/challenge.utils";

const CONFIG_CHALLENGE_TYPE = process.env.CHALLENGE_TYPE as ChallengeType;
const CONFIG_CHALLENGE_VERSION = process.env.CHALLENGE_TYPE || "";

const CHALLENGE_TTL_MS = parseInt(process.env.CHALLENGE_TTL_MS || "0");
const SHARE_TTL_MS = parseInt(process.env.SHARE_TTL_MS || "0");
const SHARE_ROTATION_IGNORE_LIMIT = parseInt(process.env.SHARE_ROTATION_IGNORE_LIMIT || "0");

// TODO: We probably want to "load", validate and type ENV vars elsewhere:

if (isNaN(CHALLENGE_TTL_MS) && CHALLENGE_TTL_MS > 0) {
  throw Error("Invalid ENV variable: CHALLENGE_TTL_MS");
}

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
        deviceNonce: ctx.deviceNonce,
        walletId: input.walletId,
      },
    });

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        purpose: ChallengePurpose.ACTIVATION,
      },
    });

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

    const isChallengeValid = await ChallengeUtils.verifyActivationChallenge({
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

    if (workKeyShare.rotationWarnings >= SHARE_ROTATION_IGNORE_LIMIT) {
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

    const shouldRotate = now - workKeyShare.sharesRotatedAt.getTime() >= SHARE_TTL_MS;

    const [
      rotationChallenge
    ] = await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();
      const challengeValue = generateChangeValue();

      const rotationChallengePromise = shouldRotate ? ctx.prisma.challenge.create({
        data: {
          type: CONFIG_CHALLENGE_TYPE,
          purpose: ChallengePurpose.SHARE_ROTATION,
          value: challengeValue, // TODO: Update schema size if needed...
          version: CONFIG_CHALLENGE_VERSION,

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
          deviceAndLocationId: "",
          // TODO: Add device and location info (should be attached to JWT?)
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

    if (rotationChallenge === null) {
      console.log(rotationChallenge)
    }

    return {
      authShare: workKeyShare.authShare,
      rotationChallenge,
    };
  });
