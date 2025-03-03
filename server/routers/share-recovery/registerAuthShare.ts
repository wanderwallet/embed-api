import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getShareHashValidator, getSharePublicKeyValidator, getShareValidator } from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

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

    // TODO: If there were any other work shares on this device for this wallet, delete them.

    // TODO: This wallet needs to be regenerated as well and the authShare updated. If this is not done after X
    // "warnings", the Shards entry will be removed anyway.


    // This `SHARE_ROTATION` challenge will only exist if `activateWallet` created it automatically when
    // `shouldRotate = now - workKeyShare.sharesRotatedAt.getTime() >= Config.SHARE_ACTIVE_TTL_MS`, so we don't need to
    // check that condition again here. It's also `activateWallet` where shares are deleted if the rotation warnings
    // have been ignored for too long.

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
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: challenge.wallet.publicKey || null,
    });

    // TODO: Add a wallet activation attempt limit?

    if (!isChallengeValid) {
      // TODO: Register the failed attempt anyway!

      await ctx.prisma.challenge.delete({
        where: { id: challenge.id },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    const dateNow = new Date();
    const nextRotationAt = new Date(dateNow.getTime() + Config.SHARE_ACTIVE_TTL_MS);

    const [
      wallet
    ] = await ctx.prisma.$transaction(async (tx) => {
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

      // When users go throw recoverWallet, it means either they've lost the work share or WE lost it. If we lost it,
      // then there's no work share to update here, so we need to do an upsert:

      const rotateOrCreateWorkKeyShareAndRegisterWalletActivationPromise = tx.workKeyShare.upsert({
        where: {
          userSessionWorkShare: {
            userId: ctx.user.id,
            sessionId: ctx.session.id,
            walletId: input.walletId,
          },
        },
        create: {
          authShare: input.authShare,
          deviceShareHash: input.deviceShareHash,
          deviceSharePublicKey: input.deviceSharePublicKey,
          userId: ctx.user.id,
          sessionId: ctx.session.id,
          walletId: input.walletId,
        },
        update: {
          authShare: input.authShare,
          deviceShareHash: input.deviceShareHash,
          deviceSharePublicKey: input.deviceSharePublicKey,
          sharesRotatedAt: dateNow,
          rotationWarnings: 0,
        },
      }).then((workKeyShare) => {
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

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.all([
        updateWalletStatsPromise,
        rotateOrCreateWorkKeyShareAndRegisterWalletActivationPromise,
        deleteChallengePromise,
      ]);
    });

    return {
      wallet: wallet as DbWallet,
      nextRotationAt,
    };
  });
