import { publicProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, ChallengePurpose, WalletStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";
import { UpsertChallengeData } from "@/server/utils/challenge/challenge.types";

export const GenerateAccountRecoveryChallengeInputSchema = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(),
  userId: z.string().uuid(),
}).superRefine(async (data, ctx) => {
  // `chain` and `address` format match:
  const walletIssues = await validateWallet(data.chain, data.address);
  walletIssues.forEach(ctx.addIssue);
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
      value: challengeValue,
      version: Config.CHALLENGE_VERSION,
      createdAt: new Date(),

      // Relations:
      userId: recoveryWallet.userId,
      walletId: recoveryWallet.id,
    } as const satisfies UpsertChallengeData;

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
