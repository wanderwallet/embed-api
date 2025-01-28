import { z } from "zod"
import { Chain, ChallengePurpose } from '@prisma/client';
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";

export const GenerateFetchRecoverableAccountsChallenge = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Add proper validation
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

    // TODO: Create new table:
    const fetchRecoverableWalletsChallenge = await ctx.prisma.anonChallenges.create({
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.SHARE_RECOVERY,
      value: challengeValue, // TODO: Update schema size if needed...
      version: Config.CHALLENGE_VERSION,
      chain: input.chain,
      address: input.address,
    });

    return {
      fetchRecoverableWalletsChallenge,
    };
  });
