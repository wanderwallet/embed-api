import { z } from "zod";
import { UserDetailsPrivacySetting, WalletStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { RecoverableAccount } from "@/prisma/types/types";
import { getSilentErrorLoggerFor } from "@/server/utils/error/error.utils";

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
        id: input.challengeId,
      },
    });

    if (!anonChallenge) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    // No await, just fail silently. Even if we return an error, this `anonChallenge` will remain orphan, and the user will have to retry, so it's better to
    // just let them complete this request:

    ctx.prisma.anonChallenge.delete({
      where: {
        id: input.challengeId,
      },
    }).catch(getSilentErrorLoggerFor("fetchRecoverableAccounts's challenge.delete(...)"));

    const recoverableAccounts = await ctx.prisma.userProfile.findMany({
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

    if (recoverableAccounts.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERY_ACCOUNTS_NOT_FOUND,
      });
    }

    const publicKey = recoverableAccounts[0].wallets?.[0]?.publicKey;

    if (!publicKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERY_MISSING_PUBLIC_KEY,
      });
    }

    const challengeErrorMessage = await ChallengeUtils.verifyChallenge({
      challenge: anonChallenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey,
    });

    if (challengeErrorMessage) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
      });
    }

    const filteredRecoverableAccounts = recoverableAccounts.map(
      (recoverableAccount) => {
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
          name: userDetailsRecoveryPrivacy.includes(
            UserDetailsPrivacySetting.NAME
          )
            ? name
            : null,
          email: userDetailsRecoveryPrivacy.includes(
            UserDetailsPrivacySetting.EMAIL
          )
            ? email || supEmail
            : null,
          phone: userDetailsRecoveryPrivacy.includes(
            UserDetailsPrivacySetting.PHONE
          )
            ? phone || supPhone
            : null,
          picture: userDetailsRecoveryPrivacy.includes(
            UserDetailsPrivacySetting.PICTURE
          )
            ? picture
            : null,
        };

        return filteredRecoverableAccount;
      }
    );

    return {
      recoverableAccounts: filteredRecoverableAccounts,
    };
  });
