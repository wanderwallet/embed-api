"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// sdk/index.ts
var index_exports = {};
__export(index_exports, {
  AuthProviderType: () => import_client5.AuthProviderType,
  Chain: () => import_client5.Chain,
  ChallengeClientV1: () => ChallengeClientV1,
  ChallengeClientV2: () => ChallengeClientV2,
  ErrorMessages: () => ErrorMessages,
  ExportType: () => import_client5.ExportType,
  WalletPrivacySetting: () => import_client5.WalletPrivacySetting,
  WalletSourceFrom: () => import_client5.WalletSourceFrom,
  WalletSourceType: () => import_client5.WalletSourceType,
  WalletStatus: () => import_client5.WalletStatus,
  createSupabaseClient: () => createSupabaseClient,
  createTRPCClient: () => createTRPCClient
});
module.exports = __toCommonJS(index_exports);
var import_client5 = require("@prisma/client");

// server/utils/error/error.constants.ts
var ErrorMessages = {
  // Wallets:
  WALLET_NOT_FOUND: `Wallet not found.`,
  WALLET_CANNOT_BE_ENABLED: `Wallet cannot be enabled.`,
  WALLET_CANNOT_BE_DISABLED: `Wallet cannot be disabled.`,
  WALLET_NO_PRIVACY_SUPPORT: "Wallet does not support the privacy setting.",
  WALLET_ADDRESS_MISMATCH: "Wallet address mismatch.",
  WALLET_NOT_VALID_FOR_ACCOUNT_RECOVERY: `Wallet cannot be used for account recovery.`,
  WALLET_MISSING_PUBLIC_KEY: `Wallet is missing public key.`,
  // Shares:
  WORK_SHARE_NOT_FOUND: `Work share not found.`,
  WORK_SHARE_INVALIDATED: `Work share invalidated.`,
  RECOVERY_SHARE_NOT_FOUND: "Recovery share not found.",
  INVALID_SHARE: `Invalid share.`,
  // Challenge:
  CHALLENGE_NOT_FOUND: `Challenge not found. It might have been resolved already, or it might have expired.`,
  CHALLENGE_INVALID: `Invalid challenge.`,
  CHALLENGE_EXPIRED_ERROR: `Challenge expired.`,
  CHALLENGE_MISSING_PK: `Missing public key.`,
  CHALLENGE_UNEXPECTED_ERROR: `Unexpected error validating challenge.`,
  // Recovery:
  RECOVERY_ACCOUNTS_NOT_FOUND: `No recoverable accounts found.`,
  RECOVERY_WALLETS_NOT_FOUND: `No recoverable account wallets found.`,
  RECOVERY_MISSING_PUBLIC_KEY: `Missing public key.`,
  // Generic:
  NO_OP: "This request is a no-op."
};

// client/utils/trpc/trpc-client.utils.ts
var import_client = require("@trpc/client");
var import_superjson = __toESM(require("superjson"));
var import_observable = require("@trpc/server/observable");
var authErrorLink = (opts) => {
  return () => {
    return ({ next, op }) => {
      return (0, import_observable.observable)((observer) => {
        const unsubscribe = next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          async error(err) {
            if (err.data?.code === "UNAUTHORIZED") {
              console.warn("\u{1F6AB} Unauthorized access detected:", {
                path: op.path,
                type: op.type
              });
              const currentAuthToken = opts.getAuthTokenHeader();
              if (currentAuthToken) {
                await opts.onAuthError?.();
                opts.setAuthTokenHeader(null);
              }
            }
            observer.error(err);
          },
          complete() {
            observer.complete();
          }
        });
        return unsubscribe;
      });
    };
  };
};
function createTRPCClient({
  baseURL,
  trpcURL,
  onAuthError,
  ...params
}) {
  let authToken = params.authToken || null;
  let deviceNonce = params.deviceNonce || "";
  let clientId = params.clientId || "";
  let applicationId = params.applicationId || "";
  function getAuthTokenHeader() {
    return authToken;
  }
  function setAuthTokenHeader(nextAuthToken) {
    authToken = nextAuthToken || null;
  }
  function getDeviceNonceHeader() {
    return deviceNonce;
  }
  function setDeviceNonceHeader(nextDeviceNonce) {
    deviceNonce = nextDeviceNonce;
  }
  function getClientIdHeader() {
    return clientId;
  }
  function setClientIdHeader(nextClientId) {
    clientId = nextClientId;
  }
  function getApplicationIdHeader() {
    return applicationId;
  }
  function setApplicationIdHeader(nextApplicationId) {
    applicationId = nextApplicationId;
  }
  const url = trpcURL || (baseURL ? `${baseURL.replace(/\/$/, "")}/api/trpc` : "");
  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");
  const client = (0, import_client.createTRPCClient)({
    links: [
      authErrorLink({
        onAuthError,
        getAuthTokenHeader,
        setAuthTokenHeader
      }),
      (0, import_client.httpBatchLink)({
        url,
        transformer: import_superjson.default,
        headers() {
          if (!deviceNonce) {
            throw new Error(`Missing device nonce header.`);
          }
          if (!clientId) {
            throw new Error(`Missing client ID header.`);
          }
          return {
            authorization: authToken ? `Bearer ${authToken}` : void 0,
            "x-device-nonce": deviceNonce,
            "x-client-id": clientId,
            "x-application-id": applicationId
          };
        }
      })
    ]
  });
  return {
    client,
    getAuthTokenHeader,
    setAuthTokenHeader,
    getDeviceNonceHeader,
    setDeviceNonceHeader,
    getClientIdHeader,
    setClientIdHeader,
    getApplicationIdHeader,
    setApplicationIdHeader
  };
}

// client/utils/supabase/supabase-client.utils.ts
var import_supabase_js = require("@supabase/supabase-js");
function createSupabaseClient(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "", supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) {
  return (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey, supabaseOptions);
}

// server/utils/challenge/clients/challenge-client.utils.ts
var import_client2 = require("@prisma/client");
function isAnonChallenge(challenge) {
  return !!challenge.chain && !!challenge.address;
}
var CHALLENGES_WITHOUT_SHARE_HASH = [
  import_client2.ChallengePurpose.SHARE_ROTATION,
  import_client2.ChallengePurpose.ACCOUNT_RECOVERY,
  import_client2.ChallengePurpose.SHARE_RECOVERY
];
function getChallengeRawData({ challenge, session, shareHash }) {
  const commonChallengeData = [
    challenge.id,
    challenge.createdAt.toISOString(),
    challenge.value,
    challenge.version,
    session.id,
    session.ip,
    session.deviceNonce,
    session.userAgent
  ].join("|");
  if (isAnonChallenge(challenge)) {
    return `ANON|${commonChallengeData}|${challenge.chain}|${challenge.address}`;
  }
  if (!shareHash && !CHALLENGES_WITHOUT_SHARE_HASH.includes(challenge.purpose)) {
    throw new Error("Missing `shareHash`");
  }
  return [
    challenge.purpose,
    commonChallengeData,
    challenge.userId,
    challenge.walletId,
    shareHash
  ].filter(Boolean).join("|");
}

// server/utils/challenge/clients/challenge-client-v1-rsa.ts
var import_client3 = require("@prisma/client");
var import_node_crypto = require("crypto");
var CHALLENGE_CLIENT_VERSION = "v1";
var IMPORT_KEY_ALGORITHM = {
  name: "RSA-PSS",
  hash: "SHA-256"
};
var SIGN_ALGORITHM = {
  name: "RSA-PSS",
  saltLength: 32
};
async function solveChallenge({
  challenge,
  session,
  shareHash,
  privateKey: jwk
}) {
  const challengeRawData = getChallengeRawData({
    challenge,
    session,
    shareHash
  });
  const challengeRawDataBuffer = Buffer.from(challengeRawData);
  let signatureOrHashBuffer;
  if (isAnonChallenge(challenge) || challenge.type === import_client3.ChallengeType.SIGNATURE) {
    if (!jwk) {
      throw new Error("Missing private key (jwk)");
    }
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      IMPORT_KEY_ALGORITHM,
      true,
      ["sign"]
    );
    signatureOrHashBuffer = await crypto.subtle.sign(
      SIGN_ALGORITHM,
      privateKey,
      challengeRawDataBuffer
    );
  } else if (process.env.NODE_ENV === "development") {
    signatureOrHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      challengeRawDataBuffer
    );
  } else {
    throw new Error("Cannot solve challenge.");
  }
  const signatureOrHashString = Buffer.from(signatureOrHashBuffer).toString(
    "base64"
  );
  return `${CHALLENGE_CLIENT_VERSION}.${signatureOrHashString}`;
}
async function verifyChallenge({
  // ChallengeData:
  challenge,
  session,
  shareHash,
  // Verification:
  solution,
  publicKey: publicKeyParam
}) {
  const solutionValue = solution.split(".")[1];
  if (!solutionValue) {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
  if (isAnonChallenge(challenge) || challenge.type === import_client3.ChallengeType.SIGNATURE) {
    if (!publicKeyParam) {
      return ErrorMessages.CHALLENGE_MISSING_PK;
    }
    const publicJWK = {
      e: "AQAB",
      ext: true,
      kty: "RSA",
      n: publicKeyParam
    };
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicJWK,
      IMPORT_KEY_ALGORITHM,
      true,
      ["verify"]
    );
    const challengeRawData = await getChallengeRawData({
      challenge,
      session,
      shareHash
    });
    const challengeRawDataBuffer = Buffer.from(challengeRawData);
    const isSignatureValid = crypto.subtle.verify(
      SIGN_ALGORITHM,
      publicKey,
      Buffer.from(solutionValue, "base64"),
      challengeRawDataBuffer
    );
    if (!isSignatureValid) return ErrorMessages.CHALLENGE_INVALID;
  } else if (process.env.NODE_ENV === "development") {
    const expectedSolution = await solveChallenge({
      challenge,
      session,
      shareHash
    });
    if (!(0, import_node_crypto.timingSafeEqual)(Buffer.from(expectedSolution, "utf16le"), Buffer.from(solution, "utf16le"))) return ErrorMessages.CHALLENGE_INVALID;
  } else {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
  return null;
}
var ChallengeClientV1 = {
  version: CHALLENGE_CLIENT_VERSION,
  getChallengeRawData,
  solveChallenge,
  verifyChallenge
};

// server/utils/challenge/clients/challenge-client-v2-eddsa.ts
var import_client4 = require("@prisma/client");
var import_ed25519 = require("@noble/curves/ed25519.js");
var CHALLENGE_CLIENT_VERSION2 = "v2";
async function solveChallenge2({
  challenge,
  session,
  shareHash,
  privateKey
}) {
  const challengeRawData = getChallengeRawData({
    challenge,
    session,
    shareHash
  });
  const challengeRawDataBuffer = Buffer.from(challengeRawData);
  let signatureBuffer;
  if (isAnonChallenge(challenge) || challenge.type === import_client4.ChallengeType.SIGNATURE) {
    if (!privateKey) {
      throw new Error("Missing private key");
    }
    signatureBuffer = import_ed25519.ed25519.sign(challengeRawDataBuffer, privateKey);
  } else {
    throw new Error("Cannot solve challenge.");
  }
  const signatureOrHashString = Buffer.from(signatureBuffer).toString(
    "base64"
  );
  return `${CHALLENGE_CLIENT_VERSION2}.${signatureOrHashString}`;
}
async function verifyChallenge2({
  // ChallengeData:
  challenge,
  session,
  shareHash,
  // Verification:
  solution,
  publicKey: publicKeyParam
}) {
  const solutionValue = solution.split(".")[1];
  if (!solutionValue) {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
  if (isAnonChallenge(challenge) || challenge.type === import_client4.ChallengeType.SIGNATURE) {
    if (!publicKeyParam) {
      return ErrorMessages.CHALLENGE_MISSING_PK;
    }
    const challengeRawData = await getChallengeRawData({
      challenge,
      session,
      shareHash
    });
    const challengeRawDataBuffer = Buffer.from(challengeRawData);
    const isSignatureValid = import_ed25519.ed25519.verify(
      Buffer.from(solutionValue, "base64"),
      challengeRawDataBuffer,
      // TODO: Make sure it is in the right encoding:
      Buffer.from(publicKeyParam, "base64")
    );
    if (!isSignatureValid) return ErrorMessages.CHALLENGE_INVALID;
  } else {
    return ErrorMessages.CHALLENGE_UNEXPECTED_ERROR;
  }
  return null;
}
var ChallengeClientV2 = {
  version: CHALLENGE_CLIENT_VERSION2,
  getChallengeRawData,
  solveChallenge: solveChallenge2,
  verifyChallenge: verifyChallenge2
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthProviderType,
  Chain,
  ChallengeClientV1,
  ChallengeClientV2,
  ErrorMessages,
  ExportType,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus,
  createSupabaseClient,
  createTRPCClient
});
//# sourceMappingURL=index.js.map