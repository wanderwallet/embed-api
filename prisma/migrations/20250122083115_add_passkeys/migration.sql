-- CreateEnum
CREATE TYPE "WebAuthnDeviceType" AS ENUM ('SINGLE_DEVICE', 'MULTI_DEVICE');

-- CreateEnum
CREATE TYPE "WebAuthnBackupState" AS ENUM ('NOT_BACKED_UP', 'BACKED_UP');

-- AlterTable
ALTER TABLE "AuthMethods" ADD COLUMN     "aaguid" VARCHAR(255) DEFAULT '00000000-0000-0000-0000-000000000000',
ADD COLUMN     "backupState" "WebAuthnBackupState" NOT NULL DEFAULT 'NOT_BACKED_UP',
ADD COLUMN     "deviceType" "WebAuthnDeviceType" NOT NULL DEFAULT 'SINGLE_DEVICE',
ADD COLUMN     "publicKey" BYTEA,
ADD COLUMN     "signCount" INTEGER,
ADD COLUMN     "transports" TEXT[];

-- AlterTable
ALTER TABLE "Challenges" ADD COLUMN     "usedAt" TIMESTAMP(3);
