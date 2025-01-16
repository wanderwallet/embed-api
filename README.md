Embed API

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Server Config

- API_KEYS

- MAX_AUTH_METHODS_PER_USER
- MAX_WALLETS_PER_USER

- MAX_ACTIVATIONS_PER_WALLET
- MAX_WORK_SHARES_PER_WALLET
- MAX_RECOVERY_SHARES_PER_WALLET
- MAX_RECOVERIES_PER_WALLET
- MAX_EXPORTS_PER_WALLET

## SDK API:

**Authentication:**
- authenticate => GET /auth
- refreshSession => GET /auth/<userId>
- fakeAuthenticate => GET /auth/fake
- fakeRefreshSession => GET /auth/fake/<[alice|bob]>

**Wallets:**
- fetchWallets => GET /wallets
- createWallet => POST /wallets
- updateWallet => PUT /wallets/<walletId>
- deleteWallet => DELETE /wallets/<walletId>

**Work Shares:**
- generateAuthShareChallenge => PUT /wallets/<walletId>/challenges/activation
- activateWallet => POST /wallets/<walletId>/activate
- rotateAuthShare => GET /wallets/<walletId>/rotate

**Backup:**
- registerRecoveryShare => POST /wallets/<walletId>/backups/recovery-shares
- registerWalletExport => POST /wallets/<walletId>/backups/wallet-exports

**Share Recovery:**
- generateShareRecoveryChallenge => PUT /wallets/<walletId>/challenges/share-recovery/
- recoverWallet => POST /wallets/<walletId>/recover

**Account Recovery:**
- generateWalletRecoveryChallenge => PUT /<walletId>/challenges/account-recovery/
- fetchRecoverableAccounts => GET /wallets/<walletId>/accounts/
- generateAccountRecoveryChallenge => PUT /<walletId>/challenges/account-recovery-confirmation/
- recoverAccount => PUT /accounts/<accountId>/recover