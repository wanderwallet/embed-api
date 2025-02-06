import { ChallengeClient, ChallengeClientVersion, ChallengeData } from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";
import { Config } from "@/server/utils/config/config.constants";
import { AnonChallenge, Challenge, ChallengeType } from "@prisma/client";

export function isAnonChallenge(challenge: Challenge | AnonChallenge): challenge is AnonChallenge {
  return !!(challenge as AnonChallenge).chain && !!(challenge as AnonChallenge).address;
}

export function generateChangeValue() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(512))).toString(
    "base64"
  );
}

const CHALLENGE_CLIENTS = {
  [ChallengeClientV1.version]: ChallengeClientV1,
} as const satisfies Record<ChallengeClientVersion, ChallengeClient>;

export interface VerifyChallengeParams extends ChallengeData {
  now: number;
  solution: string; // B64
  publicKey: null | string; // B64
}

export async function verifyChallenge({
  // ChallengeData:
  challenge,
  session,
  shareHash,

  // Verification:
  now,
  solution: solutionParam,
  publicKey: publicKeyParam,
}: VerifyChallengeParams) {
  try {
    const [solutionVersion, solution] = solutionParam.split(".");
    const challengeClient = CHALLENGE_CLIENTS[solutionVersion];

    if (!challengeClient) {
      throw new Error(`Invalid challenge version`);
    }

    if (now - challenge.createdAt.getTime() >= Config.CHALLENGE_TTL_MS) {
      return false;
    }

    if (isAnonChallenge(challenge) || challenge.type === ChallengeType.SIGNATURE) {
      if (!publicKeyParam) {
        throw new Error("Missing `publicKey` (base64 public key)");
      }

      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        Buffer.from(publicKeyParam, "base64"),
        challengeClient.importKeyAlgorithm,
        true,
        ["sign"],
      );

      const challengeRawData = await challengeClient.getChallengeRawData({ challenge, session, shareHash });
      const challengeRawDataBuffer = Buffer.from(challengeRawData);

      return crypto.subtle.verify(
        challengeClient.signAlgorithm,
        publicKey,
        Buffer.from(solution, "base64"),
        challengeRawDataBuffer,
      );
    }

    const expectedSolution = await challengeClient.solveChallenge({ challenge, session, shareHash });

    return expectedSolution === solution;
  } catch (err) {
    console.warn(`Unexpected challenge validation error =`, err);

    return false;
  }
}

export const ChallengeUtils = {
  generateChangeValue,
  verifyChallenge,
}
