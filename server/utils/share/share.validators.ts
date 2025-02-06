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
 * We generate a SHA-256 hash => 32 bytes => 20 characters in base64.
 */
export function getShareHashValidator() {
  return z.string().length(20);
}

/**
 * We generate RSA-PSS key pair with a 4096 modulusLength, which gives as a 550 byte public key exported as SPKI =>
 * 736 characters in base64.
 */
export function getSharePublicKeyValidator() {
  return z.string().length(736);
}

export const SHARE_REX_EXPS: Record<Chain, RegExp> = {
  [Chain.ARWEAVE]: /^[a-z0-9-_]{3168}$/i,
  [Chain.ETHEREUM]: /^[A-F0-9]{44}$/,
}

export function getChainShareValidator<T extends string = string>(chain: Chain) {
  return z.custom<T>((val) => {
    return typeof val === "string" ? SHARE_REX_EXPS[chain].test(val) : false;
  }, `Invalid ${ chain } private key`)
}

export function validateShare(
  chain: Chain,
  share: string,
): ZodCustomIssue[] {
  const issues: ZodCustomIssue[] = [];

  try {
    const chainShareValidator = getChainShareValidator(chain);

    chainShareValidator.parse(share);
  } catch (err) {
    issues.push({
      code: ZodIssueCode.custom,
      path: ["publicKey"],
      message: getErrorMessage(err),
    });
  }

  return issues;
}
