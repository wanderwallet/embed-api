import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, WalletPrivacySetting, WalletSourceFrom, WalletSourceType, WalletStatus } from "@prisma/client";

export const CreateWalletInputSchema = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Validate length/format
  publicKey: z.string().optional(), // TODO: Validate length/format
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting).optional(),
  canRecoverAccountSetting: z.boolean().optional(),
  source: z.object({
    type: z.nativeEnum(WalletSourceType),
    from: z.nativeEnum(WalletSourceFrom),
  }),

  // WorkKeyShare:
  authShare: z.string().optional(), // TODO: Validate length/format
  deviceShareHash: z.string().optional(), // TODO: Validate length/format
  deviceSharePublicKey: z.string().optional(), // TODO: Validate length/format
});

export const createWallet = protectedProcedure
  .input(CreateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      publicKey,
      authShare,
      deviceShareHash,
      deviceSharePublicKey,
    } = input;

    const status = publicKey && authShare && deviceShareHash && deviceSharePublicKey
      ? WalletStatus.ENABLED
      : WalletStatus.READONLY;

    const wallet = await ctx.prisma.wallet.create({
      data: {
        status,
        chain: input.chain,
        address: input.address,
        publicKey,
        aliasSetting: input.aliasSetting,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
        walletPrivacySetting: input.walletPrivacySetting,
        canRecoverAccountSetting: status === WalletStatus.ENABLED ? input.canRecoverAccountSetting : false,
        canBeRecovered: input.source.type === WalletSourceType.IMPORTED ? true : false,
        source: authShare ? input.source : undefined,
        userId: ctx.user.id,
        deviceAndLocationId,

        workKeyShares: authShare && deviceShareHash && deviceSharePublicKey ? {
          create: {
            authShare,
            deviceShareHash,
            deviceSharePublicKey,
            userId: ctx.user.id,
            sessionId: ctx.session.id,
          },
        } : undefined,
      },
    });

    return {
      wallet,
    };
  });
