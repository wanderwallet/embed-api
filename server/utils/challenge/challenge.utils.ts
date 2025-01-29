import { AnonChallenge, Challenge } from "@prisma/client";

export function generateChangeValue() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(512))).toString(
    "base64"
  );
}

export interface VerifyChallengeParams {
  challenge: Challenge | AnonChallenge;
  solution: string;
  now: number;
}

export async function solveChallenge({
  challenge,
}: VerifyChallengeParams) {
  // TODO: To be implemented...

  return "";
}


export async function verifyChallenge({
  challenge,
  solution,
  now,
}: VerifyChallengeParams) {
  // TODO: To be implemented...

  return true;
}

export const ChallengeUtils = {
  generateChangeValue,
  solveChallenge,
  verifyChallenge,
}
