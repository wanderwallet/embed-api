import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletIdentifierType, WalletPrivacySetting, WalletStatus } from "@prisma/client";

export const UpdateWalletInputSchema = z.object({
  walletId: z.string(),
  status: z.nativeEnum(WalletStatus),
  identifierTypeSetting: z.nativeEnum(WalletIdentifierType).optional(),
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting),
  canRecoverAccountSetting: z.boolean().optional(),
});

export const updateWallet = protectedProcedure
  .input(UpdateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const [
      wallet,
    ] = await ctx.prisma.$transaction(async (tx) => {
      const { status, walletPrivacySetting } = input;
      const preserveWalletShares = status === WalletStatus.ENABLED || status === WalletStatus.DISABLED;

      // TODO: Can a wallet be set to enabled?

      const updateWalletPromise = tx.wallet.update({
        where: {
          id: input.walletId,
          userId: ctx.user.id,
        },
        data: {
          status,
          identifierTypeSetting: input.identifierTypeSetting,
          aliasSetting: input.aliasSetting,
          descriptionSetting: input.descriptionSetting,
          tagsSetting: input.tagsSetting,
          doNotAskAgainSetting: preserveWalletShares ? undefined : true,
          walletPrivacySetting,
          canRecoverAccountSetting: status === WalletStatus.ENABLED ? input.canRecoverAccountSetting : false,
          canBeRecovered: preserveWalletShares ? undefined : false,
          source: preserveWalletShares ? undefined : false,
        },
      });

      const deleteWorkKeySharesPromise = preserveWalletShares ? null : tx.workKeyShare.deleteMany({
        where: {
          walletId: input.walletId,
          userId: ctx.user.id,
        },
      });

      const deleteRecoveryKeySharesPromise = preserveWalletShares ? null : tx.recoveryKeyShare.deleteMany({
        where: {
          walletId: input.walletId,
          userId: ctx.user.id,
        },
      });

      return Promise.all([
        updateWalletPromise,
        deleteWorkKeySharesPromise,
        deleteRecoveryKeySharesPromise,
      ]);
    });


    return {
      wallet,
    };
  });
