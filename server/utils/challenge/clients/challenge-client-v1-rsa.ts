import {
  ChallengeClient,
  ChallengeClientVersion,
  ChallengeSolutionWithVersion,
  SolveChallengeParams,
  VerifyChallengeParams
} from "@/server/utils/challenge/challenge.types";
import { getChallengeRawData, isAnonChallenge } from "@/server/utils/challenge/clients/challenge-client.utils";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengeType } from "@prisma/client";
import { JWKInterface } from "arweave/node/lib/wallet";
import { timingSafeEqual } from "node:crypto";

const CHALLENGE_CLIENT_VERSION = "v1" as const satisfies ChallengeClientVersion;

const IMPORT_KEY_ALGORITHM = {
  name: "RSA-PSS",
  hash: "SHA-256",
} as const satisfies RsaHashedImportParams;

const SIGN_ALGORITHM = {
  name: "RSA-PSS",
  saltLength: 32,
} as const satisfies RsaPssParams;

async function solveChallenge({
  challenge,
  session,
  shareHash,
  privateKey: jwk,
}: SolveChallengeParams<JWKInterface>) {
  const challengeRawData = getChallengeRawData({
    challenge,
    session,
    shareHash,
  });

  const challengeRawDataBuffer = Buffer.from(challengeRawData);

  let signatureOrHashBuffer: ArrayBuffer;

  if (
    isAnonChallenge(challenge) ||
    challenge.type === ChallengeType.SIGNATURE
  ) {
    if (!jwk) {
      throw new Error("Missing private key (jwk)");
    }

    const privateKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      IMPORT_KEY_ALGORITHM,
      true,
      ["sign"]
    );

    signatureOrHashBuffer = await crypto.subtle.sign(
      SIGN_ALGORITHM,
      privateKey,
      challengeRawDataBuffer
    );
  } else if (process.env.NODE_ENV === "development") {
    signatureOrHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      challengeRawDataBuffer
    );
  } else {
    throw new Error("Cannot solve challenge.");
  }

  const signatureOrHashString = Buffer.from(signatureOrHashBuffer).toString(
    "base64"
  );

  return `${CHALLENGE_CLIENT_VERSION}.${signatureOrHashString}` satisfies ChallengeSolutionWithVersion;
}

async function verifyChallenge({
  // ChallengeData:
  challenge,
  session,
  shareHash,

  // Verification:
  solution,
  publicKey: publicKeyParam,
}: VerifyChallengeParams) {
  const solutionValue = solution.split(".")[1];

  if (!solutionValue) {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }

  if (
    isAnonChallenge(challenge) ||
    challenge.type === ChallengeType.SIGNATURE
  ) {
    // SIGNATURE-BASED CHALLENGE:

    if (!publicKeyParam) {
      return ErrorMessages.CHALLENGE_MISSING_PK;
    }

    const publicJWK: JsonWebKey = {
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: publicKeyParam,
    };

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicJWK,
      IMPORT_KEY_ALGORITHM,
      true,
      ["verify"]
    );

    const challengeRawData = await getChallengeRawData({
      challenge,
      session,
      shareHash,
    });

    const challengeRawDataBuffer = Buffer.from(challengeRawData);

    const isSignatureValid = crypto.subtle.verify(
      SIGN_ALGORITHM,
      publicKey,
      Buffer.from(solutionValue, "base64"),
      challengeRawDataBuffer
    );

    if (!isSignatureValid) return ErrorMessages.CHALLENGE_INVALID;
  } else if (process.env.NODE_ENV === "development") {
    // HASH-BASED CHALLENGES:

    const expectedSolution = await solveChallenge({
      challenge,
      session,
      shareHash,
    });

    // The length of the solution, excluding the version prefix, should be:
    //
    // - 44 characters (String.length) when using a hash.
    // - 512 bytes (ArrayBuffer.byteLength) when using a signature from a 4096 modulusLength RSA.
    // - 256 bytes (ArrayBuffer.byteLength) when using a signature from a 2048 modulusLength RSA.
    // - ...
    //
    // However, there's no need to validate that, as we'll be comparing the whole value anyways.

    // Constant-time comparison probably not needed (as we are comparing hashes), but anyway, there's a theatrical
    // exploit if not doing so. See https://security.stackexchange.com/questions/209807/why-should-password-hash-verification-be-time-constant
    if (!timingSafeEqual(Buffer.from(expectedSolution, "utf16le"), Buffer.from(solution, "utf16le"))) return ErrorMessages.CHALLENGE_INVALID;
  } else {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }

  return null;

}

// This module should also be used on the client as-is.
// TODO: Remove verifyChallenge function for client use.

export const ChallengeClientV1: ChallengeClient<JWKInterface> = {
  version: CHALLENGE_CLIENT_VERSION,
  getChallengeRawData,
  solveChallenge,
  verifyChallenge,
};
