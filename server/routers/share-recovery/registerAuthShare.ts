import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { ChallengePurpose, WalletUsageStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import {
  getShareHashValidator,
  getSharePublicKeyValidator,
  getShareValidator,
} from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { getSilentErrorLoggerFor } from "@/server/utils/error/error.utils";

export const RegisterAuthShareSchema = z.object({
  walletId: z.string().uuid(),
  authShare: getShareValidator(),
  deviceShareHash: getShareHashValidator(),
  deviceSharePublicKey: getSharePublicKeyValidator(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

export const registerAuthShare = protectedProcedure
  .input(RegisterAuthShareSchema)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    // This `SHARE_ROTATION` challenge will only exist if `recoverWallet` was called before.

    const challenge = await ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        walletId: input.walletId,
        purpose: ChallengePurpose.SHARE_ROTATION,
      },
      include: {
        wallet: true,
      },
    });

    if (!challenge) {
      console.warn(ErrorMessages.CHALLENGE_NOT_FOUND);

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
    }).catch(getSilentErrorLoggerFor("registerAuthShare's challenge.delete(...)"));

    const challengeErrorMessage = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: challenge.wallet.publicKey || null,
    });

    // TODO: Add a wallet activation attempt limit?

    if (challengeErrorMessage) {
      console.error(challengeErrorMessage);

      // TODO: Register the failed attempt anyway!

      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
      });
    }

    const dateNow = new Date();
    const nextRotationAt = new Date(
      dateNow.getTime() + Config.SHARE_ACTIVE_TTL_MS
    );

    const [wallet] = await ctx.prisma.$transaction(async (tx) => {
      const deviceAndLocationId = await deviceAndLocationIdPromise;

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: input.walletId,
        },
        data: {
          lastActivatedAt: dateNow,
          totalActivations: { increment: 1 },
        },
      });

      // When users go through recoverWallet, it means either they've lost the deviceShare or we actually lost the
      // WorkShare:
      //
      // - If they lost it, we do an UPDATE to avoid having duplicated WorkShares for the same device.
      // - If we lost it then there's no WorkShare to update, so we need to use upsert to do an INSERT in that case.

      const rotateOrCreateWorkKeyShareAndRegisterWalletActivationPromise =
        tx.workKeyShare
          .upsert({
            where: {
              userDeviceWorkShare: {
                userId: ctx.user.id,
                walletId: input.walletId,
                deviceNonce: ctx.session.deviceNonce,
              },
            },
            create: {
              authShare: input.authShare,
              deviceShareHash: input.deviceShareHash,
              deviceSharePublicKey: input.deviceSharePublicKey,
              userId: ctx.user.id,
              sessionId: ctx.session.id,
              walletId: input.walletId,
              deviceNonce: ctx.session.deviceNonce,
            },
            update: {
              authShare: input.authShare,
              deviceShareHash: input.deviceShareHash,
              deviceSharePublicKey: input.deviceSharePublicKey,
              sharesRotatedAt: dateNow,
              rotationWarnings: 0,
              sessionId: ctx.session.id,
            },
          })
          .then((workKeyShare) => {
            // TODO: How to limit the # of activations per user?
            return tx.walletActivation.create({
              data: {
                status: WalletUsageStatus.SUCCESSFUL,
                userId: ctx.user.id,
                walletId: input.walletId,
                workKeyShareId: workKeyShare.id,
                deviceAndLocationId,
              },
            });
          });

      return Promise.all([
        updateWalletStatsPromise,
        rotateOrCreateWorkKeyShareAndRegisterWalletActivationPromise,
      ]);
    });

    return {
      wallet: wallet as DbWallet,
      nextRotationAt,
    };
  });
