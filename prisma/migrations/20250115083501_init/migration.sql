-- CreateTable
CREATE TABLE "DbUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DbUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DBDeveloper" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dbUserId" TEXT NOT NULL,

    CONSTRAINT "DBDeveloper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "walletType" TEXT NOT NULL,
    "canBeUsedToRecoverAccount" BOOLEAN NOT NULL,
    "canRecover" BOOLEAN NOT NULL,
    "info" JSONB NOT NULL,
    "source" JSONB NOT NULL,
    "lastUsed" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "DbWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbWalletExports" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,

    CONSTRAINT "DbWalletExports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbKeyShare" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "deviceNonceRotatedAt" INTEGER NOT NULL,
    "sharesRotatedAt" INTEGER NOT NULL,
    "lastRequestedAt" INTEGER NOT NULL,
    "usagesAfterExpiration" INTEGER NOT NULL,
    "deviceNonce" TEXT NOT NULL,
    "authShare" TEXT NOT NULL,
    "deviceShareHash" TEXT NOT NULL,
    "recoveryAuthShare" TEXT NOT NULL,
    "recoveryBackupShareHash" TEXT NOT NULL,
    "recoveryDeviceShareHash" TEXT NOT NULL,

    CONSTRAINT "DbKeyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DBDeveloper_email_key" ON "DBDeveloper"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DBDeveloper_apiKey_key" ON "DBDeveloper"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "DBDeveloper_dbUserId_key" ON "DBDeveloper"("dbUserId");

-- AddForeignKey
ALTER TABLE "DBDeveloper" ADD CONSTRAINT "DBDeveloper_dbUserId_fkey" FOREIGN KEY ("dbUserId") REFERENCES "DbUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbWalletExports" ADD CONSTRAINT "DbWalletExports_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DbWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
