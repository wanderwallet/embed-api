import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { UpsertChallengeData } from "@/server/utils/challenge/challenge.types";

export const GenerateWalletRecoveryChallengeInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const generateWalletRecoveryChallenge = protectedProcedure
  .input(GenerateWalletRecoveryChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true, status: true },
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      if (userWallet) {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        // Log recovery attempt of a non-ENABLED wallet:
        await ctx.prisma.walletRecovery.create({
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: userWallet.id,
            recoveryKeyShareId: null,
            deviceAndLocationId,
          },
        });
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    const challengeValue = ChallengeUtils.generateChangeValue();
    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.SHARE_RECOVERY,
      value: challengeValue,
      version: Config.CHALLENGE_VERSION,
      createdAt: new Date(),

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    } as const satisfies UpsertChallengeData;

    const shareRecoveryChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: ctx.user.id,
          purpose: ChallengePurpose.SHARE_RECOVERY,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    return {
      shareRecoveryChallenge,
    };
  });
