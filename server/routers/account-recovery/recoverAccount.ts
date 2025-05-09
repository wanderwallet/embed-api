import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import {
  ChallengePurpose,
  WalletSourceType,
  WalletStatus,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";

export const RecoverAccountSchema = z.object({
  userId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

// Note this is `protectedProcedure`!

export const recoverAccount = protectedProcedure
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
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: challenge.wallet?.publicKey || null,
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

      const [deletedUserProfile, unrecoverableWallets] = await Promise.all([
        // Delete the new userProfile
        tx.userProfile.delete({
          where: { supId: ctx.user.id },
        }),
        // Find unrecoverable wallets
        tx.wallet.findMany({
          where: {
            userId: ctx.user.id,
            canBeRecovered: false,
            source: {
              path: ["type"],
              equals: WalletSourceType.GENERATED,
            },
          },
        }),
      ]);

      // Update the old userProfile with the deleted one's data
      const userDetails = await tx.userProfile.update({
        where: {
          supId: input.userId,
        },
        data: {
          ...deletedUserProfile,
          recoveredAt: dateNow,
        },
      });

      await Promise.all([
        // Delete all WorkKeyShares
        tx.workKeyShare.deleteMany({
          where: {
            userId: input.userId,
          },
        }),
        // Handle unrecoverable wallets if any exist
        unrecoverableWallets.length > 0
          ? Promise.all([
              tx.wallet.updateMany({
                where: {
                  id: {
                    in: unrecoverableWallets.map((w) => w.id),
                  },
                },
                data: {
                  status: WalletStatus.LOST,
                },
              }),
              tx.recoveryKeyShare.deleteMany({
                where: {
                  walletId: {
                    in: unrecoverableWallets.map((w) => w.id),
                  },
                },
              }),
            ])
          : null,
        // Delete the challenge
        tx.challenge.delete({
          where: { id: challenge.id },
        }),
      ]);

      return { userDetails };
    });

    try {
      const supabase = await createServerClient({ isAdmin: true });
      const { error } = await supabase.auth.admin.deleteUser(input.userId);
      if (error) throw error;
    } catch (error) {
      // TODO: Remove orphaned user from database if this fails
      // Log the error but don't fail the recovery since the main transaction succeeded
      console.error("Failed to delete Supabase user:", error);
    }

    return { userDetails };
  });
