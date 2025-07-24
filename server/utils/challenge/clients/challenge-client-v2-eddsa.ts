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

    /*
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
    */

    // const msg = new Uint8Array(32).fill(1); // message hash (not message) in ecdsa
    signatureBuffer = ed25519.sign(challengeRawDataBuffer, privateKey); // `{prehash: true}` option is available
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
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }

  return null;
}

export const ChallengeClientV2: ChallengeClient<Uint8Array> = {
  version: CHALLENGE_CLIENT_VERSION,
  getChallengeRawData,
  solveChallenge,
  verifyChallenge: process.env.BUILD_TYPE === "SDK" ? undefined as any : verifyChallenge,
};
