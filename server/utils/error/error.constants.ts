export const ErrorMessages = {
  // Wallets:
  WALLET_NOT_FOUND: `Wallet not found.`,
  WALLET_CANNOT_BE_ENABLED: `Wallet cannot be enabled.`,
  WALLET_CANNOT_BE_DISABLED: `Wallet cannot be disabled.`,
  WALLET_NO_PRIVACY_SUPPORT: "Wallet does not support the privacy setting.",
  WALLET_ADDRESS_MISMATCH: "Wallet address mismatch.",
  WALLET_NOT_VALID_FOR_ACCOUNT_RECOVERY: `Wallet cannot be used for account recovery.`,
  WALLET_MISSING_PUBLIC_KEY: `Wallet is missing public key.`,

  // Shares:
  WORK_SHARE_NOT_FOUND: `Work share not found.`,
  WORK_SHARE_INVALIDATED: `Work share invalidated.`,
  INVALID_SHARE: `Invalid share.`,

  // Challenge:
  CHALLENGE_NOT_FOUND: `Challenge not found. It might have been resolved already, or it might have expired.`,
  CHALLENGE_INVALID: `Invalid challenge.`,
  CHALLENGE_EXPIRED_ERROR: `Challenge expired.`,
  CHALLENGE_MISSING_PK: `Missing public key.`,
  CHALLENGE_UNEXPECTED_ERROR: `Unexpected error validating challenge.`,

  // Recovery:
  RECOVERY_ACCOUNTS_NOT_FOUND: `No recoverable accounts found.`,
  RECOVERY_WALLETS_NOT_FOUND: `No recoverable account wallets found.`,
  RECOVERY_MISSING_PUBLIC_KEY: `Missing public key.`,

  // Generic:
  NO_OP: "This request is a no-op.",
} as const;
