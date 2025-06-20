import {
  ChallengeClient,
  ChallengeClientVersion,
  ChallengeData,
} from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";
import { Config } from "@/server/utils/config/config.constants";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import {
  AnonChallenge,
  Challenge,
  ChallengePurpose,
  ChallengeType,
} from "@prisma/client";
import { timingSafeEqual } from "node:crypto";

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
}: VerifyChallengeParams): Promise<null | string> {
  try {
    const [solutionVersion, solutionValue] = solution.split(".");
    const challengeClient = CHALLENGE_CLIENTS[solutionVersion];

    if (!challengeClient) {
      return ErrorMessages.CHALLENGE_INVALID;
    }

    // TODO: Make TTL for hash-based challenges shorter:

    const challengeTTL =
      isAnonChallenge(challenge) ||
      challenge.purpose === ChallengePurpose.SHARE_ROTATION
        ? Config.CHALLENGE_ROTATION_TTL_MS
        : Config.CHALLENGE_TTL_MS;
    const challengeAge = now - challenge.createdAt.getTime();
    const challengePercent = (100 * challengeAge / challengeTTL).toFixed(2);
    const isChallengeAgeNearingTTL = challengeAge >= challengeTTL * 0.8;

    if (process.env.NODE_ENV === "development") {
      if (challengeAge > challengeTTL) {
        console.log(`❌ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`);
      } else if (isChallengeAgeNearingTTL) {
        console.log(`⚠️ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (${ challengePercent }% of ${ (challengeTTL / 1000).toFixed(2) }s).`);
      } else {
        console.log(`✅ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (< ${ (challengeTTL / 1000).toFixed(2) }s).`);
      }
    }

    if (challengeAge > challengeTTL) {
      return `${ ErrorMessages.CHALLENGE_EXPIRED_ERROR } Took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`;
    }

    if (isChallengeAgeNearingTTL && process.env.NODE_ENV === "production") {
      console.log(`⚠️ Challenge for user ${ session.userId } took ${ (challengeAge / 1000).toFixed(2) }s (${ challengePercent }% of ${ (challengeTTL / 1000).toFixed(2) }s). userAgent = ${ session.userAgent }`);
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

      const isSignatureValid = crypto.subtle.verify(
        challengeClient.signAlgorithm,
        publicKey,
        Buffer.from(solutionValue, "base64"),
        challengeRawDataBuffer
      );

      if (!isSignatureValid) return ErrorMessages.CHALLENGE_INVALID;
    } else {
      // HASH-BASED CHALLENGES:

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

      // Constant-time comparison probably not needed (as we are comparing hashes), but anyway, there's a theatrical
      // exploit if not doing so. See https://security.stackexchange.com/questions/209807/why-should-password-hash-verification-be-time-constant
      if (!timingSafeEqual(Buffer.from(expectedSolution, "utf16le"), Buffer.from(solution, "utf16le"))) return ErrorMessages.CHALLENGE_INVALID;
    }

    return null;
  } catch (err) {
    console.warn(`Unexpected challenge validation error =`, err);

    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
}

export const ChallengeUtils = {
  generateChangeValue,
  verifyChallenge,
};
