
// Types:


import { WalletInfo, WalletSource } from "@/server/utils/wallet/wallet.types";

import type {
  Wallet,
} from "@prisma/client";

export interface DbWallet extends Omit<Wallet, "info" | "source"> {
  info: null | WalletInfo;
  source: null | WalletSource;
}

export type { WalletInfo, WalletSource } from "@/server/utils/wallet/wallet.types";

export type {
  UserProfile as DbUserProfile,
  Session as DbSession,
  Challenge as DbChallenge,
} from "@prisma/client";

import type { RecoverableAccount } from "@/server/routers/account-recovery/fetchRecoverableAccounts";

export type { RecoverableAccount };

// Enums:

export {
  WalletStatus,
  WalletPrivacySetting,
  Chain,
  AuthProviderType,
  ExportType,
  WalletSourceType,
  WalletSourceFrom,
} from "@prisma/client";

export type {
  User as SupabaseUser,
} from "@supabase/supabase-js";

export { createTRPCClient } from "@/client/utils/trpc/trpc-client.utils";

export { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";
