import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";

export const FetchCloudBackupInputSchema = z.object({
  walletId: z.string().uuid(),
});

export const fetchCloudBackup = protectedProcedure
  .input(FetchCloudBackupInputSchema)
  .query(async ({ input, ctx }) => {
    // Verify the user owns the wallet
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

    // Fetch the cloud backup
    const cloudBackup = await ctx.prisma.cloudBackup.findFirst({
      where: {
        walletId: input.walletId,
      },
    });

    return { cloudBackup };
  });
