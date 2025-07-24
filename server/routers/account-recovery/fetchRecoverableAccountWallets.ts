import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { publicProcedure } from "@/server/trpc";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { getSilentErrorLoggerFor } from "@/server/utils/error/error.utils";
import { WalletPrivacySetting, WalletStatus } from "@prisma/client";

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
    }).catch(getSilentErrorLoggerFor("fetchRecoverableAccountWallets's challenge.delete(...)"));

    const recoverableAccountWallets = await ctx.prisma.wallet.findMany({
      select: {
        publicKey: true,
        canBeRecovered: true,
        address: true,
      },
      where: {
        userId: input.userId,
        walletPrivacySetting: WalletPrivacySetting.PUBLIC,
        status: {
          // LOST and READONLY wallets are irrelevant here. DISABLED ones can be used for recovery if they are still PUBLIC:
          in: [WalletStatus.ENABLED, WalletStatus.DISABLED],
        },
      },
    });

    if (recoverableAccountWallets.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.RECOVERY_WALLETS_NOT_FOUND,
      });
    }

    const publicKey = recoverableAccountWallets.find(
      (w) => w.address === anonChallenge.address
    )?.publicKey;

    if (!publicKey) {
      console.warn(ErrorMessages.RECOVERY_MISSING_PUBLIC_KEY);

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

    // TODO: Include alias, etc?

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
