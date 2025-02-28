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
 * We generate RSA-PSS key pair with a 4096 modulusLength, which gives as a 540-550 bytes public key if the format is
 * PKCS#1. PKCS#8 adds some extra metadata and bumps the size to 560, so 540-560 * 4/3 characters/byte = 720-747
 * characters in base64.
 */
export function getSharePublicKeyValidator() {
  // TODO: Can we expect this to always be exactly 736? (550 as base64)?
  return z.string().min(720).max(747);
}

export const SHARE_REX_EXPS: Record<Chain, RegExp> = {
  // See https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
  [Chain.ARWEAVE]: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/i,
  [Chain.ETHEREUM]: /^[A-F0-9]+$/i,
}

export const SHARE_LENGTHS: Record<Chain, number> = {
  [Chain.ARWEAVE]: 3168,
  [Chain.ETHEREUM]: 44,
}

export function getChainShareValidator(chain: Chain) {
  return z.string().length(SHARE_LENGTHS[chain]).refine((val) => {
    return SHARE_REX_EXPS[chain].test(val);
  }, `Invalid ${ chain } share`)
}

export function validateShare(
  chain: Chain,
  share: string,
  sharePath: (string | number)[],
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
