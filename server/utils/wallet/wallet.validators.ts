import { getErrorMessage } from "@/server/utils/error/error.utils";
import { defaultGateway } from "@/server/utils/gateway/gateway.constants";
import { Chain } from "@prisma/client";
import { z, ZodCustomIssue, ZodIssueCode } from "zod";
import Arweave from "arweave";

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

export function getPublicKeyValidator<T extends string = string>(chain: Chain) {
  return z.custom<T>((val) => {
    return typeof val === "string" ? PUBLIC_KEY_REX_EXPS[Chain.ARWEAVE].test(val) : false;
  }, `Invalid ${ chain } public key`)
}

export async function getAddressFromPublicKey<
  P extends string = string,
  A extends string = string
>(chain: Chain, publicKey: P): Promise<A> {
  const arweave = new Arweave(defaultGateway);

  if (chain === Chain.ARWEAVE) {
    return arweave.wallets.ownerToAddress(publicKey) as Promise<A>;
  }

  throw new Error(`Unsupported chain: ${ chain }`);
}

export async function validateWallet(
  chain: Chain,
  address: string,
  publicKey?: string,
): Promise<ZodCustomIssue[]> {
  const issues: ZodCustomIssue[] = [];

  try {
    const addressValidator = getAddressValidator(chain);

    addressValidator.parse(address);
  } catch (err) {
    issues.push({
      code: ZodIssueCode.custom,
      path: ["address"],
      message: getErrorMessage(err),
    });
  }

  if (publicKey) {
    try {
      const publicKeyValidator = getPublicKeyValidator(chain);

      publicKeyValidator.parse(publicKey);
    } catch (err) {
      issues.push({
        code: ZodIssueCode.custom,
        path: ["publicKey"],
        message: getErrorMessage(err),
      });
    }

    try {
      const generatedAddress = await getAddressFromPublicKey(chain, publicKey);

      if (generatedAddress !== address) throw new Error("Address and public key mismatch");
    } catch (err) {
      issues.push({
        code: ZodIssueCode.custom,
        path: ["address"],
        message: getErrorMessage(err),
      });
    }
  }

  return issues;
}
