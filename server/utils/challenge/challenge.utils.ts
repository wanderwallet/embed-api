import { AnonChallenge, Challenge, ChallengeType, Wallet } from "@prisma/client";
import { JWKInterface } from "arweave/node/lib/wallet";

export function isAnonChallenge(challenge: Challenge | AnonChallenge): challenge is AnonChallenge {
  return !!(challenge as AnonChallenge).chain && !!(challenge as AnonChallenge).address;
}

export function generateChangeValue() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(512))).toString(
    "base64"
  );
}

export interface SolveChallengeParams {
  challenge: Challenge | AnonChallenge;
  jwk?: JWKInterface;
}

export async function solveChallenge({
  challenge,
  jwk,
}: SolveChallengeParams) {
  if (isAnonChallenge(challenge)) {
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["sign"],
    );

    const encoded = Buffer.from(`ANON|${ challenge.value }|${ chain }|${ address }`);

    return crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32, // TODO: Get from `challenge` (random)
      },
      privateKey,
      encoded,
    );
  }

  let dataToEncode = "";

  switch(challenge.purpose) {
    case "ACTIVATION":
      dataToEncode = `ACTIVATION|${ challenge.value }|${ userId }|${ walletId }|${ deviceShareHash }`;
      break;

    case "SHARE_ROTATION":
      dataToEncode = `SHARE_ROTATION|${ challenge.value }|${ userId }|${ walletId }|${ deviceShareHash }`;
      break;

    case "SHARE_RECOVERY":
      dataToEncode = `SHARE_RECOVERY|${ challenge.value }|${ userId }|${ walletId }|${ recoveryBackupShareHash }`;
      break;

    case "ACCOUNT_RECOVERY":
      dataToEncode = `ACCOUNT_RECOVERY|${ challenge.value }|${ userId }|${ walletId }`;
      break;
  }

  if (challenge.type === ChallengeType.SIGNATURE) {
    const encoded = Buffer.from(dataToEncode);

    return crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32, // TODO: Get from `challenge` (random)
      },
      privateKey,
      encoded,
    );
  }

  // TODO: Append challenge version to raw output.

  return {
    plain: dataToEncode,
    hash: null,
    signature: null,
  }

}

export interface VerifyChallengeParams {
  challenge: Challenge | AnonChallenge;
  wallet: Wallet;
  solution: string;
  now: number;
}

export async function verifyChallenge({
  challenge,
  wallet,
  solution,
  now,
}: VerifyChallengeParams) {
  // TODO: Challenge must come from the same device/IP (just serialize session)?

  const solved = await solveChallenge({
    challenge,
  });

  if (isAnonChallenge(challenge)) {
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      new ArrayBuffer(atob(wallet.publicKey)),
      {
        // TODO: Move to config and keep implementation for different "challenge version" live at the same time.
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      true,
      ["sign"],
    );

    crypto.subtle.verify({
      name: "RSA-PSS",
      saltLength: 32,
    }, publicKey, signature, solved.hash)
  } else {

  }

  if (challenge.type === ChallengeType.SIGNATURE) {
    const encoded = Buffer.from(dataToEncode);

    return crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32, // TODO: Get from `challenge` (random)
      },
      privateKey,
      encoded,
    );
  }

  return true;
}

export const ChallengeUtils = {
  generateChangeValue,
  solveChallenge,
  verifyChallenge,
}
