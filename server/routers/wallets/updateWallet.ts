import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { WalletIdentifierType, WalletPrivacySetting, WalletStatus } from "@prisma/client";
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { validateWalletPrivacy } from "@/server/utils/wallet/wallet.validators";

export const UpdateWalletInputSchema = z.object({
  walletId: z.string(),
  status: z.nativeEnum(WalletStatus).optional(),
  // TODO: address and publicKey are only used when going from PRIVATE to PUBLIC
  address: z.string().optional(), // TODO: Validate length/format
  publicKey: z.string().optional(), // TODO: Validate length/format
  identifierTypeSetting: z.nativeEnum(WalletIdentifierType).optional(),
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting),
  canRecoverAccountSetting: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Private wallets cannot be used to recover the account and should not include a `publicKey`:

  // TODO: Review this works (all props are optional for updates):
  const walletPrivacyIssue = validateWalletPrivacy(
    data.walletPrivacySetting,
    data.publicKey,
    data.canRecoverAccountSetting
  );

  if (walletPrivacyIssue) ctx.addIssue(walletPrivacyIssue);
});

export const updateWallet = protectedProcedure
  .input(UpdateWalletInputSchema)
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
      chain,
      address,
    } = prevWallet;

    const {
      status = prevWallet.status,
      publicKey = prevWallet.publicKey,
      walletPrivacySetting = prevWallet.walletPrivacySetting,
    } = input;

    if (status !== prevWallet.status) {
      if (status === WalletStatus.ENABLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ErrorMessages.WALLETS_CANNOT_BE_ENABLED,
        });
      }

      if (status === WalletStatus.DISABLED && prevWallet.status !== WalletStatus.ENABLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ErrorMessages.ONLY_ENABLED_CAN_BE_DISABLED,
        });
      }
    }

    const canRecoverAccountSetting = status === WalletStatus.ENABLED
      && walletPrivacySetting === WalletPrivacySetting.PUBLIC ? input.canRecoverAccountSetting : false;

    const preserveWalletShares = status === WalletStatus.ENABLED || status === WalletStatus.DISABLED;

    const [
      wallet,
    ] = await ctx.prisma.$transaction(async (tx) => {

      const updateWalletPromise = tx.wallet.update({
        where: {
          id: input.walletId,
          userId: ctx.user.id,
        },
        data: {
          status,
          chain,
          address: walletPrivacySetting === WalletPrivacySetting.PUBLIC ? address : maskWalletAddress(chain, address),
          publicKey: walletPrivacySetting === WalletPrivacySetting.PUBLIC ? publicKey : null,
          identifierTypeSetting: input.identifierTypeSetting,
          aliasSetting: input.aliasSetting,
          descriptionSetting: input.descriptionSetting,
          tagsSetting: input.tagsSetting,
          doNotAskAgainSetting: preserveWalletShares ? undefined : true,
          walletPrivacySetting,
          canRecoverAccountSetting,
          // TODO: This one might be true for various reasons:
          canBeRecovered: preserveWalletShares ? undefined : false,
          source: preserveWalletShares ? undefined : {},
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
