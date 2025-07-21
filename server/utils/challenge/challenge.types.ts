import { Challenge, AnonChallenge, Session } from "@prisma/client";

export type ChallengeClientVersion = `v${number}`;

export type ChallengeSolutionWithVersion = `${ChallengeClientVersion}.${string}`;

export interface ChallengeData {
  challenge: Challenge | AnonChallenge;
  session: Session;
  shareHash: null | string;
}

export type UpsertChallengeData = Omit<Challenge, "id">

export interface SolveChallengeParams<T> extends ChallengeData {
  privateKey?: T;
}

export interface VerifyChallengeParams extends ChallengeData {
  now: number;
  solution: string; // B64
  publicKey: null | string; // B64 (JWK.n)
}

export interface ChallengeClient<T> {
  version: ChallengeClientVersion;
  getChallengeRawData: (data: ChallengeData) => string;
  solveChallenge: (params: SolveChallengeParams<T>) => Promise<ChallengeSolutionWithVersion>;
  verifyChallenge: (params: VerifyChallengeParams) => Promise<string | null>;
}

