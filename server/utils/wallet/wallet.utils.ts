import { Chain } from "@prisma/client";
import { Context } from "@/server/context";
import { WalletIdentifierType, WalletStatus } from "@prisma/client";

export const CHAIN_MASK: Record<Chain, string> = {
  [Chain.ARWEAVE]: "*******************************************",
  [Chain.ETHEREUM]: "0x****************************************",
}

export const CHAIN_VISIBLE_CHARS: Record<Chain, [number, number]> = {
  [Chain.ARWEAVE]: [6,6],
  [Chain.ETHEREUM]: [6,4],
}

export function maskWalletAddress(chain: Chain, address: string): string {
  const maskedAddress = CHAIN_MASK[chain];
  const [visibleCharactersStart, visibleCharactersEnd] = CHAIN_VISIBLE_CHARS[chain];
  const charactersStart = address.slice(0, visibleCharactersStart);
  const charactersMiddle = maskedAddress.slice(visibleCharactersStart, -visibleCharactersEnd);
  const charactersEnd = address.slice(0, -visibleCharactersEnd);

  return `${charactersStart}${charactersMiddle}${charactersEnd}`;
}

/**
 * Creates a wallet using direct Prisma operations with RLS policies
 */
export async function createWalletWithSecurityDefiner(
  ctx: Context,
  params: {
    status: WalletStatus;
    chain: Chain;
    address: string;
    publicKey?: string;
    identifierTypeSetting?: WalletIdentifierType;
    aliasSetting?: string;
    deviceAndLocationId: string;
  }
) {
  if (!ctx.user) throw new Error("User authentication required");

  const { status, chain, address, publicKey, identifierTypeSetting, aliasSetting, deviceAndLocationId } = params;

  // Create the wallet directly using Prisma
  const wallet = await ctx.prisma.wallet.create({
    data: {
      status,
      chain,
      address,
      publicKey,
      identifierTypeSetting: identifierTypeSetting || WalletIdentifierType.ALIAS,
      aliasSetting,
      doNotAskAgainSetting: false,
      walletPrivacySetting: 'PUBLIC',
      canRecoverAccountSetting: false,
      canBeRecovered: false,
      activationAuthsRequiredSetting: 0,
      backupAuthsRequiredSetting: 0,
      recoveryAuthsRequiredSetting: 0,
      userId: ctx.user.id,
      deviceAndLocationId,
      totalActivations: 0,
      totalBackups: 0,
      totalRecoveries: 0,
      totalExports: 0
    },
    select: {
      id: true
    }
  });

  // Return the wallet ID
  return wallet.id;
}
