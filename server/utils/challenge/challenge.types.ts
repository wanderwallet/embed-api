import { Challenge, AnonChallenge, Session } from "@prisma/client";
import { JWKInterface } from "arweave/node/lib/wallet";

export type ChallengeClientVersion = `v${number}`;

export type ChallengeSolutionWithVersion = `${ChallengeClientVersion}.${string}`;

export interface ChallengeData {
  challenge: Challenge | AnonChallenge;
  session: Session;
  shareHash: null | string;
}

export interface SolveChallengeParams extends ChallengeData {
  jwk?: JWKInterface;
}

// TODO: The type of `importKeyAlgorithm` and `signAlgorithm` might have to be changed (extended) if we want to support other
// types of signatures or chains:

export interface ChallengeClient {
  version: ChallengeClientVersion;
  importKeyAlgorithm: RsaHashedImportParams;
  signAlgorithm: RsaPssParams;
  getChallengeRawData: (data: ChallengeData) => string;
  solveChallenge: (params: SolveChallengeParams) => Promise<ChallengeSolutionWithVersion>;
}

