import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletIdentifierType, WalletPrivacySetting, WalletStatus } from "@prisma/client";

export const UpdateWalletInputSchema = z.object({
  walletId: z.string(),
  status: z.nativeEnum(WalletStatus),
  identifierTypeSetting: z.nativeEnum(WalletIdentifierType).optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting).optional(),
  canRecoverAccountSetting: z.boolean().optional(),
});

export const updateWallet = protectedProcedure
  .input(UpdateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { status } = input;

    // TODO:
    // - DISABLED = Shares stay. Cannot be activated without changing status first.
    // - READONLY = Shares deleted.
    // - LOST = Shares deleted. Just UI over READONLY. Will detect activation attempts.

    // - Make sure activateWallet only allows it for enabled wallets?
    // - Update canBeRecovered in export/backup and also reset if marking a wallet as lost?
    // - Account for privacy setting... Easier to save it taking that value into account than having to filter everywhere.

    const wallet = await ctx.prisma.wallet.update({
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
      data: {
        status,
        identifierTypeSetting: input.identifierTypeSetting,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
        walletPrivacySetting: input.walletPrivacySetting,
        canRecoverAccountSetting: status === WalletStatus.ENABLED ? input.canRecoverAccountSetting : false,
      },
    });

    return {
      wallet,
    };
  });
