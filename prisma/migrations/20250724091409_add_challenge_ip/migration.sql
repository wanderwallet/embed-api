/*
  Warnings:

  - Added the required column `ip` to the `AnonChallenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ip` to the `Challenges` table without a default value. This is not possible if the table is not empty.

  That's why we delete all the records (not the table itself) next:
*/

DELETE FROM "AnonChallenges";
DELETE FROM "Challenges";

-- AlterTable
ALTER TABLE "AnonChallenges" ADD COLUMN     "ip" INET NOT NULL;

-- AlterTable
ALTER TABLE "Challenges" ADD COLUMN     "ip" INET NOT NULL;
