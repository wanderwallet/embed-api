import { Config } from "@/server/utils/config/config.constants";

const IMPORT_KEY_ALGORITHM: RsaHashedImportParams = {
  name: "RSA-PSS",
  hash: "SHA-256",
};

const GENERATE_KEY_ALGORITHM: RsaHashedKeyGenParams = {
  ...IMPORT_KEY_ALGORITHM,
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
}

const SIGN_ALGORITHM: RsaPssParams  = {
  name: "RSA-PSS",
  saltLength: 32,
};

export async function generateRecoveryFileKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    GENERATE_KEY_ALGORITHM,
    true,
    ["sign"],
  );

  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKey = Buffer.from(privateKeyBuffer).toString("base64");

  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKey = Buffer.from(publicKeyBuffer).toString("base64");

  return {
    privateKey,
    publicKey,
  }
}

export interface RecoveryFileData {
  walletId: string;
  recoveryBackupShareHash: string;
}

export function getRecoveryFileSignatureRawData({
  walletId,
  recoveryBackupShareHash,
}: RecoveryFileData) {
  return `${walletId}|${recoveryBackupShareHash}`;
}

async function generateRecoveryFileSignature(recoveryFileData: RecoveryFileData) {
  const recoveryFileRawData = getRecoveryFileSignatureRawData(recoveryFileData);
  const recoveryFileRawDataBuffer = Buffer.from(recoveryFileRawData);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(Config.BACKUP_FILE_PRIVATE_KEY, "base64"),
    IMPORT_KEY_ALGORITHM,
    true,
    ["sign"],
  );

  const recoveryFileSignatureBuffer = await crypto.subtle.sign(
    SIGN_ALGORITHM,
    privateKey,
    recoveryFileRawDataBuffer,
  );

  return Buffer.from(recoveryFileSignatureBuffer).toString("base64");
}

export interface VerifyRecoveryFileSignature extends RecoveryFileData {
  recoveryFileServerSignature: string;
}

async function verifyRecoveryFileSignature({
  recoveryFileServerSignature,
  ...recoveryFileData
}: VerifyRecoveryFileSignature) {
  try {
    console.log(`Importing public key for verification: ${Config.BACKUP_FILE_PUBLIC_KEY.substring(0, 20)}...`);
    const publicKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(Config.BACKUP_FILE_PUBLIC_KEY, "base64"),
      IMPORT_KEY_ALGORITHM,
      true,
      ["verify"],
    );

    const recoveryFileRawData = getRecoveryFileSignatureRawData(recoveryFileData);
    const recoveryFileRawDataBuffer = Buffer.from(recoveryFileRawData);
    
    return crypto.subtle.verify(
      SIGN_ALGORITHM,
      publicKey,
      Buffer.from(recoveryFileServerSignature, "base64"),
      recoveryFileRawDataBuffer,
    );
  } catch (error) {
    console.error('Error verifying recovery file signature:', error);
    throw error;
  }
}

export const BackupUtils = {
  generateRecoveryFileSignature,
  verifyRecoveryFileSignature,
};
