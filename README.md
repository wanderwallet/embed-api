Embed API

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

The backend uses a PostgreSQL DB hosted on Supabase behind Supavisor.

For analytics events (e.g. to get usage data and bill developers), we'll be using DynamoDB (TBD). In order to bill developers by MAS (Monthly Active Session),
we'll have to keep track of all unique user IDs that accessed their account and/or activated a wallet on their application.

We can probably remove/reset those records every month and only keep aggregated data around in the tables related to billing (to be added).

## Server Config & Cronjobs

**Challenges:**

- ✅ `CHALLENGE_TYPE`
- ✅ `CHALLENGE_VERSION`
- ✅ `CHALLENGE_TTL_MS`: Max. elapsed time between `Challenge.createdAt` and its resolution. Because both operations
  are called sequentially, this TTL should be relatively short (e.g. 5-30 seconds).

**Shares:**

- ✅ `SHARE_ACTIVE_TTL_MS`: Time before a share rotation is requested.
- ✅ `SHARE_INACTIVE_TTL_MS`: Time before an inactive share is deleted (if it hasn't been rotated in a long time).
- ✅ `SHARE_MAX_ROTATION_IGNORES`

- ❌ `SHARE_MAX_FAILED_ACTIVATION_ATTEMPTS` - What happens then? De-auth user?
- ❌ `SHARE_MAX_FAILED_RECOVERY_ATTEMPTS` - What happens then? De-auth user?
- Maybe replace the 2 above with a single `MAX_SUSPICIOUS_ACTIVITY` (DB `User` needs `maxSuspiciousActionCount` and
  `lastSuspiciousActionDate`).

**Auth Method, Wallet & Share Limits:**

- ❌ `MAX_AUTH_METHODS_PER_USER`
- ❌ `MAX_WALLETS_PER_USER`
- ❌ `MAX_WORK_SHARES_PER_WALLET` (or per user) - What happens then?
- ❌ `MAX_RECOVERY_SHARES_PER_WALLET` (or per user) - What happens then?

**Activity Log Limits:**

- ❌ `MAX_ACTIVATIONS_PER_WALLET`
- ❌ `MAX_RECOVERIES_PER_WALLET`
- ❌ `MAX_EXPORTS_PER_WALLET`

**Cronjobs:**

- ❌ All _Activity Log Limits_ above could instead be capped by date (e.g. older than a month).
- ❌ Orphan `DeviceAndLocation` (not referenced by any other table).
- ❌ Inactive `WorkKeyShare` (deleted passively using `SHARE_INACTIVE_TTL_MS`).

## SDK API:

**Authentication:**
- authenticate
- refreshSession
- fakeAuthenticate
- fakeRefreshSession

**Wallets:**
- ✅ fetchWallets
- ✅ doNotAskAgainForBackup
- ❌ createWallet, instead:
  - ✅ createPublicWallet
  - ✅ createPrivateWallet
  - ✅ createReadOnlyWallet
- ❌ updateWallet, instead:
  - ✅ makeWalletPrivate
  - ✅ makeWalletPublic
  - ✅ updateWalletInfo
  - ✅ updateWalletRecovery
  - ✅ updateWalletStatus
- ✅ deleteWallet

**Work Shares:**
- ✅ generateWalletActivationChallenge
- ✅ activateWallet
- ✅ rotateAuthShare

**Backup:**
- ✅ registerRecoveryShare
- ✅ registerWalletExport

**Share Recovery:**
- ✅ generateWalletRecoveryChallenge
- ✅ recoverWallet

**Account Recovery:**
- ✅ generateFetchRecoverableWalletsChallenge
- ✅ fetchRecoverableAccounts
- ✅ generateAccountRecoveryChallenge
- ✅ recoverAccount

**TODO:**
- ✅ Delete challenges even if validation fails.
- ✅ Update `canBeRecovered` in `registerRecoveryShare` and `registerWalletExport`.
- ✅ Make sure `activateWallet` only allows it for enabled wallets?
- ✅ Add `aliasSetting` to `Wallet`.
- ✅ Add missing `authShare` to `createWallet()`.
- ✅ Remove `SECRET` in `WalletPrivacySetting`.
- ✅ Split `updateWallet` into individual procedures.
- ✅ Split `createWallet` into individual procedures.
- ✅ Validate `publicKey` matches `address`.
- ✅ Create `WalletUsageStatus` enum.
- ✅ Log activation and recovery attempts.
- ✅ Create / connect `DeviceAndLocation`.
- ✅ Implement challenge creation & validation logic.
- ✅ Add all missing ENV variables to `config.constants.ts`.
- ✅ Update backup generation and validation to include server signatures.
- ✅ Rename unique indexes and adjust them.

- Properly validate share, share hash and share public key format (remove `// TODO: Validate length/format`).
- Log suspicious activity and de-auth user in that case (failed activations, recoveries, challenges...).
- Review / clean up TODOs in this PR.

**Needed for Developer Portal:**

- fetchDeveloper
- upsertDeveloper
- fetchApplications
- fetchApplication
- createApplication
- updateApplication

**Needed for Dashboard:**

- fetchAuthMethods
- addAuthMethod
- deleteAuthMethod

- fetchSessions
- deleteSession (also deletes `WorkKeyShare`s)

- fetchRecoveryKeyShares
- deleteRecoveryKeyShare (just mark it as deleted?)

- fetchWalletExports
- deleteWalletExport? (just mark it as deleted?)

- fetchWalletRecoveries
- reportWalletRecovery?
- reportWalletRecovery?

- fetchWalletActivations
- reportWalletActivation?
- deleteWalletActivation?




