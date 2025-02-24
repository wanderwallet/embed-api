/*
  Warnings:

  - The primary key for the `Sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ApplicationToSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sessionId` on the `WorkKeyShares` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_ApplicationToSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "WorkKeyShares" DROP CONSTRAINT "WorkKeyShares_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "_ApplicationToSession" DROP CONSTRAINT "_ApplicationToSession_B_fkey";

-- AlterTable
ALTER TABLE "Sessions" DROP CONSTRAINT "Sessions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WorkKeyShares" DROP COLUMN "sessionId",
ADD COLUMN     "sessionId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "_ApplicationToSession" DROP CONSTRAINT "_ApplicationToSession_AB_pkey",
DROP COLUMN "B",
ADD COLUMN     "B" UUID NOT NULL,
ADD CONSTRAINT "_ApplicationToSession_AB_pkey" PRIMARY KEY ("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "WorkKeyShares_userId_sessionId_walletId_key" ON "WorkKeyShares"("userId", "sessionId", "walletId");

-- CreateIndex
CREATE INDEX "_ApplicationToSession_B_index" ON "_ApplicationToSession"("B");

-- AddForeignKey
ALTER TABLE "WorkKeyShares" ADD CONSTRAINT "WorkKeyShares_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToSession" ADD CONSTRAINT "_ApplicationToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
