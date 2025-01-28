import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ExportType } from "@prisma/client";

export const RegisterWalletExportInputSchema = z.object({
  type: z.nativeEnum(ExportType),
  walletId: z.string(),
});

export const generateAuthShareChallenge = protectedProcedure
  .input(RegisterWalletExportInputSchema)
  .mutation(async ({ input, ctx }) => {

    // Make sure the user is the owner of the wallet:
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true },
      where: {
        // TODO: Do I need to add userIds or are they implicit?
        userId: ctx.user.id,
        id: input.walletId,
      },
    });

    if (!userWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: userWallet.id,
        },
        data: {
          lastExportedAt: dateNow,
          totalExports: { increment: 1 },
        },
      });

      const registerWalletExportPromise = ctx.prisma.walletExport.create({
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

    return {};
  });
