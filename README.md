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
- ✅ Update `canBeRecovered` in `registerRecoveryShare` and `registerWalletExport`.
- ✅ Make sure `activateWallet` only allows it for enabled wallets?
- ✅ Add `aliasSetting` to `Wallet`.
- ✅ Add missing `authShare` to `createWallet()`.

- Account for `status` and `walletPrivacySetting` in `fetchWallets`, `createWallet`, and `updateWallet`. Easier to save it taking that value into account than
  having to filter everywhere. Make sure `SECRET` doesn't generate inaccessible wallets.

- What happens in `updateWallet` if the status is changed to `ENABLED`?

- Review `// Make sure the user is the owner of the wallet:` comments. Do we actually need a separate query or just a userId filter?
- Implement challenge creation/validation logic.
- Make sure `publicKey` matches `address`.
- Log activation attempts of LOST wallets.
- Add proper validation for addresses and public key fields.
- Account for `walletPrivacySetting`, `activationAuthsRequiredSetting`, `backupAuthsRequiredSetting`, `recoveryAuthsRequiredSetting`, country filter, ip filter...
- Create / update `DeviceAndLocation` rows.
- Enforce limits on certain tables...
- Create enum for status fields currently typed as `String`.
- Validate `Application`
- Endpoints to create `Application`?
- Rotate user JWT secret when logging out if there are no more sessions.
- Add all missing ENV variables to `config.constants.ts`.

**Needed for Dashboard:**

- fetchAuthMethods
- addAuthMethod
- deleteAuthMethod

- fetchSessions
- deleteSession (also deletes `WorkKeyShare`s)

- fetchRecoveryKeyShares
- deleteRecoveryKeyShare (just mark it as deleted?)

- fetchExports
- deleteExport (just mark it as deleted?)
