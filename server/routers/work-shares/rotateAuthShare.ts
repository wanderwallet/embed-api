import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { ChallengePurpose, WalletStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import {
  getShareHashValidator,
  getSharePublicKeyValidator,
  getShareValidator,
} from "@/server/utils/share/share.validators";

export const RotateAuthShareSchema = z.object({
  walletId: z.string().uuid(),
  authShare: getShareValidator(),
  deviceShareHash: getShareHashValidator(),
  deviceSharePublicKey: getSharePublicKeyValidator(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

export const rotateAuthShare = protectedProcedure
  .input(RotateAuthShareSchema)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

    // This `SHARE_ROTATION` challenge will only exist if `activateWallet` created it automatically when
    // `shouldRotate = now - workKeyShare.sharesRotatedAt.getTime() >= Config.SHARE_ACTIVE_TTL_MS`, so we don't need to
    // check that condition again here. It's also `activateWallet` where shares are deleted if the rotation warnings
    // have been ignored for too long.

    const challengePromise = ctx.prisma.challenge.findFirst({
      where: {
        userId: ctx.user.id,
        walletId: input.walletId,
        purpose: ChallengePurpose.SHARE_ROTATION,
      },
      include: {
        wallet: true,
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    if (!workKeyShare) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WORK_SHARE_NOT_FOUND,
      });
    }

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
      // TODO: Register the failed attempt anyway!

      await ctx.prisma.challenge.delete({
          where: { id: challenge.id },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
      });
    }

    const dateNow = new Date();
    const nextRotationAt = new Date(
      dateNow.getTime() + Config.SHARE_ACTIVE_TTL_MS
    );

    await ctx.prisma.$transaction(async (tx) => {
      const rotateWorkKeySharePromise = tx.workKeyShare.update({
        where: {
          userDeviceWorkShare: {
            userId: ctx.user.id,
            walletId: input.walletId,
            deviceNonce: ctx.session.deviceNonce,
          },
        },
        data: {
          sharesRotatedAt: dateNow,
          rotationWarnings: 0,
          authShare: input.authShare,
          deviceShareHash: input.deviceShareHash,
          deviceSharePublicKey: input.deviceSharePublicKey,
          sessionId: ctx.session.id,
        },
      });

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.all([rotateWorkKeySharePromise, deleteChallengePromise]);
    });

    return {
      nextRotationAt,
    };
  });
