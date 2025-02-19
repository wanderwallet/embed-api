import { protectedProcedure } from "@/server/trpc"
import { z } from "zod"
import { Chain, WalletPrivacySetting, WalletStatus } from "@prisma/client";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

export const CreateReadOnlyWalletInputSchema = z.object({
  status: z.enum([WalletStatus.READONLY, WalletStatus.LOST]),
  chain: z.nativeEnum(Chain),
  address: z.string(),
  publicKey: z.string().optional(),
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
}).superRefine(async (data, ctx) => {
  // `chain`, `address` and `publicKey` match:
  const walletIssues = await validateWallet(data.chain, data.address, data.publicKey);
  walletIssues.forEach(ctx.addIssue);
});

export const createReadOnlyWallet = protectedProcedure
  .input(CreateReadOnlyWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const wallet = await ctx.prisma.$transaction(async (tx) => {
      const deviceAndLocationId = await getDeviceAndLocationId(ctx, tx);

      return ctx.prisma.wallet.create({
        data: {
          status: input.status,
          chain: input.chain,
          address: input.address,
          publicKey: input.publicKey,
          aliasSetting: input.aliasSetting,
          descriptionSetting: input.descriptionSetting,
          tagsSetting: input.tagsSetting,
          doNotAskAgainSetting: true,
          walletPrivacySetting: WalletPrivacySetting.PUBLIC,
          canRecoverAccountSetting: false,
          canBeRecovered: false,
          userId: ctx.user.id,
          deviceAndLocationId,
        },
      });
    });

    return {
      wallet,
    };
  });
