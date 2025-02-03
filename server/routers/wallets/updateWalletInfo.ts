import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletIdentifierType } from "@prisma/client";

export const UpdateWalletInfoInputSchema = z.object({
  walletId: z.string(),
  identifierTypeSetting: z.nativeEnum(WalletIdentifierType).optional(),
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
});

export const updateWalletInfo = protectedProcedure
  .input(UpdateWalletInfoInputSchema)
  .mutation(async ({ input, ctx }) => {
    const wallet = await ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        identifierTypeSetting: input.identifierTypeSetting,
        aliasSetting: input.aliasSetting,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
      },
    });

    return {
      wallet,
    }
  });
