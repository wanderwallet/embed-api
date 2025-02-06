import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const RotateAuthShareSchema = z.object({
  walletId: z.string(),
  authShare: z.string(), // TODO: Validate length/format
  deviceShareHash: z.string(), // TODO: Validate length/format
  deviceSharePublicKey: z.string(), // TODO: Validate length/format
  challengeSolution: z.string(),
});

export const rotateAuthShare = protectedProcedure
  .input(RotateAuthShareSchema)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

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

    // TODO: Should all procedures update Session info if data has changed?

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

    await ctx.prisma.$transaction(async (tx) => {
      const rotateWorkKeySharePromise = tx.workKeyShare.update({
        where: {
          userSessionWorkShare: {
            userId: ctx.user.id,
            sessionId: ctx.session.id,
            walletId: input.walletId,
          },
        },
        data: {
          sharesRotatedAt: dateNow,
          rotationWarnings: 0,
          authShare: input.authShare,
          deviceShareHash: input.deviceShareHash,
          deviceSharePublicKey: input.deviceSharePublicKey,
        }
      });

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.resolve([
        rotateWorkKeySharePromise,
        deleteChallengePromise,
      ]);
    });

    return {
      nextRotationAt,
    };
  });
