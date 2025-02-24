/*
  Warnings:

  - Changed the type of `ip` on the `DevicesAndLocations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ip` on the `Sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DevicesAndLocations" DROP COLUMN "ip",
ADD COLUMN     "ip" INET NOT NULL;

-- AlterTable
ALTER TABLE "Sessions" DROP COLUMN "ip",
ADD COLUMN     "ip" INET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DevicesAndLocations_userId_deviceNonce_ip_userAgent_key" ON "DevicesAndLocations"("userId", "deviceNonce", "ip", "userAgent");
