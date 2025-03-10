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
  AuthProviderType: () => import_client3.AuthProviderType,
  Chain: () => import_client3.Chain,
  ChallengeClientV1: () => ChallengeClientV1,
  ExportType: () => import_client3.ExportType,
  WalletPrivacySetting: () => import_client3.WalletPrivacySetting,
  WalletSourceFrom: () => import_client3.WalletSourceFrom,
  WalletSourceType: () => import_client3.WalletSourceType,
  WalletStatus: () => import_client3.WalletStatus,
  createSupabaseClient: () => createSupabaseClient,
  createTRPCClient: () => createTRPCClient
});
module.exports = __toCommonJS(index_exports);
var import_client3 = require("@prisma/client");

// client/utils/trpc/trpc-client.utils.ts
var import_client = require("@trpc/client");
var import_superjson = __toESM(require("superjson"));
function createTRPCClient({
  baseURL,
  trpcURL,
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
  const url = trpcURL || (baseURL ? `${baseURL}/api/trpc` : "");
  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");
  const client = (0, import_client.createTRPCProxyClient)({
    transformer: import_superjson.default,
    links: [
      (0, import_client.httpBatchLink)({
        url,
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
  return (0, import_supabase_js.createClient)(
    supabaseUrl,
    supabaseKey,
    supabaseOptions
  );
}

// server/utils/challenge/clients/challenge-client-v1.ts
var import_client2 = require("@prisma/client");
var CHALLENGES_WITHOUT_SHARE_HASH = [
  import_client2.ChallengePurpose.SHARE_ROTATION,
  import_client2.ChallengePurpose.ACCOUNT_RECOVERY
];
function isAnonChallenge(challenge) {
  return !!challenge.chain && !!challenge.address;
}
function getChallengeRawData({
  challenge,
  session,
  shareHash
}) {
  const commonChallengeData = [
    challenge.id,
    challenge.createdAt,
    challenge.value,
    challenge.version,
    session.id,
    session.ip,
    session.countryCode,
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
  jwk
}) {
  const challengeRawData = getChallengeRawData({ challenge, session, shareHash });
  const challengeRawDataBuffer = Buffer.from(challengeRawData);
  let signatureOrHashBuffer;
  if (isAnonChallenge(challenge) || challenge.type === import_client2.ChallengeType.SIGNATURE) {
    if (!jwk) {
      throw new Error("Missing `jwk` (JWK private key)");
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
  } else {
    signatureOrHashBuffer = await crypto.subtle.digest("SHA-256", challengeRawDataBuffer);
  }
  const signatureOrHashString = Buffer.from(signatureOrHashBuffer).toString("base64");
  return `${CHALLENGE_CLIENT_VERSION}.${signatureOrHashString}`;
}
var ChallengeClientV1 = {
  version: CHALLENGE_CLIENT_VERSION,
  importKeyAlgorithm: IMPORT_KEY_ALGORITHM,
  signAlgorithm: SIGN_ALGORITHM,
  getChallengeRawData,
  solveChallenge
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthProviderType,
  Chain,
  ChallengeClientV1,
  ExportType,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus,
  createSupabaseClient,
  createTRPCClient
});
//# sourceMappingURL=index.js.map