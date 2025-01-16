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
    "providerId" TEXT NOT NULL,
    "providerType" "AuthProviderType" NOT NULL,
    "providerLabel" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "notificationsSetting" "NotificationSetting" NOT NULL DEFAULT 'SECURITY',
    "recoveryWalletsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "ipFilterSetting" TEXT,
    "ipPrivacyFilterSetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',
    "countryFilterSetting" TEXT,
    "countryPrivacySetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Developers" (
    "id" SERIAL NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "planPaidAt" TEXT NOT NULL DEFAULT 'free',
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" TEXT NOT NULL,
    "domains" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB NOT NULL,
    "auth0ClientId" TEXT NOT NULL,
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
    "address" TEXT NOT NULL,
    "publicKey" TEXT,
    "identifierTypeSetting" "WalletIdentifierType" NOT NULL DEFAULT 'ALIAS',
    "descriptionSetting" TEXT,
    "tagsSetting" TEXT[],
    "doNotAskAgainSetting" BOOLEAN NOT NULL DEFAULT true,
    "walletPrivacySetting" "WalletPrivacySetting" NOT NULL DEFAULT 'PUBLIC',
    "canRecoverAccountSetting" BOOLEAN NOT NULL DEFAULT true,
    "canBeRecovered" BOOLEAN NOT NULL DEFAULT false,
    "activationAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "backupAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "recoveryAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "info" JSONB NOT NULL,
    "source" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletActivations" (
    "id" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "workKeyShareId" TEXT NOT NULL,

    CONSTRAINT "WalletActivations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletRecoveries" (
    "id" TEXT NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "recoveryKeyShareId" TEXT NOT NULL,

    CONSTRAINT "WalletRecoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletExports" (
    "id" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "WalletExports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkKeyShare" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharesRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationWarnings" INTEGER NOT NULL DEFAULT 0,
    "deviceNonce" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "authShare" TEXT NOT NULL,
    "deviceShareHash" TEXT NOT NULL,
    "deviceSharePublicKey" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WorkKeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryKeyShare" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "recoveryAuthShare" TEXT NOT NULL,
    "recoveryBackupShareHash" TEXT NOT NULL,
    "recoveryBackupSharePublicKey" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RecoveryKeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenges" (
    "id" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "value" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "walletId" TEXT,

    CONSTRAINT "Challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicesAndLocations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "DevicesAndLocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "providerSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "domains" TEXT[],
    "userId" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthMethods_userId_providerId_key" ON "AuthMethods"("userId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Developers_apiKey_key" ON "Developers"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Developers_userId_key" ON "Developers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_userId_address_chain_key" ON "Wallets"("userId", "address", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "WorkKeyShare_userId_deviceNonce_walletId_key" ON "WorkKeyShare"("userId", "deviceNonce", "walletId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenges_type_userId_key" ON "Challenges"("type", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DevicesAndLocations_userId_deviceNonce_ip_userAgent_key" ON "DevicesAndLocations"("userId", "deviceNonce", "ip", "userAgent");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_deviceNonce_key" ON "Sessions"("userId", "deviceNonce");

-- AddForeignKey
ALTER TABLE "AuthMethods" ADD CONSTRAINT "AuthMethods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developers" ADD CONSTRAINT "Developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Developers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_workKeyShareId_fkey" FOREIGN KEY ("workKeyShareId") REFERENCES "WorkKeyShare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_recoveryKeyShareId_fkey" FOREIGN KEY ("recoveryKeyShareId") REFERENCES "RecoveryKeyShare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShare" ADD CONSTRAINT "WorkKeyShare_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShare" ADD CONSTRAINT "WorkKeyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShare" ADD CONSTRAINT "RecoveryKeyShare_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShare" ADD CONSTRAINT "RecoveryKeyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
