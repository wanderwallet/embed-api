import {
  ChallengeClient,
  ChallengeClientVersion,
  UpsertChallengeData,
  VerifyChallengeParams,
} from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1-rsa";
import { ChallengeClientV2 } from "@/server/utils/challenge/clients/challenge-client-v2-eddsa";
import { isAnonChallenge } from "@/server/utils/challenge/clients/challenge-client.utils";
import { Config } from "@/server/utils/config/config.constants";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { isEdDSAPublicKey } from "@/server/utils/share/share.validators";
import { AnonChallenge, Chain, ChallengePurpose } from "@prisma/client";

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

function generateChangeValue() {
  return Buffer.from(
    crypto.getRandomValues(new Uint8Array(Config.CHALLENGE_BUFFER_SIZE))
  ).toString("base64");
}

export interface GenerateChallengeUpsertDataParams {
  purpose: ChallengePurpose;
  publicKey: string;

  // Relations:
  userId: string;
  walletId: string;
}

/**
 * Regular Challenges can use both EdDSA and RSA, depending on the format of the public key we'll be using to verify
 * them. Therefore, we need to pass that public key at generation time.
 *
 * Note for `SHARE_ROTATION` we always use RSA, as that one is resolved with a wallet private key signature.
 */
function generateChallengeUpsertData({
  purpose,
  publicKey,
  userId,
  walletId,
}: GenerateChallengeUpsertDataParams) {
  const value = generateChangeValue();

  const version = isEdDSAPublicKey(publicKey)
    ? CHALLENGE_CLIENTS.v2.version
    : CHALLENGE_CLIENTS.v1.version;

  if (purpose === ChallengePurpose.SHARE_ROTATION && version !== CHALLENGE_CLIENTS.v1.version) {
    throw new Error(`SHARE_ROTATION challenge must use v1 client (RSA), but got ${version}`);
  }

  return {
    type: Config.CHALLENGE_TYPE,
    purpose,
    value,
    version,
    createdAt: new Date(),

    // Relations:
    userId,
    walletId,
  } as const satisfies UpsertChallengeData;
}

export interface GenerateAnonChallengeDataParams {
  chain: Chain;
  address: string;
}

/**
 * AnonChallenges are resolved by signing with the wallet private key, so they use RSA. Therefore, they always use the
 * v1 challenge client.
 */
function generateAnonChallengeCreateData({
  chain,
  address,
}: GenerateAnonChallengeDataParams) {
  const value = generateChangeValue();
  const version = CHALLENGE_CLIENTS.v1.version;

  return  {
    value,
    version,
    createdAt: new Date(),
    chain,
    address,
  } satisfies Omit<AnonChallenge, "id">;
}

async function verifyChallenge(params: VerifyChallengeParams): Promise<null | string> {
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
  generateChallengeUpsertData,
  generateAnonChallengeCreateData,
  verifyChallenge,
};
