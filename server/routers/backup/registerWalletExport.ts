import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ExportType } from "@prisma/client";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { DbWallet } from "@/prisma/types/types";

export const RegisterWalletExportInputSchema = z.object({
  type: z.nativeEnum(ExportType),
  walletId: z.string().uuid(),
});

export const registerWalletExport = protectedProcedure
  .input(RegisterWalletExportInputSchema)
  .mutation(async ({ input, ctx }) => {
    // It is faster to make this query outside the transaction and await it inside, but if the transaction fails, this
    // will leave an orphan DeviceAndLocation behind. Still, this might not be an issue, as retrying this same
    // operation will probably reuse it. Otherwise, the cleanup cronjobs will take care of it:
    const deviceAndLocationIdPromise = getDeviceAndLocationId(ctx);

    // Make sure the user is the owner of the wallet (because of the WalletExport relation below):
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true },
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    if (!userWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    const [
      wallet,
    ] = await ctx.prisma.$transaction(async (tx) => {
      const deviceAndLocationId = await deviceAndLocationIdPromise;
      const dateNow = new Date();

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: userWallet.id,
          userId: ctx.user.id,
        },
        data: {
          canBeRecovered: true,
          lastExportedAt: dateNow,
          totalExports: { increment: 1 },
        },
      });

      const registerWalletExportPromise = tx.walletExport.create({
        data: {
          type: input.type,

          // Relations:
          userId: ctx.user.id,
          walletId: userWallet.id,
          deviceAndLocationId,
        }
      });

      return Promise.all([
        updateWalletStatsPromise,
        registerWalletExportPromise,
      ]);
    });

    return {
      wallet: wallet as DbWallet,
    };
  });
