import {
  ChallengeClient,
  ChallengeClientVersion,
  VerifyChallengeParams,
} from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1-rsa";
import { ChallengeClientV2 } from "@/server/utils/challenge/clients/challenge-client-v2-eddsa";
import { isAnonChallenge } from "@/server/utils/challenge/clients/challenge-client.utils";
import { Config } from "@/server/utils/config/config.constants";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { ChallengePurpose } from "@prisma/client";

/*
export function isAnonChallenge(
  challenge: Challenge | AnonChallenge
): challenge is AnonChallenge {
  return (
    !!(challenge as AnonChallenge).chain &&
    !!(challenge as AnonChallenge).address
  );
}
*/

const CHALLENGE_CLIENTS = [
  ChallengeClientV1,
  ChallengeClientV2,
 ].reduce((acc, client) => {
  if (acc[client.version]) throw new Error(`Duplicate client ${ client.version }`);

  acc[client.version] = client;

  return acc;
 }, {} as Record<ChallengeClientVersion, ChallengeClient<any>>);

export function generateChangeValue() {
  return Buffer.from(
    crypto.getRandomValues(new Uint8Array(Config.CHALLENGE_BUFFER_SIZE))
  ).toString("base64");
}

export interface GenerateChallengeUpsertDataParams {
  purpose: ChallengePurpose;
  publicKey: string;
}

export function generateChallengeUpsertData({
  purpose,
  publicKey,
}: GenerateChallengeUpsertDataParams) {
  const value = generateChangeValue();

  const version = isRSAPublicKey(publicKey)
    ? CHALLENGE_CLIENTS.v1.version
    : CHALLENGE_CLIENTS.v2.version;

  return {
    type: Config.CHALLENGE_TYPE,
    purpose,
    value,
    version,
    createdAt: new Date(),

    // Relations:
    userId: ctx.user.id,
    walletId: userWallet.id,
  } as const satisfies UpsertChallengeData;
}

export async function verifyChallenge(params: VerifyChallengeParams): Promise<null | string> {
  try {
    const {
      // ChallengeData:
      challenge,
      session,

      // Verification:
      now,
      solution,
    } = params;

    const challengeVersion = solution.split(".")[0] as ChallengeClientVersion;
    const challengeClient = CHALLENGE_CLIENTS[challengeVersion];

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
    const isChallengeAgeMoreThanOneMinute = challengeAge > 60000;

    if (process.env.NODE_ENV === "development") {
      if (challengeAge > challengeTTL) {
        console.log(`❌ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`);
      } else if (isChallengeAgeMoreThanOneMinute) {
        console.log(`⚠️ Challenge took more than a minute: ${ (challengeAge / 1000).toFixed(2) }s.`);
      } else {
        console.log(`✅ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (< ${ (challengeTTL / 1000).toFixed(2) }s).`);
      }
    }

    if (challengeAge > challengeTTL) {
      return `${ ErrorMessages.CHALLENGE_EXPIRED_ERROR } Took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`;
    }

    if (isChallengeAgeMoreThanOneMinute && process.env.NODE_ENV === "production") {
      console.warn(`Challenge for user ${ session.userId } took more than a minute: ${ (challengeAge / 1000).toFixed(2) }s (${ challengePercent }%). userAgent = ${ session.userAgent }`);
    }

    const verificationError = await challengeClient.verifyChallenge(params);

    if (verificationError) return verificationError;

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
