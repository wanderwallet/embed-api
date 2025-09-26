-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "Wallets" ADD COLUMN     "lastCloudBackedUpAt" TIMESTAMP(3),
ADD COLUMN     "totalCloudBackups" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CloudBackups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileId" VARCHAR(255) NOT NULL,
    "provider" "CloudProvider" NOT NULL,
    "email" VARCHAR(255),
    "walletId" UUID NOT NULL,

    CONSTRAINT "CloudBackups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloudBackups_walletId_idx" ON "CloudBackups"("walletId");

-- CreateIndex
CREATE INDEX "CloudBackups_provider_idx" ON "CloudBackups"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "CloudBackups_walletId_key" ON "CloudBackups"("walletId");

-- AddForeignKey
ALTER TABLE "CloudBackups" ADD CONSTRAINT "CloudBackups_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
