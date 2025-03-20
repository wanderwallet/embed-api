-- CreateTable
CREATE TABLE "PasskeyChallenges" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasskeyChallenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasskeyChallenges_userId_createdAt_idx" ON "PasskeyChallenges"("userId", "createdAt");
