import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"

export const DoNotAskAgainForBackupInputSchema = z.object({
  walletId: z.string(),
});

export const doNotAskAgainForBackup = protectedProcedure
  .input(DoNotAskAgainForBackupInputSchema)
  .mutation(async ({ input, ctx }) => {
    const wallet = await ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        doNotAskAgainSetting: true,
      },
    });

    return {
      wallet,
    };
  });
