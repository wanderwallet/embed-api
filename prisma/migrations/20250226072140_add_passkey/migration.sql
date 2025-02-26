-- CreateTable
CREATE TABLE "Passkeys" (
    "id" TEXT NOT NULL,
    "credentialId" VARCHAR(255) NOT NULL,
    "publicKey" VARCHAR(1024) NOT NULL,
    "signCount" INTEGER NOT NULL DEFAULT 0,
    "label" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Passkeys_userId_credentialId_key" ON "Passkeys"("userId", "credentialId");

-- AddForeignKey
ALTER TABLE "Passkeys" ADD CONSTRAINT "Passkeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfiles"("supId") ON DELETE CASCADE ON UPDATE CASCADE;
