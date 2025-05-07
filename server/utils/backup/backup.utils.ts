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

export async function verifyRecoveryFileSignature({
  walletId,
  recoveryBackupShareHash,
  recoveryFileServerSignature
}: {
  walletId: string;
  recoveryBackupShareHash: string;
  recoveryFileServerSignature: string;
}): Promise<boolean> {
  try {
    console.log("Verifying recovery file signature for wallet:", walletId);
    
    // Handle both formats of recoveryFileServerSignature
    const signature = recoveryFileServerSignature.startsWith('v1.') 
      ? recoveryFileServerSignature.substring(3) 
      : recoveryFileServerSignature;
    
    // Create a signature object
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Create the verification data using the same function used when generating the signature
    const verificationData = getRecoveryFileSignatureRawData({
      walletId,
      recoveryBackupShareHash
    });
    
    try {
      const isValidPKCS = await crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5',
        },
        await importRSAPublicKey(Config.BACKUP_FILE_PUBLIC_KEY, 'RSASSA-PKCS1-v1_5'),
        signatureBuffer,
        Buffer.from(verificationData)
      );
      
      if (isValidPKCS) {
        console.log("Recovery file signature verified successfully using RSASSA-PKCS1-v1_5");
        return true;
      }
    } catch (pkcsError) {
      console.log("RSASSA-PKCS1-v1_5 verification failed:", pkcsError);
    }
    
    console.log("All signature verification methods failed");
    return false;
  } catch (error) {
    console.error("Error verifying recovery file signature:", error);
    return false;
  }
}

// Helper function to import an RSA public key with different algorithms
async function importRSAPublicKey(publicKeyPEM: string, algorithm: 'RSA-PSS' | 'RSASSA-PKCS1-v1_5') {
  // Remove PEM headers and newlines
  const pemContents = publicKeyPEM
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '');
  
  // Convert base64 to buffer
  const binaryDer = Buffer.from(pemContents, 'base64');
  
  // Import the key
  return crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: algorithm,
      hash: 'SHA-256',
    },
    true,
    ['verify']
  );
}

export const BackupUtils = {
  generateRecoveryFileSignature,
  verifyRecoveryFileSignature,
};
