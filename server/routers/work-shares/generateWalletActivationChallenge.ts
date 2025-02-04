import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Challenge, ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const GenerateWalletActivationChallengeInputSchema = z.object({
  walletId: z.string()
});

export const generateWalletActivationChallenge = protectedProcedure
  .input(GenerateWalletActivationChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {

    // Make sure the user is the owner of the wallet:
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true, status: true },
      where: {
        // TODO: Do I need to add userIds or are they implicit?
        userId: ctx.user.id,
        id: input.walletId,
      },
    });

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      if (userWallet) {
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

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    const challengeValue = ChallengeUtils.generateChangeValue();
    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.ACTIVATION,
      value: challengeValue, // TODO: Update schema size if needed...
      version: Config.CHALLENGE_VERSION,

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    } as const satisfies Partial<Challenge>;

    const activationChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: ctx.user.id,
          purpose: ChallengePurpose.SHARE_ROTATION,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    return {
      activationChallenge,
    };
  });
