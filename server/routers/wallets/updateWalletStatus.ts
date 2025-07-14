import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { DbWallet } from "@/prisma/types/types";

export const UpdateWalletStatusInputSchema = z.object({
  walletId: z.string().uuid(),
  status: z.nativeEnum(WalletStatus),
});

export const updateWalletStatus = protectedProcedure
  .input(UpdateWalletStatusInputSchema)
  .mutation(async ({ input, ctx }) => {
    // TODO: We should probably request a challenge to enable a DISABLED wallet.

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

    if (input.status === prevWallet.status) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.NO_OP,
      });
    }

    // ENABLED => DISABLED and DISABLED => ENABLED is possible, as shares remain in the DB. However, once a wallet
    // status is set to READONLY or LOST, it cannot be set to DISABLED or ENABLED again. If we want to support that
    // at some point, this mutation will have to include `authShare`, `deviceShareHash` and `deviceSharePublicKey` and
    // validate/set some other fields accordingly:

    if (input.status === WalletStatus.ENABLED && prevWallet.status !== WalletStatus.DISABLED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.WALLET_CANNOT_BE_ENABLED,
      });
    }

    if (input.status === WalletStatus.DISABLED && prevWallet.status !== WalletStatus.ENABLED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ErrorMessages.WALLET_CANNOT_BE_DISABLED,
      });
    }

    const deleteShares = input.status === WalletStatus.READONLY || input.status === WalletStatus.LOST;

    const [
      wallet,
    ] = await ctx.prisma.$transaction(async (tx) => {
      const updateWalletPromise = tx.wallet.update({
        where: {
          id: input.walletId,
          userId: ctx.user.id,
        },
        data: {
          status: input.status,
          canRecoverAccountSetting: deleteShares ? false : undefined,
          canBeRecovered: deleteShares ? false : undefined,
          totalBackups: deleteShares ? 0 : undefined,
        },
      });

      const deleteWorkKeySharesPromise = deleteShares ? tx.workKeyShare.deleteMany({
        where: {
          walletId: input.walletId,
          userId: ctx.user.id,
        },
      }) : null;

      const deleteRecoveryKeySharesPromise = deleteShares ? tx.recoveryKeyShare.deleteMany({
        where: {
          walletId: input.walletId,
          userId: ctx.user.id,
        },
      }) : null;

      return Promise.all([
        updateWalletPromise,
        deleteWorkKeySharesPromise,
        deleteRecoveryKeySharesPromise,
      ]);
    });

    return {
      wallet: wallet as DbWallet,
    };
  });
