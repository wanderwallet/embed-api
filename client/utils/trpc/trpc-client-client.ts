import { createTRPCNext } from "@trpc/next"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@/server/routers/_app"

function getBaseUrl() {
  if (typeof window !== "undefined")
    return ""

  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`

  return `http://localhost:${process.env.PORT ?? 3000}`
}

let token: string | null = null;;

export function getAuthToken() {
  return token;
}

export function setAuthToken(nextToken: string | null) {
  token = nextToken || null;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return token
              ? {
                  authorization: `Bearer ${token}`,
                }
              : {}
          },
        }),
      ],
    }
  },
  ssr: false,
});

export const trpcVanilla = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
