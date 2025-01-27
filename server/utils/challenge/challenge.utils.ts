import { Challenge } from "@prisma/client";

export function generateChangeValue() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(512))).toString(
    "base64"
  );
}

export interface VerifyChallengeParams {
  challenge: Challenge;
  solution: string;
  now: number;
}

export async function verifyActivationChallenge({
  challenge,
  solution,
  now,
}: VerifyChallengeParams) {
  return true;
}

export const ChallengeUtils = {
  generateChangeValue,
  verifyActivationChallenge,
}
