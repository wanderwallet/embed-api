import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import {
  Challenge,
  ChallengePurpose,
  WalletStatus,
  WalletUsageStatus,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import {
  ChallengeUtils,
  generateChangeValue,
} from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { DbWallet } from "@/prisma/types/types";

export const ActivateWalletSchema = z.object({
  walletId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

export const activateWallet = protectedProcedure
  .input(ActivateWalletSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);
    const now = Date.now();

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        walletId: input.walletId,
        purpose: ChallengePurpose.ACTIVATION,
      },
    });

    const workKeySharePromise = ctx.prisma.workKeyShare.findFirst({
      where: {
        userId: ctx.user.id,
        deviceNonce: ctx.session.deviceNonce,
        walletId: input.walletId,
        wallet: {
          status: WalletStatus.ENABLED,
        },
      },
    });

    const [challenge, workKeyShare] = await Promise.all([
      challengePromise,
      workKeySharePromise,
    ]);

    if (!challenge) {
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    if (
      !workKeyShare ||
      workKeyShare.rotationWarnings >= Config.SHARE_MAX_ROTATION_IGNORES ||
      now - workKeyShare.sharesRotatedAt.getTime() >=
        Config.SHARE_INACTIVE_TTL_MS
    ) {
      if (workKeyShare) {
        // If `rotationWarnings` too high, or it's been too long since the share was last rotated, delete it:
        await ctx.prisma.workKeyShare.delete({
          where: {
            id: workKeyShare.id,
          },
        });
      }

      // At this point it's already too late. The wallet must be recovered:
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WORK_SHARE_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: workKeyShare.deviceShareHash,
      now,
      solution: input.challengeSolution,
      publicKey: workKeyShare.deviceSharePublicKey,
    });

    if (!isChallengeValid) {
      // TODO: Add a wallet activation attempt limit?
      // TODO: How to limit the # of activations per user?

      await ctx.prisma.$transaction(async (tx) => {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        const deleteChallengePromise = tx.challenge.delete({
          where: { id: challenge.id },
        });

        // Log failed activation attempt:
        const registerWalletActivationAttemptPromise =
          tx.walletActivation.create({
            data: {
              status: WalletUsageStatus.FAILED,
              userId: ctx.user.id,
              walletId: workKeyShare.walletId,
              workKeyShareId: workKeyShare.id,
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

    const shouldRotate =
      now - workKeyShare.sharesRotatedAt.getTime() >=
      Config.SHARE_ACTIVE_TTL_MS;

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

        const rotationChallengePromise = shouldRotate
          ? tx.challenge.upsert({
              where: {
                userChallenges: {
                  userId: ctx.user.id,
                  purpose: ChallengePurpose.SHARE_ROTATION,
                },
              },
              create: challengeUpsertData,
              update: challengeUpsertData,
            })
          : null;

        const updateWalletStatsPromise = tx.wallet.update({
          where: {
            id: workKeyShare.walletId,
          },
          data: {
            lastActivatedAt: dateNow,
            totalActivations: { increment: 1 },
          },
        });

        const updateRotationWarningPromise = shouldRotate
          ? tx.workKeyShare.update({
              where: {
                id: workKeyShare.id,
              },
              data: {
                rotationWarnings: { increment: 1 },
              },
            })
          : null;

        // TODO: How to limit the # of activations per user?
        const registerWalletActivationPromise = tx.walletActivation.create({
          data: {
            status: WalletUsageStatus.SUCCESSFUL,
            userId: ctx.user.id,
            walletId: workKeyShare.walletId,
            workKeyShareId: workKeyShare.id,
            deviceAndLocationId,
          },
        });

        const deleteChallengePromise = tx.challenge.delete({
          where: { id: challenge.id },
        });

        return Promise.all([
          rotationChallengePromise,
          updateWalletStatsPromise,
          updateRotationWarningPromise,
          registerWalletActivationPromise,
          deleteChallengePromise,
        ]);
      }
    );

    return {
      wallet: wallet as DbWallet,
      authShare: workKeyShare.authShare,
      rotationChallenge,
    };
  });
