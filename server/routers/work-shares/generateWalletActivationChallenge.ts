import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Challenge, ChallengePurpose, WalletStatus, WalletUsageStatus } from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeUtils } from "@/server/utils/challenge/challenge.utils";
import { Config } from "@/server/utils/config/config.constants";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

export const GenerateWalletActivationChallengeInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const generateWalletActivationChallenge = protectedProcedure
  .input(GenerateWalletActivationChallengeInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    // Explicitly set JWT claims before wallet lookup
    try {
      // Set JWT claims with session-level SET
      const jwtClaims = JSON.stringify({
        sub: ctx.user.id,
        role: 'authenticated'
      });
      
      // Escape single quotes for SQL safety
      const escapedClaims = jwtClaims.replace(/'/g, "''");
      
      // Use direct raw query to ensure claims are set
      await ctx.prisma.$executeRawUnsafe(
        `SET request.jwt.claims = '${escapedClaims}'`
      );
      
      // Verify claims were set
      const currentSettings = await ctx.prisma.$queryRaw`SELECT current_setting('request.jwt.claims', true)`;
      console.log(`Current JWT claims before wallet lookup: ${JSON.stringify(currentSettings)}`);
    } catch (error) {
      console.error(`Failed to set/verify JWT claims:`, error);
    }

    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true, status: true },
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    console.log(`Wallet lookup result for activation challenge: ${!!userWallet}, status: ${userWallet?.status}`);

    if (!userWallet || userWallet.status !== WalletStatus.ENABLED) {
      if (userWallet) {
        const deviceAndLocationId = await deviceAndLocationIdPromise;

        // Log activation attempt of a non-ENABLED wallet:
        await ctx.prisma.walletActivation.create({
          data: {
            status: WalletUsageStatus.FAILED,
            userId: ctx.user.id,
            walletId: userWallet.id,
            workKeyShareId: null,
            deviceAndLocationId,
          },
        });
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    const challengeValue = ChallengeUtils.generateChangeValue();

    const challengeUpsertData = {
      type: Config.CHALLENGE_TYPE,
      purpose: ChallengePurpose.ACTIVATION,
      value: challengeValue,
      version: Config.CHALLENGE_VERSION,

      // Relations:
      userId: ctx.user.id,
      walletId: userWallet.id,
    } as const satisfies Partial<Challenge>;

    const activationChallenge = await ctx.prisma.challenge.upsert({
      where: {
        userChallenges: {
          userId: ctx.user.id,
          purpose: ChallengePurpose.ACTIVATION,
        },
      },
      create: challengeUpsertData,
      update: challengeUpsertData,
    });

    return {
      activationChallenge,
    };
  });
