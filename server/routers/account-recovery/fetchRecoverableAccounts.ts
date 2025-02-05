import { z } from "zod"
import { WalletStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export const FetchRecoverableAccounts = z.object({
  challengeId: z.string(),
  challengeSolution: z.string(),
});

// Note this is `publicProcedure`!

export const fetchRecoverableAccounts = publicProcedure
  .input(FetchRecoverableAccounts)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

    const anonChallenge = await ctx.prisma.anonChallenge.findFirst({
      where: {
        id: input.challengeId
      },
    });

    if (!anonChallenge) {
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const [
      recoverableAccounts
    ] = await ctx.prisma.$transaction(async (tx) => {
      const recoverableAccountsPromise = tx.user.findMany({
        select: {
          id: true,
          name: true,
          email: true, // TODO: Add privacy setting for this?
          // TODO: Add picture?
          wallets: {
            select: {
              publicKey: true,
            },
          },
        },
        where: {
          wallets: {
            some: {
              canRecoverAccountSetting: true,
              status: WalletStatus.ENABLED,
              chain: anonChallenge.chain,
              address: anonChallenge.address,
            },
          },
        },
      });

      const deleteChallengePromise = tx.anonChallenge.delete({
        where: {
          id: input.challengeId
        },
      });

      return Promise.all([
        recoverableAccountsPromise,
        deleteChallengePromise,
      ]);
    });

    if (recoverableAccounts.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERABLE_ACCOUNTS_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge: anonChallenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: recoverableAccounts[0].wallets[0].publicKey || null,
    });

    if (!isChallengeValid) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    return {
      recoverableAccounts,
    };
  });
