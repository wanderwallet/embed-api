
import { publicProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export const RecoverAccountSchema = z.object({
  userId: z.string(),
  challengeSolution: z.string(),
});

// Note this is `publicProcedure`!

export const recoverAccount = publicProcedure
  .input(RecoverAccountSchema)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

    // TODO: Should all procedures update Session info if data has changed?

    const challenge = await ctx.prisma.challenge.findFirst({
      where: {
        userId: input.userId,
        purpose: ChallengePurpose.ACCOUNT_RECOVERY,
      },
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
      solution: input.challengeSolution,
      now,
      // TODO: Pass public key
    });

    // TODO: Add an account recovery attempt limit?

    if (!isChallengeValid) {
      // TODO: Register (update) the failed attempt anyway!
      // TODO: Delete challenges when failed too.

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

      const deleteAuthMethodsPromise = tx.authMethod.deleteMany({
        where: {
          userId: challenge.userId,
        }
      });

      const deleteChallengePromise = tx.challenge.delete({
        where: { id: challenge.id },
      });

      const [registerAccountRecovery] = await Promise.resolve([
        registerAccountRecoveryPromise,
        deleteAuthMethodsPromise,
        deleteChallengePromise,
      ]);

      // TODO: Create Session, AuthMethod, JWT... just like with signUps.

      await tx.authMethod.create({
        data: { },
      });

      return registerAccountRecovery;
    });

    return {
      userDetails,
    };
  });
