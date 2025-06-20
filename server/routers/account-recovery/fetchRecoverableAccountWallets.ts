import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export const FetchRecoverableAccounts = z.object({
  userId: z.string().uuid(),
  challengeId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

// Note this is `publicProcedure`!

export const fetchRecoverableAccountWallets = publicProcedure
  .input(FetchRecoverableAccounts)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

    const anonChallenge = await ctx.prisma.anonChallenge.findFirst({
      where: {
        id: input.challengeId,
      },
    });

    if (!anonChallenge) {
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const [recoverableAccountWallets] = await ctx.prisma.$transaction(
      async (tx) => {
        const recoverableAccountWalletsPromise = tx.wallet.findMany({
          select: {
            publicKey: true,
            canBeRecovered: true,
            address: true,
          },
          where: {
            userId: input.userId,
          },
        });

        const deleteChallengePromise = tx.anonChallenge.delete({
          where: {
            id: input.challengeId,
          },
        });

        return Promise.all([
          recoverableAccountWalletsPromise,
          deleteChallengePromise,
        ]);
      }
    );

    if (recoverableAccountWallets.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERABLE_ACCOUNT_WALLETS_NOT_FOUND,
      });
    }

    const challengeErrorMessage = await ChallengeUtils.verifyChallenge({
      challenge: anonChallenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey:
        recoverableAccountWallets.find(
          (w) => w.address === anonChallenge.address
        )?.publicKey || null,
    });

    if (challengeErrorMessage) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
      });
    }

    const finalRecoverableAccountWallets = recoverableAccountWallets.map(
      (w) => ({
        canBeRecovered: w.canBeRecovered,
        address: w.address,
      })
    );

    return {
      recoverableAccountWallets: finalRecoverableAccountWallets,
    };
  });
