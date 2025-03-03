import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/routers/_app"
import superjson from 'superjson';

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

  const url = trpcURL || (baseURL ? `${baseURL}/api/trpc` : "");

  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");

  const client = createTRPCProxyClient<AppRouter>({
    transformer: superjson,
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
    getAuthTokenHeader,
    setAuthTokenHeader,
    getDeviceNonceHeader,
    setDeviceNonceHeader,
  };
}
