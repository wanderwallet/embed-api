import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import {
  Chain,
  WalletIdentifierType,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus,
} from "@prisma/client";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";
import { InputJsonValue } from "@prisma/client/runtime/library";
import {
  getShareHashValidator,
  getSharePublicKeyValidator,
  getShareValidator,
  validateShare,
} from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { getDeviceAndLocationConnectOrCreate, getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";
import { getUserConnectOrCreate } from "@/server/utils/user/user.utils";
import { createWalletWithSecurityDefiner } from "@/server/utils/wallet/wallet.utils";

export const CreatePublicWalletInputSchema = z
  .object({
    status: z.enum([WalletStatus.ENABLED, WalletStatus.DISABLED]),
    chain: z.nativeEnum(Chain),
    address: z.string(),
    publicKey: z.string(),
    aliasSetting: z.string().optional(),
    descriptionSetting: z.string().optional(),
    tagsSetting: z.array(z.string()).optional(),
    walletPrivacySetting: z.literal(WalletPrivacySetting.PUBLIC),
    canRecoverAccountSetting: z.boolean(),
    source: z.object({
      type: z.nativeEnum(WalletSourceType),
      from: z.nativeEnum(WalletSourceFrom),
    }),

    // WorkKeyShare:
    authShare: getShareValidator(),
    deviceShareHash: getShareHashValidator(),
    deviceSharePublicKey: getSharePublicKeyValidator(),
  })
  .superRefine(async (data, ctx) => {
    // `chain`, `address` and `publicKey` match:
    const walletIssues = await validateWallet(
      data.chain,
      data.address,
      data.publicKey
    );
    walletIssues.forEach(ctx.addIssue);

    // `authShare` has the right format according to the length of the keys on a specific `chain`:
    const shareIssues = validateShare(data.chain, data.authShare, [
      "authShare",
    ]);
    shareIssues.forEach(ctx.addIssue);
  });

export const createPublicWallet = protectedProcedure
  .input(CreatePublicWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      // First get device ID
      const deviceId = await getDeviceAndLocationId(ctx);

      // Create wallet using the security definer function
      const walletId = await createWalletWithSecurityDefiner(ctx, {
        status: input.status,
        chain: input.chain,
        address: input.address,
        publicKey: input.publicKey,
        identifierTypeSetting: WalletIdentifierType.ALIAS,
        aliasSetting: input.aliasSetting,
        deviceAndLocationId: deviceId,
      });

      // Add the additional data after creating the wallet
      const canBeRecovered = input.source.type === WalletSourceType.IMPORTED ? true : false;
      
      // Update the wallet with the additional fields
      const wallet = await ctx.prisma.wallet.update({
        where: { id: walletId },
        data: {
          descriptionSetting: input.descriptionSetting,
          tagsSetting: input.tagsSetting,
          canRecoverAccountSetting: input.canRecoverAccountSetting,
          canBeRecovered,
          source: input.source as InputJsonValue,
          
          // Add the work key share
          workKeyShares: {
            create: {
              authShare: input.authShare,
              deviceShareHash: input.deviceShareHash,
              deviceSharePublicKey: input.deviceSharePublicKey,
              userId: ctx.user.id,
              sessionId: ctx.session.id,
              deviceNonce: ctx.session.deviceNonce,
            },
          },
        },
      });

      return {
        wallet: wallet as DbWallet,
      };
    } catch (error) {
      console.error("Error creating public wallet:", error);
      throw error;
    }
  });
