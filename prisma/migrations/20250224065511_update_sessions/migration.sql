/*
  Warnings:

  - You are about to drop the column `providerSessionId` on the `Sessions` table. All the data in the column will be lost.
  - Made the column `userId` on table `Sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Sessions_providerSessionId_idx";

-- AlterTable
ALTER TABLE "Sessions" DROP COLUMN "providerSessionId",
ALTER COLUMN "deviceNonce" DROP NOT NULL,
ALTER COLUMN "countryCode" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;
