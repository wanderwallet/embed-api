import {
  ChallengeClient,
  ChallengeClientVersion,
  ChallengeData,
} from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";
import { Config } from "@/server/utils/config/config.constants";
import {
  AnonChallenge,
  Challenge,
  ChallengePurpose,
  ChallengeType,
} from "@prisma/client";

export function isAnonChallenge(
  challenge: Challenge | AnonChallenge
): challenge is AnonChallenge {
  return (
    !!(challenge as AnonChallenge).chain &&
    !!(challenge as AnonChallenge).address
  );
}

export function generateChangeValue() {
  return Buffer.from(
    crypto.getRandomValues(new Uint8Array(Config.CHALLENGE_BUFFER_SIZE))
  ).toString("base64");
}

const CHALLENGE_CLIENTS = {
  [ChallengeClientV1.version]: ChallengeClientV1,
} as const satisfies Record<ChallengeClientVersion, ChallengeClient>;

export interface VerifyChallengeParams extends ChallengeData {
  now: number;
  solution: string; // B64
  publicKey: null | string; // JWK.n
}

export async function verifyChallenge({
  // ChallengeData:
  challenge,
  session,
  shareHash,

  // Verification:
  now,
  solution,
  publicKey: publicKeyParam,
}: VerifyChallengeParams) {
  try {
    const [solutionVersion, solutionValue] = solution.split(".");
    const challengeClient = CHALLENGE_CLIENTS[solutionVersion];

    if (!challengeClient) {
      throw new Error(`Invalid challenge version`);
    }

    const challengeTTL =
      isAnonChallenge(challenge) ||
      challenge.purpose === ChallengePurpose.SHARE_ROTATION
        ? Config.CHALLENGE_ROTATION_TTL_MS
        : Config.CHALLENGE_TTL_MS;

    if (now - challenge.createdAt.getTime() >= challengeTTL) {
      return false;
    }

    if (
      isAnonChallenge(challenge) ||
      challenge.type === ChallengeType.SIGNATURE
    ) {
      if (!publicKeyParam) {
        throw new Error("Missing `publicKey`");
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
        challengeClient.importKeyAlgorithm,
        true,
        ["verify"]
      );

      const challengeRawData = await challengeClient.getChallengeRawData({
        challenge,
        session,
        shareHash,
      });

      const challengeRawDataBuffer = Buffer.from(challengeRawData);

      return crypto.subtle.verify(
        challengeClient.signAlgorithm,
        publicKey,
        Buffer.from(solutionValue, "base64"),
        challengeRawDataBuffer
      );
    }

    const expectedSolution = await challengeClient.solveChallenge({
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

    return expectedSolution === solution;
  } catch (err) {
    console.warn(`Unexpected challenge validation error =`, err);

    return false;
  }
}

export const ChallengeUtils = {
  generateChangeValue,
  verifyChallenge,
};
