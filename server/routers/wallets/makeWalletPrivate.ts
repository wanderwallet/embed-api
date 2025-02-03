import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletPrivacySetting, WalletStatus } from "@prisma/client";
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";

export const MakeWalletPrivateInputSchema = z.object({
  walletId: z.string(),
  walletPrivacySetting: z.literal(WalletPrivacySetting.PRIVATE),
});

export const makeWalletPrivate = protectedProcedure
  .input(MakeWalletPrivateInputSchema)
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

    const {
      status,
      chain,
      address,
    } = prevWallet;

    if (status !==  WalletStatus.ENABLED && status !== WalletStatus.DISABLED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.WALLET_NO_PRIVACY_SUPPORT,
      });
    }

    const wallet = await ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        address: maskWalletAddress(chain, address),
        publicKey: null,
        walletPrivacySetting: WalletPrivacySetting.PRIVATE,
        canRecoverAccountSetting: false,
      },
    });

    return {
      wallet,
    };
  });
