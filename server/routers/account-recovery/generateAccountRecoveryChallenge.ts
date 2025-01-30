import { publicProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, Challenge, ChallengePurpose, WalletStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const GenerateAccountRecoveryChallengeInputSchema = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Add proper validation
  userId: z.string()
});

// Note this is `publicProcedure`!

export const generateAccountRecoveryChallenge = publicProcedure
  .input(GenerateAccountRecoveryChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {

    const recoveryWallet = await ctx.prisma.wallet.findFirst({
      select: {
        id: true,
        userId: true,
      },
      where: {
        userId: input.userId,
        status: WalletStatus.ENABLED,
        chain: input.chain,
        address: input.address,
        canRecoverAccountSetting: true,
      },
    });

    if (!recoveryWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERABLE_ACCOUNTS_NOT_FOUND,
      });
    }

    const challengeValue = ChallengeUtils.generateChangeValue();
    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.ACCOUNT_RECOVERY,
      value: challengeValue, // TODO: Update schema size if needed...
      version: Config.CHALLENGE_VERSION,

      // Relations:
      userId: recoveryWallet.userId,
      walletId: recoveryWallet.id,
    } as const satisfies Partial<Challenge>;

    const accountRecoveryChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: recoveryWallet.userId,
          purpose: ChallengePurpose.ACCOUNT_RECOVERY,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    // TODO: Register the ongoing recovery already.

    return {
      accountRecoveryChallenge,
    };
  });
