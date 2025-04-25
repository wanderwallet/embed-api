import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import {
  Chain,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus,
} from "@prisma/client";
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { validateWallet } from "@/server/utils/wallet/wallet.validators";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { getDeviceAndLocationConnectOrCreate } from "@/server/utils/device-n-location/device-n-location.utils";
import {
  getShareValidator,
  getShareHashValidator,
  getSharePublicKeyValidator,
  validateShare,
} from "@/server/utils/share/share.validators";
import { DbWallet } from "@/prisma/types/types";
import { getUserConnectOrCreate } from "@/server/utils/user/user.utils";

export const CreatePrivateWalletInputSchema = z
  .object({
    status: z.enum([WalletStatus.ENABLED, WalletStatus.DISABLED]),
    chain: z.nativeEnum(Chain),
    address: z.string(),
    aliasSetting: z.string().optional(),
    descriptionSetting: z.string().optional(),
    tagsSetting: z.array(z.string()).optional(),
    walletPrivacySetting: z.literal(WalletPrivacySetting.PRIVATE),
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
    const walletIssues = await validateWallet(data.chain, data.address);
    walletIssues.forEach(ctx.addIssue);

    // `authShare` has the right format according to the length of the keys on a specific `chain`:
    const shareIssues = validateShare(data.chain, data.authShare, [
      "authShare",
    ]);
    shareIssues.forEach(ctx.addIssue);
  });

export const createPrivateWallet = protectedProcedure
  .input(CreatePrivateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const canBeRecovered =
      input.source.type === WalletSourceType.IMPORTED ? true : false;

    const wallet = await ctx.prisma.wallet.create({
      data: {
        status: input.status,
        chain: input.chain,
        address: maskWalletAddress(input.chain, input.address),
        publicKey: null,
        aliasSetting: input.aliasSetting,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
        doNotAskAgainSetting: false,
        walletPrivacySetting: WalletPrivacySetting.PRIVATE,
        canRecoverAccountSetting: false,
        canBeRecovered,
        source: input.source as InputJsonValue,

        userProfile: await getUserConnectOrCreate(ctx),

        deviceAndLocation: await getDeviceAndLocationConnectOrCreate(ctx),

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
  });
