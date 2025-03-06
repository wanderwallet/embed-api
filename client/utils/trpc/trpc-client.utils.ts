import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/routers/_app"
import superjson from 'superjson';

export interface CreateTRPCClientOptions {
  baseURL?: string;
  trpcURL?: string;
  authToken?: string | null;
  deviceNonce?: string;
  apiKey?: string;
}

export function createTRPCClient({
  baseURL,
  trpcURL,
  ...params
}: CreateTRPCClientOptions) {
  let authToken = params.authToken || null;
  let deviceNonce = params.deviceNonce || "";
  let apiKey = params.apiKey || "";

  function getAuthTokenHeader() {
    return authToken;
  }

  function setAuthTokenHeader(nextAuthToken: string | null) {
    authToken = nextAuthToken || null;
  }

  function getDeviceNonceHeader() {
    return deviceNonce;
  }

  function setDeviceNonceHeader(nextDeviceNonce: string) {
    deviceNonce = nextDeviceNonce;
  }

  function getApiKeyHeader() {
    return apiKey;
  }

  function setApiKeyHeader(nextApiKey: string) {
    apiKey = nextApiKey;
  }

  const url = trpcURL || (baseURL ? `${baseURL}/api/trpc` : "");

  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");

  const client = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url,
        headers() {
          if (!deviceNonce) {
            throw new Error(`Missing device nonce header.`)
          }

          if (!apiKey) {
            throw new Error(`Missing API key header.`)
          }

          return {
            authorization: authToken ? `Bearer ${authToken}` : undefined,
            "x-device-nonce": deviceNonce,
            "x-api-key": apiKey,
          };
        },
      }),
    ],
  });

  return {
    client,
    getAuthTokenHeader,
    setAuthTokenHeader,
    getDeviceNonceHeader,
    setDeviceNonceHeader,
    getApiKeyHeader,
    setApiKeyHeader,
  };
}
