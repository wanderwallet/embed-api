import { getErrorMessage } from "@/server/utils/error/error.utils";
import { Chain, WalletPrivacySetting } from "@prisma/client";
import { z, ZodCustomIssue, ZodIssue, ZodIssueCode } from "zod";

export const ADDRESS_REX_EXPS: Record<Chain, RegExp> = {
  [Chain.ARWEAVE]: /[a-z0-9-_]{43}/i,
  [Chain.ETHEREUM]: /^0x[a-fA-F0-9]{40}$/,
}

export const PUBLIC_KEY_REX_EXPS: Record<Chain, RegExp> = {
  [Chain.ARWEAVE]: /[a-z0-9-_]{683}/i,
  [Chain.ETHEREUM]: /^0x[A-F0-9]{128}$/,
}

export function getAddressValidator<T extends string = string>(chain: Chain) {
  return z.custom<T>((val) => {
    return typeof val === "string" ? ADDRESS_REX_EXPS[Chain.ARWEAVE].test(val) : false;
  }, `Invalid ${ chain } address`)
}

export function getPublicKeyValidator<T>(chain: Chain) {
  return z.custom<T>((val) => {
    return typeof val === "string" ? PUBLIC_KEY_REX_EXPS[Chain.ARWEAVE].test(val) : false;
  }, `Invalid ${ chain } public key`)
}

export const ADDRESS_VALIDATORS = {
  [Chain.ARWEAVE]: getAddressValidator(Chain.ARWEAVE),
  [Chain.ETHEREUM]: getAddressValidator<`0x${string}`>(Chain.ETHEREUM),
} as const satisfies Record<Chain, z.ZodType>;

export const PUBLIC_KEY_VALIDATORS = {
  [Chain.ARWEAVE]: getPublicKeyValidator(Chain.ARWEAVE),
  [Chain.ETHEREUM]: getPublicKeyValidator<`0x${string}`>(Chain.ETHEREUM),
} as const satisfies Record<Chain, z.ZodType>;

export interface WalletIssues {
  address?: ZodIssue;
  publicKey?: ZodIssue;
}

export function validateWallet(
  chain: Chain,
  address: string,
  publicKey?: string,
): null | WalletIssues {
  const issues: WalletIssues = {};

  try {
    const addressValidator = ADDRESS_VALIDATORS[chain];

    addressValidator.parse(address);
  } catch (err) {
    issues.address = {
      code: ZodIssueCode.custom,
      path: ["address"],
      message: getErrorMessage(err),
    } satisfies ZodCustomIssue;
  }

  if (publicKey) {
    try {
      const publicKeyValidator = PUBLIC_KEY_VALIDATORS[chain];

      publicKeyValidator.parse(publicKey);
    } catch (err) {
      issues.publicKey = {
        code: ZodIssueCode.custom,
        path: ["publicKey"],
        message: getErrorMessage(err),
      } satisfies ZodCustomIssue;
    }

    // TODO: Validate address-publicKey match (by generating the address)...
  }

  return Object.keys(issues).length === 0 ? null : issues;
}

export function validateWalletPrivacy(
  walletPrivacySetting: WalletPrivacySetting = WalletPrivacySetting.PUBLIC,
  publicKey?: string,
  canRecoverAccountSetting?: boolean
): null | ZodCustomIssue {
  if (walletPrivacySetting === WalletPrivacySetting.PRIVATE) {
    if (canRecoverAccountSetting) {
      return {
        code: ZodIssueCode.custom,
        path: ["canRecoverAccountSetting"],
        message: "Private wallets cannot be used to recover an account",
      } satisfies ZodCustomIssue;
    }

    if (publicKey) {
      return {
        code: ZodIssueCode.custom,
        path: ["publicKey"],
        message: "Private wallets do not accept a public key",
      } satisfies ZodCustomIssue;
    }
  }

  return null;
}
