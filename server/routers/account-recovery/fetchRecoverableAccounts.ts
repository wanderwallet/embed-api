import { z } from "zod"
import { UserDetailsPrivacySetting, WalletStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";

export interface RecoverableAccount {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  picture: string | null;
}

export const FetchRecoverableAccounts = z.object({
  challengeId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
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
      const recoverableAccountsPromise = tx.userProfile.findMany({
        select: {
          supId: true,
          supEmail: true,
          supPhone: true,
          name: true,
          email: true,
          phone: true,
          picture: true,
          userDetailsRecoveryPrivacy: true,
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

    const filteredRecoverableAccounts = recoverableAccounts.map((recoverableAccount) => {
      const {
        supId,
        supEmail,
        supPhone,
        name,
        email,
        phone,
        picture,
        userDetailsRecoveryPrivacy,
      } = recoverableAccount;

      const filteredRecoverableAccount: RecoverableAccount = {
        userId: supId,
        name: userDetailsRecoveryPrivacy.includes(UserDetailsPrivacySetting.NAME) ? name : null,
        email: userDetailsRecoveryPrivacy.includes(UserDetailsPrivacySetting.EMAIL) ? (email || supEmail) : null,
        phone: userDetailsRecoveryPrivacy.includes(UserDetailsPrivacySetting.PHONE) ? (phone || supPhone) : null,
        picture: userDetailsRecoveryPrivacy.includes(UserDetailsPrivacySetting.PICTURE) ? picture : null,
      };

      return filteredRecoverableAccount;
    });

    return {
      recoverableAccounts: filteredRecoverableAccounts,
    };
  });
