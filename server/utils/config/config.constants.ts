import { ChallengeType } from "@prisma/client";
import { EnumLike, z } from "zod";

export function getEnvStringValidator(key: string) {
  return z
    .string()
    .nonempty(`${ key } is required`);
}

export function getEnvNumberValidator(key: string, min = 0) {
  return z
    .string()
    .nonempty(`${ key } is required`)
    .transform((val) => parseInt(val))
    .pipe(z.number().min(min, `${ key } must be > 0`));
}

export function getEnvEnumValidator<T extends EnumLike>(key: string, values: T) {
  return z.nativeEnum(values);
}

export function initConfig() {
  const CHALLENGE_TYPE = process.env.CHALLENGE_TYPE as ChallengeType;
  const CHALLENGE_VERSION = process.env.CHALLENGE_TYPE;
  const CHALLENGE_TTL_MS = process.env.CHALLENGE_TTL_MS;

  const SHARE_TTL_MS = process.env.SHARE_TTL_MS;
  const SHARE_ROTATION_IGNORE_LIMIT = process.env.SHARE_ROTATION_IGNORE_LIMIT;

  const ConfigSchema = z.object({
    CHALLENGE_TYPE: getEnvEnumValidator("CHALLENGE_TYPE", ChallengeType),
    CHALLENGE_VERSION: getEnvStringValidator("CHALLENGE_VERSION"),
    CHALLENGE_TTL_MS: getEnvNumberValidator("CHALLENGE_TTL_MS"),
    SHARE_TTL_MS: getEnvNumberValidator("SHARE_TTL_MS"),
    SHARE_ROTATION_IGNORE_LIMIT: getEnvNumberValidator("SHARE_ROTATION_IGNORE_LIMIT"),
  });

  const config = ConfigSchema.parse({
    CHALLENGE_TYPE,
    CHALLENGE_VERSION,
    CHALLENGE_TTL_MS,
    SHARE_TTL_MS,
    SHARE_ROTATION_IGNORE_LIMIT,
  });

  return config;
}

export const Config = initConfig();
