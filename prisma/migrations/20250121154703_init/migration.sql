-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('PASSKEYS', 'EMAIL_N_PASSWORD', 'GOOGLE', 'FACEBOOK', 'X', 'APPLE');

-- CreateEnum
CREATE TYPE "NotificationSetting" AS ENUM ('NONE', 'SECURITY', 'ALL');

-- CreateEnum
CREATE TYPE "FilterPrivacySetting" AS ENUM ('INCLUDE_DETAILS', 'HIDE_DETAILS');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('ARWEAVE', 'ETHEREUM');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ENABLED', 'DISABLED', 'WATCH_ONLY', 'LOST');

-- CreateEnum
CREATE TYPE "WalletPrivacySetting" AS ENUM ('SECRET', 'PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "WalletIdentifierType" AS ENUM ('ALIAS', 'ANS', 'PNS');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('SEEDPHRASE', 'KEYFILE');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('HASH', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "ChallengePurpose" AS ENUM ('ACTIVATION', 'SHARE_RECOVERY', 'SHARE_ROTATION', 'ACCOUNT_RECOVERY', 'ACCOUNT_RECOVERY_CONFIRMATION');

-- CreateTable
CREATE TABLE "AuthMethods" (
    "id" TEXT NOT NULL,
    "providerId" VARCHAR(255) NOT NULL,
    "providerType" "AuthProviderType" NOT NULL,
    "providerLabel" VARCHAR(255) NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100),
    "email" VARCHAR(255),
    "notificationsSetting" "NotificationSetting" NOT NULL DEFAULT 'SECURITY',
    "recoveryWalletsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "ipFilterSetting" VARCHAR(255),
    "ipPrivacyFilterSetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',
    "countryFilterSetting" VARCHAR(2),
    "countryPrivacySetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Developers" (
    "id" SERIAL NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'free',
    "planPaidAt" VARCHAR(50) NOT NULL DEFAULT 'free',
    "apiKey" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" TEXT NOT NULL,
    "domains" VARCHAR(255)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB NOT NULL,
    "auth0ClientId" VARCHAR(255) NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallets" (
    "id" TEXT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ENABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chain" "Chain" NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "publicKey" VARCHAR(255),
    "identifierTypeSetting" "WalletIdentifierType" NOT NULL DEFAULT 'ALIAS',
    "descriptionSetting" VARCHAR(500),
    "tagsSetting" VARCHAR(50)[],
    "doNotAskAgainSetting" BOOLEAN NOT NULL DEFAULT true,
    "walletPrivacySetting" "WalletPrivacySetting" NOT NULL DEFAULT 'PUBLIC',
    "canRecoverAccountSetting" BOOLEAN NOT NULL DEFAULT true,
    "canBeRecovered" BOOLEAN NOT NULL DEFAULT false,
    "activationAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "backupAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "recoveryAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "info" JSONB NOT NULL,
    "source" JSONB NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletActivations" (
    "id" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255) NOT NULL,
    "walletId" TEXT NOT NULL,
    "workKeyShareId" TEXT NOT NULL,

    CONSTRAINT "WalletActivations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletRecoveries" (
    "id" TEXT NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255) NOT NULL,
    "walletId" TEXT NOT NULL,
    "recoveryKeyShareId" TEXT NOT NULL,

    CONSTRAINT "WalletRecoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletExports" (
    "id" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255) NOT NULL,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "WalletExports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkKeyShare" (
    "id" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharesRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationWarnings" INTEGER NOT NULL DEFAULT 0,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "authShare" VARCHAR(255) NOT NULL,
    "deviceShareHash" VARCHAR(255) NOT NULL,
    "deviceSharePublicKey" VARCHAR(255) NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WorkKeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryKeyShare" (
    "id" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255) NOT NULL,
    "recoveryAuthShare" TEXT NOT NULL,
    "recoveryBackupShareHash" VARCHAR(255) NOT NULL,
    "recoveryBackupSharePublicKey" VARCHAR(255) NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RecoveryKeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenges" (
    "id" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "walletId" TEXT,

    CONSTRAINT "Challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicesAndLocations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "applicationid" TEXT,
    "userId" TEXT,

    CONSTRAINT "DevicesAndLocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "providerSessionId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "userAgent" VARCHAR(500) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ApplicationToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApplicationToSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "AuthMethods_providerId_idx" ON "AuthMethods"("providerId");

-- CreateIndex
CREATE INDEX "AuthMethods_lastUsedAt_idx" ON "AuthMethods"("lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethods_userId_providerId_key" ON "AuthMethods"("userId", "providerId");

-- CreateIndex
CREATE INDEX "Users_email_idx" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Developers_apiKey_key" ON "Developers"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Developers_userId_key" ON "Developers"("userId");

-- CreateIndex
CREATE INDEX "Developers_apiKey_idx" ON "Developers"("apiKey");

-- CreateIndex
CREATE INDEX "Applications_auth0ClientId_idx" ON "Applications"("auth0ClientId");

-- CreateIndex
CREATE INDEX "Applications_ownerId_idx" ON "Applications"("ownerId");

-- CreateIndex
CREATE INDEX "Wallets_address_idx" ON "Wallets"("address");

-- CreateIndex
CREATE INDEX "Wallets_chain_idx" ON "Wallets"("chain");

-- CreateIndex
CREATE INDEX "Wallets_status_idx" ON "Wallets"("status");

-- CreateIndex
CREATE INDEX "Wallets_createdAt_idx" ON "Wallets"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_userId_address_chain_key" ON "Wallets"("userId", "address", "chain");

-- CreateIndex
CREATE INDEX "WalletActivations_activatedAt_idx" ON "WalletActivations"("activatedAt");

-- CreateIndex
CREATE INDEX "WalletRecoveries_recoveredAt_idx" ON "WalletRecoveries"("recoveredAt");

-- CreateIndex
CREATE INDEX "WalletExports_exportedAt_idx" ON "WalletExports"("exportedAt");

-- CreateIndex
CREATE INDEX "WorkKeyShare_status_idx" ON "WorkKeyShare"("status");

-- CreateIndex
CREATE INDEX "WorkKeyShare_sharesRotatedAt_idx" ON "WorkKeyShare"("sharesRotatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkKeyShare_userId_deviceNonce_walletId_key" ON "WorkKeyShare"("userId", "deviceNonce", "walletId");

-- CreateIndex
CREATE INDEX "RecoveryKeyShare_status_idx" ON "RecoveryKeyShare"("status");

-- CreateIndex
CREATE INDEX "RecoveryKeyShare_createdAt_idx" ON "RecoveryKeyShare"("createdAt");

-- CreateIndex
CREATE INDEX "Challenges_issuedAt_idx" ON "Challenges"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Challenges_type_userId_key" ON "Challenges"("type", "userId");

-- CreateIndex
CREATE INDEX "DevicesAndLocations_deviceNonce_idx" ON "DevicesAndLocations"("deviceNonce");

-- CreateIndex
CREATE INDEX "DevicesAndLocations_ip_idx" ON "DevicesAndLocations"("ip");

-- CreateIndex
CREATE INDEX "DevicesAndLocations_createdAt_idx" ON "DevicesAndLocations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DevicesAndLocations_userId_deviceNonce_ip_userAgent_key" ON "DevicesAndLocations"("userId", "deviceNonce", "ip", "userAgent");

-- CreateIndex
CREATE INDEX "Sessions_providerSessionId_idx" ON "Sessions"("providerSessionId");

-- CreateIndex
CREATE INDEX "Sessions_deviceNonce_idx" ON "Sessions"("deviceNonce");

-- CreateIndex
CREATE INDEX "Sessions_ip_idx" ON "Sessions"("ip");

-- CreateIndex
CREATE INDEX "Sessions_updatedAt_idx" ON "Sessions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_deviceNonce_key" ON "Sessions"("userId", "deviceNonce");

-- CreateIndex
CREATE INDEX "_ApplicationToSession_B_index" ON "_ApplicationToSession"("B");

-- AddForeignKey
ALTER TABLE "AuthMethods" ADD CONSTRAINT "AuthMethods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developers" ADD CONSTRAINT "Developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_workKeyShareId_fkey" FOREIGN KEY ("workKeyShareId") REFERENCES "WorkKeyShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_recoveryKeyShareId_fkey" FOREIGN KEY ("recoveryKeyShareId") REFERENCES "RecoveryKeyShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShare" ADD CONSTRAINT "WorkKeyShare_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShare" ADD CONSTRAINT "WorkKeyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShare" ADD CONSTRAINT "RecoveryKeyShare_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShare" ADD CONSTRAINT "RecoveryKeyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_applicationid_fkey" FOREIGN KEY ("applicationid") REFERENCES "Applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
