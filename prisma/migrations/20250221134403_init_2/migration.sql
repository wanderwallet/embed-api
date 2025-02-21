/*
  Warnings:

  - The values [ACCOUNT_RECOVERY_CONFIRMATION] on the enum `ChallengePurpose` will be removed. If these variants are still used in the database, this will fail.
  - The values [SECRET] on the enum `WalletPrivacySetting` will be removed. If these variants are still used in the database, this will fail.
  - The values [WATCH_ONLY] on the enum `WalletStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `auth0ClientId` on the `Applications` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Applications` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `Challenges` table. All the data in the column will be lost.
  - The primary key for the `Developers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `planPaidAt` on the `Developers` table. All the data in the column will be lost.
  - You are about to drop the column `applicationid` on the `DevicesAndLocations` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `WalletActivations` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `WalletExports` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `WalletRecoveries` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Wallets` table. All the data in the column will be lost.
  - You are about to alter the column `tagsSetting` on the `Wallets` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(32)`.
  - You are about to drop the `AuthMethods` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecoveryKeyShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkKeyShare` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,purpose]` on the table `Challenges` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,chain,address]` on the table `Wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `developerId` to the `Applications` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Challenges` required. This step will fail if there are existing NULL values in that column.
  - Made the column `walletId` on table `Challenges` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `countryCode` to the `DevicesAndLocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `Sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceAndLocationId` to the `WalletActivations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `WalletActivations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WalletActivations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceAndLocationId` to the `WalletExports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WalletExports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceAndLocationId` to the `WalletRecoveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `WalletRecoveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WalletRecoveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceAndLocationId` to the `Wallets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserDetailsPrivacySetting" AS ENUM ('NAME', 'EMAIL', 'PROFILE_PICTURE');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "WalletSourceType" AS ENUM ('IMPORTED', 'GENERATED');

-- CreateEnum
CREATE TYPE "WalletSourceFrom" AS ENUM ('SEEDPHRASE', 'KEYFILE', 'BINARY');

-- CreateEnum
CREATE TYPE "WalletUsageStatus" AS ENUM ('SUCCESSFUL', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "ChallengePurpose_new" AS ENUM ('ACTIVATION', 'SHARE_RECOVERY', 'SHARE_ROTATION', 'ACCOUNT_RECOVERY');
ALTER TABLE "Challenges" ALTER COLUMN "purpose" TYPE "ChallengePurpose_new" USING ("purpose"::text::"ChallengePurpose_new");
ALTER TYPE "ChallengePurpose" RENAME TO "ChallengePurpose_old";
ALTER TYPE "ChallengePurpose_new" RENAME TO "ChallengePurpose";
DROP TYPE "ChallengePurpose_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WalletPrivacySetting_new" AS ENUM ('PRIVATE', 'PUBLIC');
ALTER TABLE "Wallets" ALTER COLUMN "walletPrivacySetting" DROP DEFAULT;
ALTER TABLE "Wallets" ALTER COLUMN "walletPrivacySetting" TYPE "WalletPrivacySetting_new" USING ("walletPrivacySetting"::text::"WalletPrivacySetting_new");
ALTER TYPE "WalletPrivacySetting" RENAME TO "WalletPrivacySetting_old";
ALTER TYPE "WalletPrivacySetting_new" RENAME TO "WalletPrivacySetting";
DROP TYPE "WalletPrivacySetting_old";
ALTER TABLE "Wallets" ALTER COLUMN "walletPrivacySetting" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WalletStatus_new" AS ENUM ('ENABLED', 'DISABLED', 'READONLY', 'LOST');
ALTER TABLE "Wallets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Wallets" ALTER COLUMN "status" TYPE "WalletStatus_new" USING ("status"::text::"WalletStatus_new");
ALTER TYPE "WalletStatus" RENAME TO "WalletStatus_old";
ALTER TYPE "WalletStatus_new" RENAME TO "WalletStatus";
DROP TYPE "WalletStatus_old";
ALTER TABLE "Wallets" ALTER COLUMN "status" SET DEFAULT 'ENABLED';
COMMIT;

-- DropForeignKey
ALTER TABLE "Applications" DROP CONSTRAINT "Applications_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "AuthMethods" DROP CONSTRAINT "AuthMethods_userId_fkey";

-- DropForeignKey
ALTER TABLE "Challenges" DROP CONSTRAINT "Challenges_userId_fkey";

-- DropForeignKey
ALTER TABLE "Developers" DROP CONSTRAINT "Developers_userId_fkey";

-- DropForeignKey
ALTER TABLE "DevicesAndLocations" DROP CONSTRAINT "DevicesAndLocations_applicationid_fkey";

-- DropForeignKey
ALTER TABLE "DevicesAndLocations" DROP CONSTRAINT "DevicesAndLocations_userId_fkey";

-- DropForeignKey
ALTER TABLE "RecoveryKeyShare" DROP CONSTRAINT "RecoveryKeyShare_userId_fkey";

-- DropForeignKey
ALTER TABLE "RecoveryKeyShare" DROP CONSTRAINT "RecoveryKeyShare_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Sessions" DROP CONSTRAINT "Sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletActivations" DROP CONSTRAINT "WalletActivations_workKeyShareId_fkey";

-- DropForeignKey
ALTER TABLE "WalletRecoveries" DROP CONSTRAINT "WalletRecoveries_recoveryKeyShareId_fkey";

-- DropForeignKey
ALTER TABLE "Wallets" DROP CONSTRAINT "Wallets_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkKeyShare" DROP CONSTRAINT "WorkKeyShare_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkKeyShare" DROP CONSTRAINT "WorkKeyShare_walletId_fkey";

-- DropIndex
DROP INDEX "Applications_auth0ClientId_idx";

-- DropIndex
DROP INDEX "Applications_ownerId_idx";

-- DropIndex
DROP INDEX "Challenges_issuedAt_idx";

-- DropIndex
DROP INDEX "Challenges_type_userId_key";

-- DropIndex
DROP INDEX "DevicesAndLocations_deviceNonce_idx";

-- DropIndex
DROP INDEX "DevicesAndLocations_ip_idx";

-- DropIndex
DROP INDEX "Sessions_deviceNonce_idx";

-- DropIndex
DROP INDEX "Sessions_ip_idx";

-- DropIndex
DROP INDEX "Wallets_address_idx";

-- DropIndex
DROP INDEX "Wallets_chain_idx";

-- DropIndex
DROP INDEX "Wallets_createdAt_idx";

-- DropIndex
DROP INDEX "Wallets_status_idx";

-- DropIndex
DROP INDEX "Wallets_userId_address_chain_key";

-- AlterTable
ALTER TABLE "Applications" DROP COLUMN "auth0ClientId",
DROP COLUMN "ownerId",
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "developerId" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Challenges" DROP COLUMN "issuedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "walletId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Developers" DROP CONSTRAINT "Developers_pkey",
DROP COLUMN "planPaidAt",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "countryCode" VARCHAR(2),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "planStartedAt" VARCHAR(50) NOT NULL DEFAULT 'free',
ADD COLUMN     "taxId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "Developers_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Developers_id_seq";

-- AlterTable
ALTER TABLE "DevicesAndLocations" DROP COLUMN "applicationid",
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "countryCode" VARCHAR(2) NOT NULL;

-- AlterTable
ALTER TABLE "Sessions" ADD COLUMN     "countryCode" VARCHAR(2) NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WalletActivations" DROP COLUMN "location",
ADD COLUMN     "deviceAndLocationId" TEXT NOT NULL,
ADD COLUMN     "status" "WalletUsageStatus" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "workKeyShareId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WalletExports" DROP COLUMN "location",
ADD COLUMN     "deviceAndLocationId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WalletRecoveries" DROP COLUMN "location",
ADD COLUMN     "deviceAndLocationId" TEXT NOT NULL,
ADD COLUMN     "status" "WalletUsageStatus" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "recoveryKeyShareId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wallets" DROP COLUMN "location",
ADD COLUMN     "aliasSetting" VARCHAR(64),
ADD COLUMN     "deviceAndLocationId" TEXT NOT NULL,
ADD COLUMN     "lastActivatedAt" TIMESTAMP(3),
ADD COLUMN     "lastBackedUpAt" TIMESTAMP(3),
ADD COLUMN     "lastExportedAt" TIMESTAMP(3),
ADD COLUMN     "lastRecoveredAt" TIMESTAMP(3),
ADD COLUMN     "totalActivations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalBackups" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalExports" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRecoveries" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "publicKey" SET DATA TYPE VARCHAR(1024),
ALTER COLUMN "tagsSetting" SET DATA TYPE VARCHAR(32)[],
ALTER COLUMN "doNotAskAgainSetting" SET DEFAULT false,
ALTER COLUMN "canRecoverAccountSetting" SET DEFAULT false,
ALTER COLUMN "activationAuthsRequiredSetting" SET DEFAULT 0,
ALTER COLUMN "backupAuthsRequiredSetting" SET DEFAULT 0,
ALTER COLUMN "recoveryAuthsRequiredSetting" SET DEFAULT 0,
ALTER COLUMN "info" DROP NOT NULL,
ALTER COLUMN "source" DROP NOT NULL;

-- DropTable
DROP TABLE "AuthMethods";

-- DropTable
DROP TABLE "RecoveryKeyShare";

-- DropTable
DROP TABLE "Users";

-- DropTable
DROP TABLE "WorkKeyShare";

-- CreateTable
CREATE TABLE "ShadowUsers" (
    "supId" TEXT NOT NULL,
    "supName" VARCHAR(100),
    "supEmail" VARCHAR(255),
    "supPicture" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recoveredAt" TIMESTAMP(3),
    "userDetailsRecoveryPrivacy" "UserDetailsPrivacySetting"[],
    "notificationsSetting" "NotificationSetting" NOT NULL DEFAULT 'SECURITY',
    "recoveryWalletsRequiredSetting" INTEGER NOT NULL DEFAULT 1,
    "ipPrivacyFilterSetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',
    "countryPrivacySetting" "FilterPrivacySetting" DEFAULT 'HIDE_DETAILS',

    CONSTRAINT "ShadowUsers_pkey" PRIMARY KEY ("supId")
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
CREATE TABLE "LoginAttempts" (
    "id" TEXT NOT NULL,
    "rejectionReason" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supIdentityId" TEXT,
    "userId" TEXT NOT NULL,
    "deviceAndLocationId" TEXT NOT NULL,

    CONSTRAINT "LoginAttempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bills_developerId_idx" ON "Bills"("developerId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkKeyShares_userId_sessionId_walletId_key" ON "WorkKeyShares"("userId", "sessionId", "walletId");

-- CreateIndex
CREATE INDEX "RecoveryKeyShares_userId_createdAt_idx" ON "RecoveryKeyShares"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryKeyShares_userId_recoveryBackupShareHash_key" ON "RecoveryKeyShares"("userId", "recoveryBackupShareHash");

-- CreateIndex
CREATE INDEX "LoginAttempts_userId_idx" ON "LoginAttempts"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempts_createdAt_idx" ON "LoginAttempts"("createdAt");

-- CreateIndex
CREATE INDEX "Applications_developerId_idx" ON "Applications"("developerId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenges_userId_purpose_key" ON "Challenges"("userId", "purpose");

-- CreateIndex
CREATE INDEX "WalletActivations_userId_idx" ON "WalletActivations"("userId");

-- CreateIndex
CREATE INDEX "WalletExports_userId_idx" ON "WalletExports"("userId");

-- CreateIndex
CREATE INDEX "WalletRecoveries_userId_idx" ON "WalletRecoveries"("userId");

-- CreateIndex
CREATE INDEX "Wallets_canRecoverAccountSetting_chain_address_idx" ON "Wallets"("canRecoverAccountSetting", "chain", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_userId_chain_address_key" ON "Wallets"("userId", "chain", "address");

-- AddForeignKey
ALTER TABLE "Developers" ADD CONSTRAINT "Developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "Bills_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_workKeyShareId_fkey" FOREIGN KEY ("workKeyShareId") REFERENCES "WorkKeyShares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletActivations" ADD CONSTRAINT "WalletActivations_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_recoveryKeyShareId_fkey" FOREIGN KEY ("recoveryKeyShareId") REFERENCES "RecoveryKeyShares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletRecoveries" ADD CONSTRAINT "WalletRecoveries_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletExports" ADD CONSTRAINT "WalletExports_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryKeyShares" ADD CONSTRAINT "RecoveryKeyShares_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicesAndLocations" ADD CONSTRAINT "DevicesAndLocations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempts" ADD CONSTRAINT "LoginAttempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ShadowUsers"("supId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempts" ADD CONSTRAINT "LoginAttempts_deviceAndLocationId_fkey" FOREIGN KEY ("deviceAndLocationId") REFERENCES "DevicesAndLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
