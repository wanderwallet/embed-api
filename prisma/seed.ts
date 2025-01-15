import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const user1 = await prisma.dbUser.create({
    data: {
      name: "Alice",
    },
  });

  const user2 = await prisma.dbUser.create({
    data: {
      name: "Bob",
    },
  });

  // Create sample wallets
  const wallet1 = await prisma.dbWallet.create({
    data: {
      userId: user1.id,
      chain: "arweave",
      address: "wallet_address_1",
      publicKey: "public_key_1",
      walletType: "private",
      canBeUsedToRecoverAccount: true,
      canRecover: true,
      info: {
        identifierType: "alias",
        alias: "Alice's Wallet",
        ans: null,
        pns: null,
      },
      source: {
        type: "generated",
        from: "seedPhrase",
        deviceAndLocationInfo: {},
      },
      lastUsed: Date.now(),
      status: "enabled",
    },
  });

  // wallet 2
  await prisma.dbWallet.create({
    data: {
      userId: user2.id,
      chain: "arweave",
      address: "wallet_address_2",
      publicKey: "public_key_2",
      walletType: "public",
      canBeUsedToRecoverAccount: false,
      canRecover: false,
      info: {
        identifierType: "alias",
        alias: "Bob's Wallet",
        ans: null,
        pns: null,
      },
      source: {
        type: "imported",
        from: "binary",
        deviceAndLocationInfo: {},
      },
      lastUsed: Date.now(),
      status: "watchOnly",
    },
  });

  // Create a wallet export log
  await prisma.dbWalletExports.create({
    data: {
      walletId: wallet1.id,
      location: "local_backup",
    },
  });

  // Create key shares
  await prisma.dbKeyShare.create({
    data: {
      userId: user1.id,
      walletId: wallet1.id,
      walletAddress: wallet1.address,
      createdAt: Date.now(),
      deviceNonceRotatedAt: Date.now(),
      sharesRotatedAt: Date.now(),
      lastRequestedAt: Date.now(),
      usagesAfterExpiration: 0,
      status: "",
      deviceNonce: "device_nonce_1",
      authShare: "auth_share_1",
      deviceShareHash: "device_share_hash_1",
      recoveryAuthShare: "recovery_auth_share_1",
      recoveryBackupShareHash: "recovery_backup_share_hash_1",
      recoveryDeviceShareHash: "recovery_device_share_hash_1",
    },
  });

  // Create an event log
  await prisma.eventLog.create({
    data: {
      userId: user1.id,
      eventType: "authentication",
      details: { success: true, method: "password" },
    },
  });

  // Create a challenge
  await prisma.challenge.create({
    data: {
      userId: user2.id,
      version: "v1.0",
    },
  });
}

main()
  .then(() => {
    console.log("Seeding completed.");
  })
  .catch((e) => {
    console.error("Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
