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
import { ed25519 } from "@noble/curves/ed25519.js";

const CHALLENGE_CLIENT_VERSION = "v2" as const satisfies ChallengeClientVersion;

async function solveChallenge({
  challenge,
  session,
  shareHash,
  privateKey,
}: SolveChallengeParams<Uint8Array>) {
  const challengeRawData = getChallengeRawData({
    challenge,
    session,
    shareHash,
  });

  const challengeRawDataBuffer = Buffer.from(challengeRawData);

  let signatureBuffer: Uint8Array;

  if (
    isAnonChallenge(challenge) ||
    challenge.type === ChallengeType.SIGNATURE
  ) {
    if (!privateKey) {
      throw new Error("Missing private key");
    }

    // The message is hashed automatically by the library. Otherwise, use `ed25519ph` instead.
    signatureBuffer = ed25519.sign(challengeRawDataBuffer, privateKey);
  } else {
    throw new Error("Cannot solve challenge.");
  }

  const signatureOrHashString = Buffer.from(signatureBuffer).toString(
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
    console.warn("Missing EdDSA challenge solution.");

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

    const challengeRawData = await getChallengeRawData({
      challenge,
      session,
      shareHash,
    });

    const challengeRawDataBuffer = Buffer.from(challengeRawData);

    const isSignatureValid = ed25519.verify(
      Buffer.from(solutionValue, "base64"),
      challengeRawDataBuffer,
      // TODO: Make sure it is in the right encoding:
      Buffer.from(publicKeyParam, "base64"),
    );

    if (!isSignatureValid) return ErrorMessages.CHALLENGE_INVALID;
  } else {
    console.warn(`Unexpected EdDSA ${ isAnonChallenge(challenge) ? "anon challenge" : "challenge" } type (${ challenge.type }).`);

    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }

  return null;
}


/**
 * IMPORTANT NOTE: Cryptographically relevant quantum computer, if built, will allow to break elliptic curve
 * cryptography (both ECDSA / EdDSA & ECDH) using Shor's algorithm.
 *
 * Consider switching to newer / hybrid algorithms, such as SPHINCS+. They are available in noble-post-quantum.
 *
 * NIST prohibits classical cryptography (RSA, DSA, ECDSA, ECDH) after 2035. Australian ASD prohibits it after 2030.
 *
 * @see https://github.com/paulmillr/noble-curves?tab=readme-ov-file#quantum-computers
 * @see https://github.com/paulmillr/noble-post-quantum
 */
export const ChallengeClientV2: ChallengeClient<Uint8Array> = {
  version: CHALLENGE_CLIENT_VERSION,
  ttlMs: 30000, // 30 seconds
  ttlRotationMs: 60000, // 60 seconds - Longer because the shares need to be regenerated, which can take some time.
  getChallengeRawData,
  solveChallenge,
  verifyChallenge: process.env.BUILD_TYPE === "SDK" ? undefined as any : verifyChallenge,
};
