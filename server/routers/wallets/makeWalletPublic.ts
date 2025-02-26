import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, WalletPrivacySetting, WalletStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { DbWallet } from "@/index";

export const MakeWalletPublicInputSchema = z.object({
  walletId: z.string().uuid(),
  walletPrivacySetting: z.literal(WalletPrivacySetting.PUBLIC),
  chain: z.nativeEnum(Chain),
  address: z.string(),
  publicKey: z.string(),
}).superRefine(async (data, ctx) => {
  // `chain`, `address` and `publicKey` match:
  const walletIssues = await validateWallet(data.chain, data.address, data.publicKey);
  walletIssues.forEach(ctx.addIssue);
});

export const makeWalletPublic = protectedProcedure
  .input(MakeWalletPublicInputSchema)
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

    if (maskWalletAddress(input.chain, input.address) !== maskWalletAddress(chain, address)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.WALLET_ADDRESS_MISMATCH,
      });
    }

    const wallet = await ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        address: input.address,
        publicKey: input.publicKey,
        walletPrivacySetting: WalletPrivacySetting.PUBLIC,
      },
    });

    return {
      wallet: wallet as DbWallet,
    };
  });
