import { ChallengeClient, ChallengeClientVersion, ChallengeData, SolveChallengeParams } from "@/server/utils/challenge/challenge.types";
import { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1-rsa";
import { ChallengeClientV2 } from "@/server/utils/challenge/clients/challenge-client-v2-eddsa";
import { AnonChallenge, Challenge, ChallengePurpose } from "@prisma/client";
import { JWKInterface } from "arweave/node/lib/wallet";

// We duplicate this function instead of importing it to as `challenge.utils.ts` imports `Config`, which throws an error
// when imported in the browser:

export function isAnonChallenge(
  challenge: Challenge | AnonChallenge
): challenge is AnonChallenge {
  return (
    !!(challenge as AnonChallenge).chain &&
    !!(challenge as AnonChallenge).address
  );
}

const CHALLENGES_WITHOUT_SHARE_HASH: ChallengePurpose[] = [
  ChallengePurpose.SHARE_ROTATION,
  ChallengePurpose.ACCOUNT_RECOVERY,
  ChallengePurpose.SHARE_RECOVERY,
];

export function getChallengeRawData({ challenge, session, shareHash }: ChallengeData) {
  const commonChallengeData = [
    challenge.id,
    challenge.createdAt.toISOString(),
    challenge.value,
    challenge.version,
    session.id,
    session.ip,
    session.deviceNonce,
    session.userAgent,
  ].join("|");

  if (isAnonChallenge(challenge)) {
    return `ANON|${commonChallengeData}|${challenge.chain}|${challenge.address}`;
  }

  if (
    !shareHash &&
    !CHALLENGES_WITHOUT_SHARE_HASH.includes(challenge.purpose)
  ) {
    throw new Error("Missing `shareHash`");
  }

  return [
    challenge.purpose,
    commonChallengeData,
    challenge.userId,
    challenge.walletId,
    shareHash,
  ]
    .filter(Boolean)
    .join("|");
}

export const CHALLENGE_CLIENTS = [
  ChallengeClientV1,
  ChallengeClientV2,
 ].reduce((acc, client) => {
  if (acc[client.version]) throw new Error(`Duplicate client ${ client.version }`);

  acc[client.version] = client;

  return acc;
 }, {} as Record<ChallengeClientVersion, ChallengeClient<any>>);

export function solveChallenge({
  challenge,
  session,
  shareHash = null,
  privateKey,
}: SolveChallengeParams<JWKInterface | Uint8Array>): Promise<string> {
  const challengeClient = CHALLENGE_CLIENTS[challenge.version as ChallengeClientVersion];

  console.log(`Solving ${challenge.version} challenge with privateKey =`, privateKey);

  if (!challengeClient) {
    throw new Error(`Unsupported challenge version: ${challenge.version}`);
  }

  return challengeClient.solveChallenge({
    challenge,
    session,
    shareHash,
    privateKey,
  });
}
