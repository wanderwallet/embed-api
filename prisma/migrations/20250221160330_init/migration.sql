-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('PASSKEYS', 'EMAIL_N_PASSWORD', 'GOOGLE', 'FACEBOOK', 'X', 'APPLE');

-- CreateEnum
CREATE TYPE "UserDetailsPrivacySetting" AS ENUM ('NAME', 'EMAIL', 'PHONE', 'PICTURE');

-- CreateEnum
CREATE TYPE "NotificationSetting" AS ENUM ('NONE', 'SECURITY', 'ALL');

-- CreateEnum
CREATE TYPE "FilterPrivacySetting" AS ENUM ('INCLUDE_DETAILS', 'HIDE_DETAILS');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('ARWEAVE', 'ETHEREUM');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ENABLED', 'DISABLED', 'READONLY', 'LOST');

-- CreateEnum
CREATE TYPE "WalletPrivacySetting" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "WalletIdentifierType" AS ENUM ('ALIAS', 'ANS', 'PNS');

-- CreateEnum
CREATE TYPE "WalletSourceType" AS ENUM ('IMPORTED', 'GENERATED');

-- CreateEnum
CREATE TYPE "WalletSourceFrom" AS ENUM ('SEEDPHRASE', 'KEYFILE', 'BINARY');

-- CreateEnum
CREATE TYPE "WalletUsageStatus" AS ENUM ('SUCCESSFUL', 'FAILED');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('SEEDPHRASE', 'KEYFILE');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('HASH', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "ChallengePurpose" AS ENUM ('ACTIVATION', 'SHARE_RECOVERY', 'SHARE_ROTATION', 'ACCOUNT_RECOVERY');

-- CreateTable
CREATE TABLE "UserProfiles" (
    "supId" TEXT NOT NULL,
    "supEmail" VARCHAR(255),
    "supPhone" VARCHAR(255),
    "name" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "picture" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recoveredAt" TIMESTAMP(3),
    "userDetailsRecoveryPrivacy" "UserDetailsPrivacySetting"[],
    "notificationsSetting" "NotificationSetting" NOT NULL DEFAULT 'SECURITY',
    "recoveryWalletsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "ipPrivacyFilterSetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',
    "countryPrivacySetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',

    CONSTRAINT "UserProfiles_pkey" PRIMARY KEY ("supId")
);

-- CreateTable
CREATE TABLE "Developers" (
    "id" TEXT NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'free',
    "planStartedAt" VARCHAR(50) NOT NULL DEFAULT 'free',
    "apiKey" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "countryCode" VARCHAR(2),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bills" (
    "id" TEXT NOT NULL,
    "type" "BillType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "monthlySessions" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "userOverrides" JSONB NOT NULL,
    "developerId" TEXT NOT NULL,

    CONSTRAINT "Bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" TEXT NOT NULL,
    "description" VARCHAR(255),
    "domains" VARCHAR(255)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB NOT NULL,
    "developerId" TEXT NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallets" (
    "id" TEXT NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ENABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chain" "Chain" NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "publicKey" VARCHAR(1024),
    "identifierTypeSetting" "WalletIdentifierType" NOT NULL DEFAULT 'ALIAS',
    "aliasSetting" VARCHAR(64),
    "descriptionSetting" VARCHAR(500),
    "tagsSetting" VARCHAR(32)[],
    "doNotAskAgainSetting" BOOLEAN NOT NULL DEFAULT false,
    "walletPrivacySetting" "WalletPrivacySetting" NOT NULL DEFAULT 'PUBLIC',
    "canRecoverAccountSetting" BOOLEAN NOT NULL DEFAULT false,
    "canBeRecovered" BOOLEAN NOT NULL DEFAULT false,
    "activationAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 0,
    "backupAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 0,
    "recoveryAuthsRequiredSetting" INTEGER NOT NULL DEFAULT 0,
    "info" JSONB,
    "source" JSONB,
    "lastActivatedAt" TIMESTAMP(3),
    "lastBackedUpAt" TIMESTAMP(3),
    "lastRecoveredAt" TIMESTAMP(3),
    "lastExportedAt" TIMESTAMP(3),
    "totalActivations" INTEGER NOT NULL DEFAULT 0,
    "totalBackups" INTEGER NOT NULL DEFAULT 0,
    "totalRecoveries" INTEGER NOT NULL DEFAULT 0,
    "totalExports" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletActivations" (
    "id" TEXT NOT NULL,
    "status" "WalletUsageStatus" NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "workKeyShareId" TEXT,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "WalletActivations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletRecoveries" (
    "id" TEXT NOT NULL,
    "status" "WalletUsageStatus" NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "recoveryKeyShareId" TEXT,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "WalletRecoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletExports" (
    "id" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "WalletExports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkKeyShares" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharesRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationWarnings" INTEGER NOT NULL DEFAULT 0,
    "authShare" VARCHAR(4096) NOT NULL,
    "deviceShareHash" VARCHAR(20) NOT NULL,
    "deviceSharePublicKey" VARCHAR(1024) NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "WorkKeyShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryKeyShares" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveryAuthShare" TEXT NOT NULL,
    "recoveryBackupShareHash" VARCHAR(20) NOT NULL,
    "recoveryBackupSharePublicKey" VARCHAR(1024) NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "RecoveryKeyShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenges" (
    "id" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "Challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonChallenges" (
    "id" TEXT NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chain" "Chain" NOT NULL,
    "address" VARCHAR(255) NOT NULL,

    CONSTRAINT "AnonChallenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicesAndLocations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" TEXT,
    "applicationId" TEXT,

    CONSTRAINT "DevicesAndLocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "providerSessionId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "userAgent" VARCHAR(500) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempts" (
    "id" TEXT NOT NULL,
    "rejectionReason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supIdentityId" TEXT,
    "userId" TEXT NOT NULL,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "LoginAttempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ApplicationToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApplicationToSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Developers_apiKey_key" ON "Developers"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Developers_userId_key" ON "Developers"("userId");

-- CreateIndex
CREATE INDEX "Developers_apiKey_idx" ON "Developers"("apiKey");

-- CreateIndex
CREATE INDEX "Bills_developerId_idx" ON "Bills"("developerId");

-- CreateIndex
CREATE INDEX "Applications_developerId_idx" ON "Applications"("developerId");

-- CreateIndex
CREATE INDEX "Wallets_canRecoverAccountSetting_chain_address_idx" ON "Wallets"("canRecoverAccountSetting", "chain", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_userId_chain_address_key" ON "Wallets"("userId", "chain", "address");

-- CreateIndex
CREATE INDEX "WalletActivations_userId_idx" ON "WalletActivations"("userId");

-- CreateIndex
CREATE INDEX "WalletActivations_activatedAt_idx" ON "WalletActivations"("activatedAt");

-- CreateIndex
CREATE INDEX "WalletRecoveries_userId_idx" ON "WalletRecoveries"("userId");

-- CreateIndex
CREATE INDEX "WalletRecoveries_recoveredAt_idx" ON "WalletRecoveries"("recoveredAt");

-- CreateIndex
CREATE INDEX "WalletExports_userId_idx" ON "WalletExports"("userId");

-- CreateIndex
CREATE INDEX "WalletExports_exportedAt_idx" ON "WalletExports"("exportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkKeyShares_userId_sessionId_walletId_key" ON "WorkKeyShares"("userId", "sessionId", "walletId");

-- CreateIndex
CREATE INDEX "RecoveryKeyShares_userId_createdAt_idx" ON "RecoveryKeyShares"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryKeyShares_userId_recoveryBackupShareHash_key" ON "RecoveryKeyShares"("userId", "recoveryBackupShareHash");

-- CreateIndex
CREATE UNIQUE INDEX "Challenges_userId_purpose_key" ON "Challenges"("userId", "purpose");

-- CreateIndex
CREATE INDEX "DevicesAndLocations_createdAt_idx" ON "DevicesAndLocations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DevicesAndLocations_userId_deviceNonce_ip_userAgent_key" ON "DevicesAndLocations"("userId", "deviceNonce", "ip", "userAgent");

-- CreateIndex
CREATE INDEX "Sessions_providerSessionId_idx" ON "Sessions"("providerSessionId");

-- CreateIndex
CREATE INDEX "Sessions_updatedAt_idx" ON "Sessions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_deviceNonce_key" ON "Sessions"("userId", "deviceNonce");

-- CreateIndex
CREATE INDEX "LoginAttempts_userId_idx" ON "LoginAttempts"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempts_createdAt_idx" ON "LoginAttempts"("createdAt");

-- CreateIndex
CREATE INDEX "_ApplicationToSession_B_index" ON "_ApplicationToSession"("B");

-- AddForeignKey
ALTER TABLE "Developers" ADD CONSTRAINT "Developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "Bills_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_workKeyShareId_fkey" FOREIGN KEY ("workKeyShareId") REFERENCES "WorkKeyShares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_recoveryKeyShareId_fkey" FOREIGN KEY ("recoveryKeyShareId") REFERENCES "RecoveryKeyShares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempts" ADD CONSTRAINT "LoginAttempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempts" ADD CONSTRAINT "LoginAttempts_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
