import { getErrorMessage } from "@/server/utils/error/error.utils";
import { Chain } from "@prisma/client";
import { z, ZodCustomIssue, ZodIssueCode } from "zod";

/**
 * The length of the shares in SSS is the same as the length of the input, so the expected length here depends on the
 * wallet chain. In this initial validation though, we will just require a common minimum length regardless of the
 * chain. A separate `.superRefine()` block will take care of checking the chain-specific length requirement.
 */
export function getShareValidator() {
  return z.string().min(32);
}

/**
 * We generate a SHA-256 hash => 32 bytes * 4/3 characters/byte = 43.3333 => 44 characters in base64.
 */
export function getShareHashValidator() {
  return z.string().length(44);
}

/**
 * v2 challenges (EdDSA) => 32 bytes public key * 4/3 characters/byte = 43.3333 => 44 characters in base64.
 */
export function getSharePublicKeyValidator() {
  // If we publish the new client first, we can accept only EdDSA public keys on the server, as this is not used for
  // challenge verification, it is only used when new work or recovery shares are registered.

  return z.string().length(44);

  /*
  // v1 challenges (RSA-PSS with modulusLength = 4096) => 512 bytes public key (as JWK) => 512 * 4/3 characters/byte = 683 characters in base64.

  return z.union([
    z.string().length(44),
    z.string().min(683).max(685),
  ]);
  */
}

export const SHARE_REX_EXPS: Record<Chain, RegExp> = {
  // See https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
  [Chain.ARWEAVE]:
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/i,
  [Chain.ETHEREUM]: /^[A-F0-9]+$/i,
};

export const SHARE_LENGTHS: Record<Chain, number | number[]> = {
  // Small difference in size due to padding in base64. Length is usually 3168 but sometimes it's 3172.
  // Example: Use seedPhrase = "figure prevent notable absent spy invite reform pave cancel toe donkey insane".
  // This could also be addressed with zero-padding.
  [Chain.ARWEAVE]: [3168, 3172],
  [Chain.ETHEREUM]: 44,
};

export function getChainShareValidator(chain: Chain) {
  let chainLengths = SHARE_LENGTHS[chain];

  if (typeof chainLengths !== "number" && chainLengths.length < 2)
    chainLengths = chainLengths[0] || 0;

  return (
    typeof chainLengths === "number"
      ? z.string().length(chainLengths)
      : z.union([
          z.string().length(chainLengths[0]),
          z.string().length(chainLengths[1]),
          ...chainLengths.slice(2).map((l) => z.string().length(l)),
        ])
  ).refine((val) => {
    return SHARE_REX_EXPS[chain].test(val);
  }, `Invalid ${chain} share`);
}

export function validateShare(
  chain: Chain,
  share: string,
  sharePath: (string | number)[]
): ZodCustomIssue[] {
  const issues: ZodCustomIssue[] = [];

  try {
    const chainShareValidator = getChainShareValidator(chain);

    chainShareValidator.parse(share);
  } catch (err) {
    issues.push({
      code: ZodIssueCode.custom,
      path: sharePath,
      message: getErrorMessage(err),
    });
  }

  return issues;
}

export function isEdDSAPublicKey(publicKey: string): boolean {
  return publicKey.length === 44;
}
