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
import { getSilentErrorLoggerFor } from "@/server/utils/error/error.utils";

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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CHALLENGE_NOT_FOUND,
      });
    }

    // No await, just fail silently. Regardless of whether there challenge is valid or not, it is one-time-use only, so at this point we can delete it already.
    // We don't care if there's an error because if there is, the challenge will remain in the DB until it is upserted (updated) once the user re-tries, so it's
    // better to just let them complete this request:

    ctx.prisma.challenge.delete({
      where: { id: challenge.id },
    }).catch(getSilentErrorLoggerFor("recoverAccount's challenge.delete(...)"));

    const challengeErrorMessage = await ChallengeUtils.verifyChallenge({
      challenge,
      session: ctx.session,
      shareHash: null,
      now,
      solution: input.challengeSolution,
      publicKey: challenge.wallet?.publicKey || null,
    });

    // TODO: Add an account recovery attempt limit?

    if (challengeErrorMessage) {
      // TODO: Register (update) the failed attempt anyway!

      throw new TRPCError({
        code: "FORBIDDEN",
        message: challengeErrorMessage,
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

         // attach a new userProfile to the old user
        await tx.userProfile.create({
          data: { ...oldUserProfile, supId: oldUserId },
        });

        return { userDetails };
      },
      { timeout: 7000 }
    );

    // TODO: Should we delete the user from Supabase?

    return { userDetails };
  });
