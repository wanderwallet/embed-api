import { ChallengeClient, ChallengeClientVersion, ChallengeData, ChallengeSolutionWithVersion, SolveChallengeParams } from "@/server/utils/challenge/challenge.types";
import { isAnonChallenge } from "@/server/utils/challenge/challenge.utils";
import { ChallengePurpose, ChallengeType } from "@prisma/client";

const CHALLENGES_WITHOUT_SHARE_HASH: ChallengePurpose[] = [
  ChallengePurpose.SHARE_ROTATION,
  ChallengePurpose.ACCOUNT_RECOVERY,
];

function getChallengeRawData({
  challenge,
  session,
  shareHash,
}: ChallengeData) {
  const commonChallengeData = [
    challenge.id,
    challenge.createdAt,
    challenge.value,
    challenge.version,
    session.id,
    session.ip,
    session.countryCode,
    session.deviceNonce,
    session.userAgent,
  ].join("|");

  if (isAnonChallenge(challenge)) {
    return `ANON|${ commonChallengeData }|${ challenge.chain }|${ challenge.address }`;
  }

  if (!shareHash && !CHALLENGES_WITHOUT_SHARE_HASH.includes(challenge.purpose)) {
    throw new Error("Missing `shareHash`");
  }

  return [
    challenge.purpose,
    commonChallengeData,
    challenge.userId,
    challenge.walletId,
    shareHash,
  ].filter(Boolean).join("|");
}

const CHALLENGE_CLIENT_VERSION = "v1" as const satisfies ChallengeClientVersion;

const IMPORT_KEY_ALGORITHM = {
  name: "RSA-PSS",
  hash: "SHA-256",
} as const satisfies RsaHashedImportParams;

const SIGN_ALGORITHM  = {
  name: "RSA-PSS",
  saltLength: 32,
} as const satisfies RsaPssParams;

async function solveChallenge({
  challenge,
  session,
  shareHash,
  jwk,
}: SolveChallengeParams) {
  const challengeRawData = getChallengeRawData({ challenge, session, shareHash });
  const challengeRawDataBuffer = Buffer.from(challengeRawData);

  let signatureOrHashBuffer: ArrayBuffer;

  if (isAnonChallenge(challenge) || challenge.type === ChallengeType.SIGNATURE) {
    if (!jwk) {
      throw new Error("Missing `jwk` (JWK private key)");
    }

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      IMPORT_KEY_ALGORITHM,
      true,
      ["sign"],
    );

    signatureOrHashBuffer = await crypto.subtle.sign(
      SIGN_ALGORITHM,
      privateKey,
      challengeRawDataBuffer,
    );
  } else {
    signatureOrHashBuffer = await crypto.subtle.digest("SHA-256", challengeRawDataBuffer);
  }

  const signatureOrHashString = Buffer.from(signatureOrHashBuffer).toString("base64");

  return `${CHALLENGE_CLIENT_VERSION}.${signatureOrHashString}` satisfies ChallengeSolutionWithVersion;
}

// This module should also be used on the client as-is.

export const ChallengeClientV1: ChallengeClient = {
  version: CHALLENGE_CLIENT_VERSION,
  importKeyAlgorithm: IMPORT_KEY_ALGORITHM,
  signAlgorithm: SIGN_ALGORITHM,
  getChallengeRawData,
  solveChallenge,
}
