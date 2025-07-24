import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { getShareHashValidator } from "@/server/utils/share/share.validators";

export const GenerateWalletRecoveryChallengeInputSchema = z.object({
  walletId: z.string().uuid(),
  recoveryBackupShareHash: getShareHashValidator().optional(),
});

export const generateWalletRecoveryChallenge = protectedProcedure
  .input(GenerateWalletRecoveryChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    // When recovering using a recovery file, both `walletId` and `recoveryBackupShareHash` are provided. We load the
    // RecoveryKeyShare and check its `recoveryBackupSharePublicKey` to return a v1 or v2 challenge.

    const recoveryKeySharePromise = input.recoveryBackupShareHash
      ? ctx.prisma.recoveryKeyShare.findFirst({
          select: {
            recoveryBackupSharePublicKey: true,
            wallet: {
              select: {
                id: true,
                status: true,
                publicKey: true,
              }
            },
          },
          where: {
            userId: ctx.user.id,
            recoveryBackupShareHash: input.recoveryBackupShareHash,
          },
        })
      : null;

    // When recovering importing a wallet, only `walletId` is provided. We load the wallet details to get the wallet's
    // public key to generate a v1 challenge.

    const walletPromise = !input.recoveryBackupShareHash
      ? ctx.prisma.wallet.findFirst({
          select: {
            id: true,
            status: true,
            publicKey: true
          },
          where: {
            id: input.walletId,
            userId: ctx.user.id,
          },
        })
      : null;

    const [
      recoveryKeyShare,
      wallet,
    ] = await Promise.all([
      recoveryKeySharePromise,
      walletPromise,
    ]);

    const userWallet = recoveryKeyShare?.wallet || wallet;
    const publicKey = recoveryKeyShare?.recoveryBackupSharePublicKey || userWallet?.publicKey;

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      if (userWallet) {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        // Log recovery attempt of a non-ENABLED wallet:
        await ctx.prisma.walletRecovery.create({
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: userWallet.id,
            recoveryKeyShareId: null,
            deviceAndLocationId,
          },
        });
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    if (!publicKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_MISSING_PUBLIC_KEY,
      });
    }

    // Depending on the format of the public key, the `generateChallengeUpsertData()` call below will generate a v1 or
    // v2 challenge:

    const challengeUpsertData = ChallengeUtils.generateChallengeUpsertData({
      purpose: ChallengePurpose.SHARE_RECOVERY,
      publicKey,
      ip: ctx.session.ip,

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    });

    const shareRecoveryChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: ctx.user.id,
          purpose: ChallengePurpose.SHARE_RECOVERY,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    return {
      shareRecoveryChallenge,
    };
  });
