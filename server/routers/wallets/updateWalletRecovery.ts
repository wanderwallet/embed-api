import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletPrivacySetting, WalletStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";

export const UpdateWalletRecoveryInputSchema = z.object({
  walletId: z.string().uuid(),
  canRecoverAccountSetting: z.boolean(),
});

export const updateWalletRecovery = protectedProcedure
  .input(UpdateWalletRecoveryInputSchema)
  .mutation(async ({ input, ctx }) => {
    const prevWallet = await ctx.prisma.wallet.findFirst({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    if (!prevWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    if (input.canRecoverAccountSetting && (
      prevWallet.walletPrivacySetting !== WalletPrivacySetting.PUBLIC || (
        prevWallet.status !== WalletStatus.ENABLED && prevWallet.status !== WalletStatus.DISABLED
      )
    )) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_VALID_FOR_ACCOUNT_RECOVERY,
      });
    }

    const wallet = ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        canRecoverAccountSetting: input.canRecoverAccountSetting,
      }
    });

    return {
      wallet,
    };
  });
