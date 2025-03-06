// sdk/index.ts
import {
  AuthProviderType,
  Chain,
  ExportType,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus
} from "@prisma/client";

// client/utils/trpc/trpc-client.utils.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
function createTRPCClient({
  baseURL,
  trpcURL,
  ...params
}) {
  let authToken = params.authToken || null;
  let deviceNonce = params.deviceNonce || "";
  let apiKey = params.apiKey || "";
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
  function getApiKeyHeader() {
    return apiKey;
  }
  function setApiKeyHeader(nextApiKey) {
    apiKey = nextApiKey;
  }
  const url = trpcURL || (baseURL ? `${baseURL}/api/trpc` : "");
  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");
  const client = createTRPCProxyClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url,
        headers() {
          if (!deviceNonce) {
            throw new Error(`Missing device nonce header.`);
          }
          if (!apiKey) {
            throw new Error(`Missing API key header.`);
          }
          return {
            authorization: `Bearer ${authToken}`,
            "x-device-nonce": deviceNonce,
            "x-api-key": apiKey
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
    getApiKeyHeader,
    setApiKeyHeader
  };
}

// client/utils/supabase/supabase-client.utils.ts
import { createClient } from "@supabase/supabase-js";
function createSupabaseClient(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "", supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) {
  return createClient(
    supabaseUrl,
    supabaseKey,
    supabaseOptions
  );
}

// server/utils/challenge/clients/challenge-client-v1.ts
import { ChallengePurpose, ChallengeType } from "@prisma/client";
var CHALLENGES_WITHOUT_SHARE_HASH = [
  ChallengePurpose.SHARE_ROTATION,
  ChallengePurpose.ACCOUNT_RECOVERY
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
  if (isAnonChallenge(challenge) || challenge.type === ChallengeType.SIGNATURE) {
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
export {
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
};
//# sourceMappingURL=index.mjs.map