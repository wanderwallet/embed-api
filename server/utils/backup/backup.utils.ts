import { Config } from "@/server/utils/config/config.constants";

const IMPORT_KEY_ALGORITHM: RsaHashedImportParams = {
  name: "RSA-PSS",
  hash: "SHA-256",
};

const SIGN_ALGORITHM: RsaPssParams  = {
  name: "RSA-PSS",
  saltLength: 32,
};

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

  const privateKey = await window.crypto.subtle.importKey(
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

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    Buffer.from(Config.BACKUP_FILE_PUBLIC_KEY, "base64"),
    IMPORT_KEY_ALGORITHM,
    true,
    ["sign"],
  );

  const recoveryFileRawData = getRecoveryFileSignatureRawData(recoveryFileData);
  const recoveryFileRawDataBuffer = Buffer.from(recoveryFileRawData);

  return crypto.subtle.verify(
    SIGN_ALGORITHM,
    publicKey,
    Buffer.from(recoveryFileServerSignature, "base64"),
    recoveryFileRawDataBuffer,
  );
}

export const BackupUtils = {
  generateRecoveryFileSignature,
  verifyRecoveryFileSignature,
};
