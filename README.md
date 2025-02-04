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

## Server Config

- TTL_WORK_SHARE (time between rotations)
- TTL_WORK_SHARE (time before deletion if inactive?)
- TTL_CHALLENGE

- MAX_AUTH_METHODS_PER_USER
- MAX_WALLETS_PER_USER

- MAX_ACTIVATIONS_PER_WALLET
- MAX_WORK_SHARES_PER_WALLET
- MAX_RECOVERY_SHARES_PER_WALLET
- MAX_RECOVERIES_PER_WALLET
- MAX_EXPORTS_PER_WALLET

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
- ✅ Create `WalletUsageStatus` enum.
- ✅ Log activation and recovery attempts.

- Create / update `DeviceAndLocation` rows and update session.
- Implement challenge creation/validation logic.
- Make sure `publicKey` matches `address` and remove `// TODO: Validate length/format`.
- Review `// Make sure the user is the owner of the wallet:` comments. Do we actually need a separate query or just a userId filter?
- Add all missing ENV variables to `config.constants.ts`.
- Review / clean up TODOs in this PR.

**TODO (other PRs):**

- Take into account location and ip filters.
- Rotate user JWT secret when logging out if there are no more sessions.
- Endpoints to create `Application`?
- Validate `Application`.
- Enforce limits on certain tables...
- Account for `activationAuthsRequiredSetting`, `backupAuthsRequiredSetting`, `recoveryAuthsRequiredSetting`, country filter, ip filter...

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




