import { ChallengeData } from "@/server/utils/challenge/challenge.types";
import { AnonChallenge, Challenge, ChallengePurpose } from "@prisma/client";

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
