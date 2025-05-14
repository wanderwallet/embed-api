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

export const RecoverAccountSchema = z.object({
  userId: z.string().uuid(),
  challengeSolution: z.string(), // Format validation implicit in `verifyChallenge()`.
});

// Note this is `protectedProcedure`!

export const recoverAccount = protectedProcedure
  .input(RecoverAccountSchema)
  .mutation(async ({ input, ctx }) => {
    const now = Date.now();

    // User id of the account being recovered
    const oldUserId = input.userId;
    // User id of the account performing the recovery
    const newUserId = ctx.user.id;

    const challenge = await ctx.prisma.challenge.findFirst({
      where: {
        userId: oldUserId,
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

    const userDetails = await ctx.prisma.$transaction(
      async (tx) => {
        const dateNow = new Date();

        // Move new user's current session to point to the old user
        if (ctx.session?.id) {
          await tx.session.update({
            where: { id: ctx.session.id },
            data: { userId: oldUserId },
          });
        }

        const [deletedNewUserProfile, unrecoverableWallets] = await Promise.all(
          [
            // Delete the new userProfile
            tx.userProfile.delete({ where: { supId: newUserId } }),
            // Find unrecoverable wallets from the old user
            tx.wallet.findMany({
              where: {
                userId: oldUserId,
                canBeRecovered: false,
                source: {
                  path: ["type"],
                  equals: WalletSourceType.GENERATED,
                },
              },
              select: { id: true },
            }),
          ]
        );

        const [oldUserProfile] = await Promise.all([
          // get the old userProfile data
          tx.userProfile.findUnique({ where: { supId: oldUserId } }),
          // Delete all WorkKeyShares
          tx.workKeyShare.deleteMany({ where: { userId: oldUserId } }),
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
        ]);

        // Update the old userProfile with the new user's data
        const userDetails = await tx.userProfile.update({
          where: {
            supId: oldUserId,
          },
          data: {
            ...deletedNewUserProfile,
            recoveredAt: dateNow,
          },
        });

        await Promise.all([
          // attach a new userProfile to the old user
          tx.userProfile.create({
            data: { ...oldUserProfile, supId: oldUserId },
          }),
          // Delete the challenge
          tx.challenge.delete({
            where: { id: challenge.id },
          }),
        ]);

        return { userDetails };
      },
      { timeout: 7000 }
    );

    // TODO: Should we delete the user from Supabase?

    return { userDetails };
  });
