import { ensureIsServer } from "@/server/utils/env/env.utils";
import { ChallengeType } from "@prisma/client";
import { EnumLike, z, ZodError } from "zod";

ensureIsServer("config.constants.ts");

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

export function getEnvUrlValidator(key: string) {
  return z
    .string()
    .nonempty(`${ key } is required`)
    .url(`${ key } is not a valid URL`);
}

export function getEnvPostgresUrlValidator(key: string) {
  return getEnvUrlValidator(key)
    .startsWith("postgres://", `${ key } is not a valid POSTGRES URL`);
}

export function getEnvHttpsUrlValidator(key: string) {
  return getEnvUrlValidator(key)
    .startsWith("https://", `${ key } is not a valid HTTPS URL`);
}

export function getEnvPrivateRSAKeyValidator(key: string) {
  // TODO: Properly validate private RSA key format:
  return z
    .string()
    .nonempty(`${ key } is required`);
}

export function getEnvPublicRSAKeyValidator(key: string) {
  // TODO: Properly validate public RSA key format:
  return z
    .string()
    .nonempty(`${ key } is required`);
}

export function initConfig() {
  // Database (from Vercel > Storage > Supabase)
  const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DEV_POSTGRES_URL;
  const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || process.env.DEV_POSTGRES_PRISMA_URL;
  const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || process.env.DEV_POSTGRES_URL_NON_POOLING;
  const POSTGRES_USER = process.env.POSTGRES_USER || process.env.DEV_POSTGRES_USER;
  const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.DEV_POSTGRES_PASSWORD;
  const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || process.env.DEV_POSTGRES_DATABASE;
  const POSTGRES_HOST = process.env.POSTGRES_HOST || process.env.DEV_POSTGRES_HOST;

  // Supabase (from Vercel > Storage > Supabase)
  const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DEV_NEXT_PUBLIC_SUPABASE_URL;
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.DEV_NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.DEV_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.DEV_SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.DEV_SUPABASE_JWT_SECRET;

  // Challenges:
  const CHALLENGE_TYPE = process.env.CHALLENGE_TYPE as ChallengeType;
  const CHALLENGE_BUFFER_SIZE = process.env.CHALLENGE_BUFFER_SIZE;

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
    // Database (from Vercel > Storage > Supabase)
    POSTGRES_URL: getEnvPostgresUrlValidator("POSTGRES_URL"),
    POSTGRES_PRISMA_URL: getEnvPostgresUrlValidator("POSTGRES_PRISMA_URL"),
    POSTGRES_URL_NON_POOLING: getEnvPostgresUrlValidator("POSTGRES_URL_NON_POOLING"),
    POSTGRES_USER: getEnvStringValidator("POSTGRES_USER"),
    POSTGRES_PASSWORD: getEnvStringValidator("POSTGRES_PASSWORD"),
    POSTGRES_DATABASE: getEnvStringValidator("POSTGRES_DATABASE"),
    POSTGRES_HOST: getEnvStringValidator("POSTGRES_HOST"),

    // Supabase (from Vercel > Storage > Supabase)
    NEXT_PUBLIC_SUPABASE_URL: getEnvHttpsUrlValidator("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvStringValidator("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_URL: getEnvHttpsUrlValidator("SUPABASE_URL"),
    SUPABASE_ANON_KEY: getEnvStringValidator("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: getEnvStringValidator("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_JWT_SECRET: getEnvStringValidator("SUPABASE_JWT_SECRET"),

    // Challenges:
    CHALLENGE_TYPE: getEnvEnumValidator("CHALLENGE_TYPE", ChallengeType),
    CHALLENGE_BUFFER_SIZE: getEnvNumberValidator("CHALLENGE_BUFFER_SIZE"),

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

  try {
    const config = ConfigSchema.parse({
      // Database (from Vercel > Storage > Supabase)
      POSTGRES_URL,
      POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_DATABASE,
      POSTGRES_HOST,

      // Supabase (from Vercel > Storage > Supabase)
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWT_SECRET,

      // Challenges:
      CHALLENGE_TYPE,
      CHALLENGE_BUFFER_SIZE,

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
  } catch (err) {
    const errors = (err as ZodError).errors || [];

    console.error("\n\nConfig / EVN errors:\n");

    errors.forEach((error) => {
      console.error(`- ${ error.message } at (${ error.path }) `);
    });

    console.error("");

    throw new Error("Invalid Config / ENV");
  }
}

export const Config = initConfig();
