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

- TTL_WORK_SHARE
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
- ✅ createWallet
- ✅ updateWallet
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
- Implement challenge creation/validation logic.

- Account for `walletPrivacySetting`, `activationAuthsRequiredSetting`, `backupAuthsRequiredSetting`, `recoveryAuthsRequiredSetting`, country filter, ip filter...
- Create / update `DeviceAndLocation` rows.
- Enforce limits on certain tables...
- Create enum for status fields currently typed as `String`.
- Validate `Application`
- Endpoints to create `Application`?
- Review `// Make sure the user is the owner of the wallet:` comments. Do we actually need a separate query or just a userId filter?
- Rotate user JWT secret when logging out if there are no more sessions.
