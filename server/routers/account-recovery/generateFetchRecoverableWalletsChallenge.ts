import { z } from "zod"
import { Chain } from '@prisma/client';
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";

export const GenerateFetchRecoverableAccountsChallenge = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Add proper validation
}).superRefine(async (data, ctx) => {
  // `chain` and `address` format match:
  const walletIssues = await validateWallet(data.chain, data.address);
  walletIssues.forEach(ctx.addIssue);
});

// Note this is `publicProcedure`!

export const generateFetchRecoverableWalletsChallenge = publicProcedure
  .input(GenerateFetchRecoverableAccountsChallenge)
  .mutation(async ({ input, ctx }) => {

    // We do not check if there are recoverable accounts with the input wallet to prevent
    // enumeration by passing only the chain and address. The user trying to recover account
    // will know, from fetchRecoverableAccounts(), if there are recoverable accounts or not
    // linked to that wallet, but only after they prove they have access to such wallet (with the challenge).

    const challengeValue = ChallengeUtils.generateChangeValue();

    const fetchRecoverableWalletsChallenge = await ctx.prisma.anonChallenge.create({
      data: {
        value: challengeValue, // TODO: Update schema size if needed...
        version: Config.CHALLENGE_VERSION,
        chain: input.chain,
        address: input.address,
      },
    });

    return {
      fetchRecoverableWalletsChallenge,
    };
  });
