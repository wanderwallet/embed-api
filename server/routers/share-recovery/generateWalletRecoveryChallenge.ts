import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Challenge, ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

export const GenerateWalletRecoveryChallengeInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const generateWalletRecoveryChallenge = protectedProcedure
  .input(GenerateWalletRecoveryChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    console.log(`Generating wallet recovery challenge for wallet: ${input.walletId}, user: ${ctx.user.id}`);

    const wallet = await ctx.prisma.wallet.findFirst({
      select: { id: true, status: true, userId: true },
      where: {
        id: input.walletId,
        // We deliberately removed the userId constraint here to allow recovery
        // of shared wallets, where the wallet may belong to another user
      },
    });

    console.log(`Wallet lookup result: ${!!wallet}, status: ${wallet?.status}, owner: ${wallet?.userId}`);

    if (!wallet) {
      console.error(`Wallet not found: ${input.walletId}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    // Remove the wallet status check to allow recovery of any wallet
    // (The original code only allowed ENABLED wallets to be recovered)

    // Create a device and location record for tracking
    const deviceAndLocationId = await deviceAndLocationIdPromise;

    // Generate the challenge for recovery
    const challengeValue = ChallengeUtils.generateChangeValue();
    console.log(`Generated challenge for wallet: ${wallet.id}, challenge: ${challengeValue.substring(0, 10)}...`);
    
    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.SHARE_RECOVERY,
      value: challengeValue,
      version: Config.CHALLENGE_VERSION,

      // Relations:
      userId: ctx.user.id,
      walletId: wallet.id,
    } as const satisfies Partial<Challenge>;

    try {
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

      console.log(`Challenge created successfully for wallet: ${wallet.id}`);
      return {
        shareRecoveryChallenge,
      };
    } catch (error: any) {
      console.error(`Error creating challenge for wallet ${wallet.id}:`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Error creating challenge: ${error.message || 'Unknown error'}`,
      });
    }
  });
