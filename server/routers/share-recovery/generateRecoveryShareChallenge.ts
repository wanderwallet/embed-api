import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Challenge, ChallengePurpose } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const GenerateRecoveryShareChallengeInputSchema = z.object({
  walletId: z.string()
});

export const generateRecoveryShareChallenge = protectedProcedure
  .input(GenerateRecoveryShareChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {

    // Make sure the user is the owner of the wallet:
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true },
      where: {
        // TODO: Do I need to add userIds or are they implicit?
        userId: ctx.user.id,
        id: input.walletId,
      },
    });

    if (!userWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    const challengeValue = ChallengeUtils.generateChangeValue();
    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.SHARE_RECOVERY,
      value: challengeValue, // TODO: Update schema size if needed...
      version: Config.CHALLENGE_VERSION,

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    } as const satisfies Partial<Challenge>;

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
