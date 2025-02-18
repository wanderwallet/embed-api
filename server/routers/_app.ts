import { publicProcedure, protectedProcedure, router } from "../trpc"
import { signJWT } from "../auth"
import { fetchRecoverableAccounts } from "@/server/routers/account-recovery/fetchRecoverableAccounts"
import { generateAccountRecoveryChallenge } from "@/server/routers/account-recovery/generateAccountRecoveryChallenge"
import { generateFetchRecoverableAccountsChallenge } from "@/server/routers/account-recovery/generateFetchRecoverableWalletsChallenge"
import { recoverAccount } from "@/server/routers/account-recovery/recoverAccount"
import { registerRecoveryShare } from "@/server/routers/backup/registerRecoveryShare"
import { generateWalletRecoveryChallenge } from "@/server/routers/share-recovery/generateWalletRecoveryChallenge"
import { recoverWallet } from "@/server/routers/share-recovery/recoverWallet"
import { createPrivateWallet } from "@/server/routers/wallets/createPrivateWallet"
import { createPublicWallet } from "@/server/routers/wallets/createPublicWallet"
import { createReadOnlyWallet } from "@/server/routers/wallets/createReadOnlyWallet"
import { deleteWallet } from "@/server/routers/wallets/deleteWallet"
import { doNotAskAgainForBackup } from "@/server/routers/wallets/doNotAskAgainForBackup"
import { fetchWallets } from "@/server/routers/wallets/fetchWallets"
import { makeWalletPrivate } from "@/server/routers/wallets/makeWalletPrivate"
import { makeWalletPublic } from "@/server/routers/wallets/makeWalletPublic"
import { updateWalletInfo } from "@/server/routers/wallets/updateWalletInfo"
import { updateWalletRecovery } from "@/server/routers/wallets/updateWalletRecovery"
import { updateWalletStatus } from "@/server/routers/wallets/updateWalletStatus"
import { activateWallet } from "@/server/routers/work-shares/activateWallet"
import { generateWalletActivationChallenge } from "@/server/routers/work-shares/generateWalletActivationChallenge"
import { rotateAuthShare } from "@/server/routers/work-shares/rotateAuthShare"
import { registerWalletExport } from "@/server/routers/backup/registerWalletExport"
// import { supabase } from '@/utils/supabaseClient';

export const appRouter = router({

  authenticate: publicProcedure.mutation(async () => {
    const token = await signJWT({ userId: "123" }) // TODO: replace with actual user data
    return { token }
  }),

  protectedRoute: protectedProcedure.query(() => {
    return { message: "This is a protected route" } // TODO: remove, just an example for protected route
  }),

  // Wallets:
  fetchWallets,
  doNotAskAgainForBackup,

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

  // Account Recovery:
  generateFetchRecoverableAccountsChallenge,
  fetchRecoverableAccounts,
  generateAccountRecoveryChallenge,
  recoverAccount,
})

export type AppRouter = typeof appRouter

