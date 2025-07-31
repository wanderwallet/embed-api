import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

export const GenerateWalletActivationChallengeInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const generateWalletActivationChallenge = protectedProcedure
  .input(GenerateWalletActivationChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    const workKeyShare = await ctx.prisma.workKeyShare.findFirst({
      select: {
        deviceSharePublicKey: true,
        wallet: {
          select: {
            id: true,
            status: true,
          }
        },
      },
      where: {
        userId: ctx.user.id,
        deviceNonce: ctx.session.deviceNonce,
        walletId: input.walletId,
      },
    });

    const userWallet = workKeyShare?.wallet;

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      if (userWallet) {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        // Log activation attempt of a non-ENABLED wallet:
        await ctx.prisma.walletActivation.create({
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: userWallet.id,
            workKeyShareId: null,
            deviceAndLocationId,
          },
        });
      }

      throw new TRPCError(userWallet ? {
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      } : {
        code: "FORBIDDEN",
        message: ErrorMessages.WALLET_NOT_ENABLED,
      });
    }

    const challengeUpsertData = ChallengeUtils.generateChallengeUpsertData({
      purpose: ChallengePurpose.ACTIVATION,
      publicKey: workKeyShare.deviceSharePublicKey,
      ip: ctx.session.ip,

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    });

    const activationChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: ctx.user.id,
          purpose: ChallengePurpose.ACTIVATION,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    return {
      activationChallenge,
    };
  });
