import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { type AppRouter } from '@/server/routers/_app';
import superjson from 'superjson';

// Helper function to get the base API URL
function getApiUrl() {
  if (typeof window !== "undefined") return "";

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

const apiUrl = getApiUrl();

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      // Add headers including authentication
      headers() {
        // Get auth token from localStorage if available
        const authToken = localStorage.getItem('authToken');
        const headers: Record<string, string> = {};
        
        // Set auth token if available
        if (authToken) {
          // First check if the isCustomAuth flag is set
          const isCustomAuth = localStorage.getItem('isCustomAuth') === 'true';
          
          // Then check if it looks like a JWT (has 3 parts separated by dots)
          const looksLikeJwt = authToken.includes('.') && authToken.split('.').length === 3;
          
          // For custom auth or anything that doesn't look like a JWT, use X-Custom-Auth
          if (isCustomAuth || !looksLikeJwt) {
            headers['X-Custom-Auth'] = authToken;
            console.log("Sending token as X-Custom-Auth");
          } else {
            // Only use Bearer for standard JWT tokens
            headers.Authorization = `Bearer ${authToken}`;
            console.log("Sending token as Bearer token");
          }
        }
        
        // Set session ID if available
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          headers['X-Session-ID'] = sessionId;
        }
        
        // Add device nonce if available
        const deviceNonce = localStorage.getItem('deviceNonce');
        if (deviceNonce) {
          headers['X-Device-Nonce'] = deviceNonce;
        }
        
        return headers;
      },
    }),
  ],
}); 