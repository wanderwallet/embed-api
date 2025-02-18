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

export function getEnvPrivateRSAKeyValidator(key: string) {
  // TODO: Properly validate private RSA key format
  return z
    .string()
    .nonempty(`${ key } is required`);
}

export function getEnvPublicRSAKeyValidator(key: string) {
  // TODO: Properly validate public RSA key format

  return z
    .string()
    .nonempty(`${ key } is required`);
}

export function initConfig() {
  // Challenges:
  const CHALLENGE_TYPE = process.env.CHALLENGE_TYPE as ChallengeType;
  const CHALLENGE_VERSION = process.env.CHALLENGE_TYPE;
  const CHALLENGE_BUFFER_SIZE = process.env.CHALLENGE_BUFFER_SIZE;
  const CHALLENGE_TTL_MS = process.env.CHALLENGE_TTL_MS;

  // Shares:
  const SHARE_ACTIVE_TTL_MS = process.env.SHARE_ACTIVE_TTL_MS;
  const SHARE_INACTIVE_TTL_MS = process.env.SHARE_INACTIVE_TTL_MS;
  const SHARE_MAX_ROTATION_IGNORES = process.env.SHARE_MAX_ROTATION_IGNORES;
  const SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS = process.env.SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS;
  const SHARE_MAX_FAILED_RECOVERY_ATTEMPTS = process.env.SHARE_MAX_FAILED_RECOVERY_ATTEMPTS;

  // Auth Method, Wallet & Share Limits:
  const MAX_AUTH_METHODS_PER_USER = process.env.MAX_AUTH_METHODS_PER_USER;
  const MAX_WALLETS_PER_USER = process.env.MAX_WALLETS_PER_USER;
  const MAX_WORK_SHARES_PER_WALLET = process.env.MAX_WORK_SHARES_PER_WALLET;
  const MAX_RECOVERY_SHARES_PER_WALLET = process.env.MAX_RECOVERY_SHARES_PER_WALLET;

  // Backup:
  const BACKUP_FILE_PRIVATE_KEY = process.env.BACKUP_FILE_PRIVATE_KEY;
  const BACKUP_FILE_PUBLIC_KEY = process.env.BACKUP_FILE_PUBLIC_KEY;

  const ConfigSchema = z.object({
    // Challenges:
    CHALLENGE_TYPE: getEnvEnumValidator("CHALLENGE_TYPE", ChallengeType),
    CHALLENGE_VERSION: getEnvStringValidator("CHALLENGE_VERSION"),
    CHALLENGE_BUFFER_SIZE: getEnvNumberValidator("CHALLENGE_BUFFER_SIZE"),
    CHALLENGE_TTL_MS: getEnvNumberValidator("CHALLENGE_TTL_MS"),

    // Shares:
    SHARE_ACTIVE_TTL_MS: getEnvNumberValidator("SHARE_ACTIVE_TTL_MS"),
    SHARE_INACTIVE_TTL_MS: getEnvNumberValidator("SHARE_INACTIVE_TTL_MS"),
    SHARE_MAX_ROTATION_IGNORES: getEnvNumberValidator("SHARE_MAX_ROTATION_IGNORES"),
    SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS: getEnvNumberValidator("SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS"),
    SHARE_MAX_FAILED_RECOVERY_ATTEMPTS: getEnvNumberValidator("SHARE_MAX_FAILED_RECOVERY_ATTEMPTS"),

    // Auth Method, Wallet & Share Limits:
    MAX_AUTH_METHODS_PER_USER: getEnvNumberValidator("MAX_AUTH_METHODS_PER_USER"),
    MAX_WALLETS_PER_USER: getEnvNumberValidator("MAX_WALLETS_PER_USER"),
    MAX_WORK_SHARES_PER_WALLET: getEnvNumberValidator("MAX_WORK_SHARES_PER_WALLET"),
    MAX_RECOVERY_SHARES_PER_WALLET: getEnvNumberValidator("MAX_RECOVERY_SHARES_PER_WALLET"),

    // Backup:
    BACKUP_FILE_PRIVATE_KEY: getEnvPrivateRSAKeyValidator("BACKUP_FILE_PRIVATE_KEY"),
    BACKUP_FILE_PUBLIC_KEY: getEnvPublicRSAKeyValidator("BACKUP_FILE_PUBLIC_KEY"),
  });

  const config = ConfigSchema.parse({
    // Challenges:
    CHALLENGE_TYPE,
    CHALLENGE_VERSION,
    CHALLENGE_BUFFER_SIZE,
    CHALLENGE_TTL_MS,

    // Shares:
    SHARE_ACTIVE_TTL_MS,
    SHARE_INACTIVE_TTL_MS,
    SHARE_MAX_ROTATION_IGNORES,
    SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS,
    SHARE_MAX_FAILED_RECOVERY_ATTEMPTS,

    // Auth Method, Wallet & Share Limits:
    MAX_AUTH_METHODS_PER_USER,
    MAX_WALLETS_PER_USER,
    MAX_WORK_SHARES_PER_WALLET,
    MAX_RECOVERY_SHARES_PER_WALLET,

    // Backup:
    BACKUP_FILE_PRIVATE_KEY,
    BACKUP_FILE_PUBLIC_KEY,
  });

  return config;
}

export const Config = initConfig();
