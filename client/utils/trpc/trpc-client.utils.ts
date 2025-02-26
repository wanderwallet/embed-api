import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/routers/_app"

export interface CreateTRPCClientOptions {
  baseURL?: string;
  trpcURL?: string;
}

export function createTRPCClient({
  baseURL,
  trpcURL,
}: CreateTRPCClientOptions) {
  let authToken: string | null = null;
  let deviceNonce = "";

  function getAuthToken() {
    return authToken;
  }

  function setAuthToken(nextAuthToken: string | null) {
    authToken = nextAuthToken || null;
  }

  function getDeviceNonce() {
    return deviceNonce;
  }

  function setDeviceNonce(nextDeviceNonce: string) {
    deviceNonce = nextDeviceNonce;
  }

  const url = trpcURL || (baseURL ? `${baseURL}/api/trpc` : "");

  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");

  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        headers() {
          return authToken
            ? {
                authorization: `Bearer ${authToken}`,
                "x-device-nonce": deviceNonce || "",
              }
            : {}
        },
      }),
    ],
  });

  return {
    client,
    getAuthToken,
    setAuthToken,
    getDeviceNonce,
    setDeviceNonce,
  };
}
