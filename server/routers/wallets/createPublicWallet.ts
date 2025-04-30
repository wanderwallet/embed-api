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
import { getDeviceAndLocationId } from "@/server/utils/device-n-location/device-n-location.utils";

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
      const canBeRecovered = input.source.type === WalletSourceType.IMPORTED ? true : false;

      const deviceId = await getDeviceAndLocationId(ctx);

      const wallet = await ctx.prisma.$transaction(async (tx) => {
        const createdWallet = await tx.wallet.create({
          data: {
            status: input.status,
            chain: input.chain,
            address: input.address,
            publicKey: input.publicKey,
            identifierTypeSetting: WalletIdentifierType.ALIAS,
            aliasSetting: input.aliasSetting,
            doNotAskAgainSetting: false,
            walletPrivacySetting: 'PUBLIC',
            canRecoverAccountSetting: false,
            canBeRecovered: false,
            activationAuthsRequiredSetting: 0,
            backupAuthsRequiredSetting: 0,
            recoveryAuthsRequiredSetting: 0,
            userId: ctx.user.id,
            deviceAndLocationId: deviceId,
            totalActivations: 0,
            totalBackups: 0,
            totalRecoveries: 0,
            totalExports: 0
          },
          select: {
            id: true
          }
        });

        // Update the wallet with the additional fields
        return await tx.wallet.update({
          where: { id: createdWallet.id, userId: ctx.user.id },
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
      });

      return {
        wallet: wallet as DbWallet,
      };
    } catch (error) {
      console.error("Error creating public wallet:", error);
      throw error;
    }
  });
