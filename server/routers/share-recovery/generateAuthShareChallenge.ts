import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, ChallengeType } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

const CONFIG_CHALLENGE_TYPE = process.env.CHALLENGE_TYPE as ChallengeType;
const CONFIG_CHALLENGE_VERSION = process.env.CHALLENGE_TYPE || "";

// TODO: We probably want to "load", validate and type ENV vars elsewhere:

if (!(CONFIG_CHALLENGE_TYPE in ChallengeType)) {
  throw Error("Invalid ENV variable: CHALLENGE_TYPE");
}

if (!CONFIG_CHALLENGE_VERSION) {
  throw Error("Invalid ENV variable: CONFIG_CHALLENGE_VERSION");
}

export const GenerateAuthShareChallengeInputSchema = z.object({
  walletId: z.string()
});

export const generateAuthShareChallenge = protectedProcedure
  .input(GenerateAuthShareChallengeInputSchema)
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

    const activationChallenge = await ctx.prisma.challenge.create({
      data: {
        type: CONFIG_CHALLENGE_TYPE,
        purpose: ChallengePurpose.ACTIVATION,
        value: challengeValue, // TODO: Update schema size if needed...
        version: CONFIG_CHALLENGE_VERSION,

        // Relations:
        userId: ctx.user.id,
        walletId: userWallet.id,
      },
    });

    return {
      activationChallenge,
    };
  });
