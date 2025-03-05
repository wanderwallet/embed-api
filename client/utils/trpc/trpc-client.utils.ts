import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import superjson from "superjson";

export interface CreateTRPCClientOptions {
  baseURL?: string;
  trpcURL?: string;
  authToken?: string | null;
  deviceNonce?: string;
  clientId?: string;
  applicationId?: string;
}

export function createTRPCClient({
  baseURL,
  trpcURL,
  ...params
}: CreateTRPCClientOptions) {
  let authToken = params.authToken || null;
  let deviceNonce = params.deviceNonce || "";
  let clientId = params.clientId || "";
  let applicationId = params.applicationId || "";

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

  function getClientIdHeader() {
    return clientId;
  }

  function setClientIdHeader(nextClientId: string) {
    clientId = nextClientId;
  }

  function getApplicationIdHeader() {
    return applicationId;
  }

  function setApplicationIdHeader(nextApplicationId: string) {
    applicationId = nextApplicationId;
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
            throw new Error(`Missing device nonce header.`);
          }

          if (!clientId) {
            throw new Error(`Missing client ID header.`);
          }

          return {
            authorization: `Bearer ${authToken}`,
            "x-device-nonce": deviceNonce,
            "x-client-id": clientId,
            "x-application-id": applicationId,
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
    getClientIdHeader,
    setClientIdHeader,
    getApplicationIdHeader,
    setApplicationIdHeader,
  };
}
