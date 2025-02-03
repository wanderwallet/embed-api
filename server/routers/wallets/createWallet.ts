import { protectedProcedure } from "@/server/trpc"
import { z, ZodRawShape } from "zod"
import { Chain, WalletPrivacySetting, WalletSourceFrom, WalletSourceType, WalletStatus } from "@prisma/client";
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { validateWallet, validateWalletPrivacy } from "@/server/utils/wallet/wallet.validators";
import { WalletSource } from "@/server/utils/wallet/wallet.types";
import { InputJsonValue } from "@prisma/client/runtime/library";

export const CommonWalletInputShape = {
  chain: z.nativeEnum(Chain),
  address: z.string(), // TODO: Validate length/format
  publicKey: z.string().optional(), // TODO: Validate length/format
  aliasSetting: z.string().optional(),
  descriptionSetting: z.string().optional(),
  tagsSetting: z.array(z.string()).optional(),
} as const satisfies ZodRawShape;

export const CreateEnabledWalletInputSchema = z.object({
  ...CommonWalletInputShape,
  walletPrivacySetting: z.nativeEnum(WalletPrivacySetting).optional(),
  canRecoverAccountSetting: z.boolean(),
  source: z.object({
    type: z.nativeEnum(WalletSourceType),
    from: z.nativeEnum(WalletSourceFrom),
  }),

  // WorkKeyShare:
  authShare: z.string(), // TODO: Validate length/format
  deviceShareHash: z.string(), // TODO: Validate length/format
  deviceSharePublicKey: z.string(), // TODO: Validate length/format
}).superRefine((data, ctx) => {
  // `chain`, `address` and `publicKey` match:

  const walletIssues = validateWallet(data.chain, data.address, data.publicKey);

  if (walletIssues?.address) ctx.addIssue(walletIssues.address);
  if (walletIssues?.publicKey) ctx.addIssue(walletIssues.publicKey);

  // Private wallets cannot be used to recover the account and should not include a `publicKey`:

  const walletPrivacyIssue = validateWalletPrivacy(
    data.walletPrivacySetting,
    data.publicKey,
    data.canRecoverAccountSetting
  );

  if (walletPrivacyIssue) ctx.addIssue(walletPrivacyIssue);
});

export const CreateReadOnlyWalletInputSchema = z.object({
  ...CommonWalletInputShape,
});

export const CreateWalletInputSchema = z.union([
  CreateEnabledWalletInputSchema,
  CreateReadOnlyWalletInputSchema,
]);

export const createWallet = protectedProcedure
  .input(CreateWalletInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      publicKey,
      chain,
      address,
      walletPrivacySetting,
    } = input;

    let authShare: string | undefined;
    let deviceShareHash: string | undefined;
    let deviceSharePublicKey: string | undefined;
    let source: WalletSource = {};
    let status: WalletStatus = WalletStatus.READONLY;
    let doNotAskAgainSetting: boolean = true;
    let canRecoverAccountSetting: boolean = false;
    let canBeRecovered: boolean = false;

    const parsed = CreateEnabledWalletInputSchema.safeParse(input);

    if (parsed.success) {
      const { data } = parsed;

      authShare = data.authShare;
      deviceShareHash = data.deviceShareHash;
      deviceSharePublicKey = data.deviceSharePublicKey;
      source = data.source;

      status = publicKey && authShare && deviceShareHash && deviceSharePublicKey
        ? WalletStatus.ENABLED
        : WalletStatus.READONLY;

      doNotAskAgainSetting = status === WalletStatus.ENABLED ? false : true;

      if (status === WalletStatus.ENABLED && walletPrivacySetting === WalletPrivacySetting.PUBLIC) {
        canRecoverAccountSetting = data.canRecoverAccountSetting;
      }

      canBeRecovered = source.type === WalletSourceType.IMPORTED ? true : false;
    }

    const wallet = await ctx.prisma.wallet.create({
      data: {
        status,
        chain,
        address: walletPrivacySetting === WalletPrivacySetting.PUBLIC ? address : maskWalletAddress(chain, address),
        publicKey: walletPrivacySetting === WalletPrivacySetting.PUBLIC ? publicKey : null,
        aliasSetting: input.aliasSetting,
        descriptionSetting: input.descriptionSetting,
        tagsSetting: input.tagsSetting,
        doNotAskAgainSetting,
        walletPrivacySetting,
        canRecoverAccountSetting,
        canBeRecovered,
        source: source as InputJsonValue,
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
