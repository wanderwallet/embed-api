-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- CreateTable
CREATE TABLE "UserProfiles" (
    "supId" UUID NOT NULL DEFAULT gen_random_uuid(),
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
CREATE TABLE "Bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "BillType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "vat" DOUBLE PRECISION NOT NULL,
    "monthlySessions" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "userOverrides" JSONB NOT NULL,
    "organizationId" UUID NOT NULL,

    CONSTRAINT "Bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "domains" VARCHAR(255)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settings" JSONB NOT NULL,
    "teamId" UUID NOT NULL,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "userId" UUID NOT NULL,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletActivations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "WalletUsageStatus" NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "workKeyShareId" UUID,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "WalletActivations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletRecoveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "WalletUsageStatus" NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "recoveryKeyShareId" UUID,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "WalletRecoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletExports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ExportType" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "WalletExports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkKeyShares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharesRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotationWarnings" INTEGER NOT NULL DEFAULT 0,
    "authShare" VARCHAR(4096) NOT NULL,
    "deviceShareHash" VARCHAR(44) NOT NULL,
    "deviceSharePublicKey" VARCHAR(1024) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,

    CONSTRAINT "WorkKeyShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryKeyShares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveryAuthShare" TEXT NOT NULL,
    "recoveryBackupShareHash" VARCHAR(44) NOT NULL,
    "recoveryBackupSharePublicKey" VARCHAR(1024) NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "RecoveryKeyShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ChallengeType" NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,

    CONSTRAINT "Challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonChallenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chain" "Chain" NOT NULL,
    "address" VARCHAR(255) NOT NULL,

    CONSTRAINT "AnonChallenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicesAndLocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceNonce" VARCHAR(255) NOT NULL,
    "ip" INET NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" UUID,
    "applicationId" UUID,

    CONSTRAINT "DevicesAndLocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deviceNonce" VARCHAR(255) NOT NULL DEFAULT '',
    "ip" INET NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL DEFAULT '',
    "userAgent" VARCHAR(500) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rejectionReason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supIdentityId" TEXT,
    "userId" UUID NOT NULL,
    "deviceAndLocationId" UUID NOT NULL,

    CONSTRAINT "LoginAttempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billingName" TEXT,
    "taxId" TEXT,
    "billingAddress" TEXT,
    "billingCountryCode" VARCHAR(2),
    "ownerId" UUID NOT NULL,

    CONSTRAINT "Organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "planStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,

    CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "TeamMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "key" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "applicationId" UUID NOT NULL,

    CONSTRAINT "ApiKeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ApplicationToSession" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ApplicationToSession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Bills_organizationId_idx" ON "Bills"("organizationId");

-- CreateIndex
CREATE INDEX "Applications_teamId_idx" ON "Applications"("teamId");

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
CREATE INDEX "Sessions_updatedAt_idx" ON "Sessions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_deviceNonce_key" ON "Sessions"("userId", "deviceNonce");

-- CreateIndex
CREATE INDEX "LoginAttempts_userId_idx" ON "LoginAttempts"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempts_createdAt_idx" ON "LoginAttempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organizations_slug_key" ON "Organizations"("slug");

-- CreateIndex
CREATE INDEX "Teams_organizationId_idx" ON "Teams"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Teams_organizationId_slug_key" ON "Teams"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "TeamMembers_userId_idx" ON "TeamMembers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembers_teamId_userId_key" ON "TeamMembers"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_key_key" ON "ApiKeys"("key");

-- CreateIndex
CREATE INDEX "ApiKeys_key_idx" ON "ApiKeys"("key");

-- CreateIndex
CREATE INDEX "_ApplicationToSession_B_index" ON "_ApplicationToSession"("B");

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "Bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Organizations" ADD CONSTRAINT "Organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teams" ADD CONSTRAINT "Teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembers" ADD CONSTRAINT "TeamMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeys" ADD CONSTRAINT "ApiKeys_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
