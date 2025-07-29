import {
  ChallengeClientVersion,
  UpsertChallengeData,
  VerifyChallengeParams,
} from "@/server/utils/challenge/challenge.types";
import { CHALLENGE_CLIENTS, isAnonChallenge } from "@/server/utils/challenge/clients/challenge-client.utils";
import { Config } from "@/server/utils/config/config.constants";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { isEdDSAPublicKey } from "@/server/utils/share/share.validators";
import { AnonChallenge, Chain, ChallengePurpose } from "@prisma/client";

function generateChangeValue() {
  return Buffer.from(
    crypto.getRandomValues(new Uint8Array(Config.CHALLENGE_BUFFER_SIZE))
  ).toString("base64");
}

export interface GenerateChallengeUpsertDataParams {
  purpose: ChallengePurpose;
  publicKey: string;
  ip: string;

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
  ip,
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
    ip,

    // Relations:
    userId,
    walletId,
  } as const satisfies UpsertChallengeData;
}

export interface GenerateAnonChallengeDataParams {
  ip: string;
  chain: Chain;
  address: string;
}

/**
 * AnonChallenges are resolved by signing with the wallet private key, so they use RSA. Therefore, they always use the
 * v1 challenge client.
 */
function generateAnonChallengeCreateData({
  ip,
  chain,
  address,
}: GenerateAnonChallengeDataParams) {
  const value = generateChangeValue();
  const version = CHALLENGE_CLIENTS.v1.version;

  return  {
    value,
    version,
    createdAt: new Date(),
    ip,
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

    // Verify challenge age/expiration:

    const challengeTTL =
      isAnonChallenge(challenge) ||
      challenge.purpose === ChallengePurpose.SHARE_ROTATION
        ? challengeClient.ttlRotationMs
        : challengeClient.ttlMs;

    const challengeAge = now - challenge.createdAt.getTime();
    const challengePercent = 100 * challengeAge / challengeTTL;
    const challengePercentStr = challengePercent.toFixed(2);
    const isChallengeAgeNearingExpiration = challengePercent > 80;

    if (process.env.NODE_ENV === "development") {
      if (challengeAge > challengeTTL) {
        console.log(`❌ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`);
      } else if (isChallengeAgeNearingExpiration) {
        console.log(`⚠️ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (${ challengePercentStr }% of ${ (challengeTTL / 1000).toFixed(2) }s).`);
      } else {
        console.log(`✅ Challenge took ${ (challengeAge / 1000).toFixed(2) }s (< ${ (challengeTTL / 1000).toFixed(2) }s).`);
      }
    }

    if (challengeAge > challengeTTL) {
      return `${ ErrorMessages.CHALLENGE_EXPIRED } Took ${ (challengeAge / 1000).toFixed(2) }s (> ${ (challengeTTL / 1000).toFixed(2) }s).`;
    }

    if (isChallengeAgeNearingExpiration && process.env.NODE_ENV === "production") {
      console.warn(`Challenge for user ${ session.userId } took ${ (challengeAge / 1000).toFixed(2) }s (${ challengePercentStr }% of ${ (challengeTTL / 1000).toFixed(2) }s). userAgent = ${ session.userAgent }`);
    }

    // Verify challenge IP:

    if (challenge.ip !== session.ip) {
      console.warn(`Challenge IP mismatch: challenge.ip = ${ challenge.ip }, session.ip = ${ session.ip }`);
      return ErrorMessages.CHALLENGE_IP_MISMATCH;
    }

    // Verify challenge signature and solution:

    const verificationError = await challengeClient.verifyChallenge(params);

    if (verificationError) return verificationError;

    return null;
  } catch (err) {
    console.error(`Unexpected challenge validation error =`, err);

    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
}

export const ChallengeUtils = {
  generateChallengeUpsertData,
  generateAnonChallengeCreateData,
  verifyChallenge,
};
