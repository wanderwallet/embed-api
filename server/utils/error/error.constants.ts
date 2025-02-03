
export const ErrorMessages = {
  // Wallets:
  WALLET_NOT_FOUND: `Wallet not found.`,
  WALLET_CANNOT_BE_ENABLED: `Wallet cannot be enabled.`,
  WALLET_CANNOT_BE_DISABLED: `Wallet cannot be disabled.`,
  WALLET_NO_PRIVACY_SUPPORT: "Wallet does not support the privacy setting.",
  WALLET_ADDRESS_MISMATCH: "Wallet address mismatch.",
  WALLET_NOT_VALID_FOR_ACCOUNT_RECOVERY: `Wallet cannot be used for account recovery.`,

  // Shares:
  WORK_SHARE_NOT_FOUND: `Work share not found.`,

  // Challenge:
  CHALLENGE_NOT_FOUND: `Challenge not found. It might have been resolved already, or it might have expired.`,
  INVALID_CHALLENGE: `Invalid challenge.`,

  // Recovery:
  RECOVERABLE_ACCOUNTS_NOT_FOUND: `No recoverable accounts found.`,

  // Generic:
  NO_OP: "This request is a no-op."
} as const;

