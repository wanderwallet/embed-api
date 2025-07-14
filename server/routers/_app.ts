import { router } from "../trpc";
import { fetchRecoverableAccountWallets } from "./account-recovery/fetchRecoverableAccountWallets";
import { fetchRecoverableAccounts } from "@/server/routers/account-recovery/fetchRecoverableAccounts";
import { generateAccountRecoveryChallenge } from "@/server/routers/account-recovery/generateAccountRecoveryChallenge";
import { generateFetchRecoverableAccountsChallenge } from "@/server/routers/account-recovery/generateFetchRecoverableWalletsChallenge";
import { recoverAccount } from "@/server/routers/account-recovery/recoverAccount";
import { registerRecoveryShare } from "@/server/routers/backup/registerRecoveryShare";
import { generateWalletRecoveryChallenge } from "@/server/routers/share-recovery/generateWalletRecoveryChallenge";
import { recoverWallet } from "@/server/routers/share-recovery/recoverWallet";
import { registerAuthShare } from "@/server/routers/share-recovery/registerAuthShare";
import { createPrivateWallet } from "@/server/routers/wallets/createPrivateWallet";
import { createPublicWallet } from "@/server/routers/wallets/createPublicWallet";
import { createReadOnlyWallet } from "@/server/routers/wallets/createReadOnlyWallet";
import { deleteWallet } from "@/server/routers/wallets/deleteWallet";
import { fetchWallets } from "@/server/routers/wallets/fetchWallets";
import { makeWalletPrivate } from "@/server/routers/wallets/makeWalletPrivate";
import { makeWalletPublic } from "@/server/routers/wallets/makeWalletPublic";
import { updateWalletInfo } from "@/server/routers/wallets/updateWalletInfo";
import { updateWalletRecovery } from "@/server/routers/wallets/updateWalletRecovery";
import { updateWalletStatus } from "@/server/routers/wallets/updateWalletStatus";
import { activateWallet } from "@/server/routers/work-shares/activateWallet";
import { generateWalletActivationChallenge } from "@/server/routers/work-shares/generateWalletActivationChallenge";
import { rotateAuthShare } from "@/server/routers/work-shares/rotateAuthShare";
import { registerWalletExport } from "@/server/routers/backup/registerWalletExport";
import { authenticateRouter } from "@/server/routers/authenticate";
import { validationRouter } from "./validation";
// import { supabase } from '@/utils/supabaseClient';

export const appRouter = router({
  ...authenticateRouter,
  ...validationRouter,

  // Wallets:
  fetchWallets,

  // Wallets - Create wallet:
  createPublicWallet,
  createPrivateWallet,
  createReadOnlyWallet,

  // Wallets - Update wallet:
  makeWalletPrivate,
  makeWalletPublic,
  updateWalletInfo,
  updateWalletRecovery,
  updateWalletStatus,
  deleteWallet,

  // Work Shares:
  generateWalletActivationChallenge,
  activateWallet,
  rotateAuthShare,

  // Backup:
  registerRecoveryShare,
  registerWalletExport,

  // Share Recovery:
  generateWalletRecoveryChallenge,
  recoverWallet,
  registerAuthShare,

  // Account Recovery:
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  fetchRecoverableAccountWallets,
  generateAccountRecoveryChallenge,
  recoverAccount,
});

export type AppRouter = typeof appRouter;
