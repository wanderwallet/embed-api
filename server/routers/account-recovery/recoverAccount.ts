
import { publicProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export const RecoverAccountSchema = z.object({
  userId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

// Note this is `publicProcedure`!

export const recoverAccount = publicProcedure
  .input(RecoverAccountSchema)
  .mutation(async ({ input, ctx }) => {
    // TODO: This procedure should be like a clone of `authenticate` but with the `userId` and `challengeSolution`
    // needed to link an existing user to the currently used authentication method, rather than creating a new one.

    const now = Date.now();

    const challenge = await ctx.prisma.challenge.findFirst({
      where: {
        userId: input.userId,
        purpose: ChallengePurpose.ACCOUNT_RECOVERY,
      },
      include: {
        wallet: true,
      }
    });

    if (!challenge) {
      // Just try again.

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    const isChallengeValid = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: challenge.wallet.publicKey || null,
    });

    // TODO: Add an account recovery attempt limit?

    if (!isChallengeValid) {
      // TODO: Register (update) the failed attempt anyway!

      await ctx.prisma.challenge.delete({
        where: { id: challenge.id },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.INVALID_CHALLENGE,
      });
    }

    const userDetails = await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();

      const registerAccountRecoveryPromise = tx.user.update({
        where: {
          id: challenge.userId,
        },
        data: {
          recoveredAt: dateNow,
        },
      });

      const recreateAuthMethodsPromise = tx.authMethod.deleteMany({
        where: {
          userId: challenge.userId,
        }
      }).then(() => {
        // TODO: Create Session, AuthMethod, JWT... just like with signUps.

        return tx.authMethod.create({
          data: { },
        });
      })

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      return Promise.resolve([
        registerAccountRecoveryPromise,
        recreateAuthMethodsPromise,
        deleteChallengePromise,
      ]);
    });

    return {
      userDetails,
    };
  });
