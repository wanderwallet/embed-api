import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, WalletPrivacySetting, WalletSourceFrom, WalletSourceType, WalletStatus } from "@prisma/client";

export const CreateWalletInputSchema = z.object({
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Validate length/format
  publicKey: z.string().optional(), // TODO: Validate length/format
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting).optional(),
  canRecoverAccountSetting: z.boolean().optional(),
  source: z.object({
    type: z.nativeEnum(WalletSourceType),
    from: z.nativeEnum(WalletSourceFrom),
  }),
});

export const createWallet = protectedProcedure
  .input(CreateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const status = input.publicKey ? WalletStatus.ENABLED : WalletStatus.READONLY;

    const wallet = await ctx.prisma.wallet.create({
      data: {
        status,
        chain: input.chain,
        address: input.address,
        publicKey: input.publicKey,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
        walletPrivacySetting: input.walletPrivacySetting,
        canRecoverAccountSetting: status === WalletStatus.ENABLED ? input.canRecoverAccountSetting : false,
        source: input.source,
        userId: ctx.user.id,
        deviceAndLocationId,
      },
    });

    return {
      wallet,
    };
  });
