import { createTRPCClient as _createTRPCClient, httpBatchLink, TRPCLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import superjson from "superjson";
import { observable } from "@trpc/server/observable";

export interface CreateTRPCClientOptions {
  baseURL?: string;
  trpcURL?: string;
  authToken?: string | null;
  deviceNonce?: string;
  clientId?: string;
  applicationId?: string;
  onAuthError?: () => void;
}

interface AuthLinkOptions {
  /**
   * Callback function to handle authentication errors
   */
  onAuthError?: () => void | Promise<void>;
  /**
   * Function to get the current auth token
   */
  getAuthTokenHeader: () => string | null;
  /**
   * Function to set the auth token
   */
  setAuthTokenHeader: (token: string | null) => void;
}

export const authErrorLink = <TRouter extends AppRouter = AppRouter>(
  opts: AuthLinkOptions
): TRPCLink<TRouter> => {
  return () => {
    return ({ next, op }) => {
      return observable((observer) => {
        const unsubscribe = next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          async error(err) {
            if (err.data?.code === "UNAUTHORIZED") {
              console.warn("🚫 Unauthorized access detected:", {
                path: op.path,
                type: op.type,
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
          },
        });

        return unsubscribe;
      });
    };
  };
};

export function createTRPCClient({
  baseURL,
  trpcURL,
  onAuthError,
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

  const url = trpcURL || (baseURL ? `${baseURL.replace(/\/$/, "")}/api/trpc` : "");

  if (!url) throw new Error("No `baseURL` or `trpcURL` provided.");

  const client = _createTRPCClient<AppRouter>({
    links: [
      authErrorLink({
        onAuthError,
        getAuthTokenHeader,
        setAuthTokenHeader,
      }),
      httpBatchLink({
        url,
        transformer: superjson,
        headers() {
          if (!deviceNonce) {
            throw new Error(`Missing device nonce header.`);
          }

          if (!clientId) {
            throw new Error(`Missing client ID header.`);
          }

          return {
            authorization: authToken ? `Bearer ${authToken}` : undefined,
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
