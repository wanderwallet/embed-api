import { Chain } from "@prisma/client";

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
