// Cache IP info for 5 minutes
let IP_CACHE = { ip: "", country: "", timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

export async function getIpInfo() {
  // Check cache first
  if (IP_CACHE.ip && Date.now() - IP_CACHE.timestamp < CACHE_TTL) {
    return IP_CACHE;
  }

  try {
    const response = await fetch(`https://ipinfo.io/json`, {
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) return null;

    const { ip, country } = await response.json();
    IP_CACHE = { ip, country, timestamp: Date.now() };
    return { ip, country };
  } catch {
    return null;
  }
}

export function getClientIp(req: Request): string {
  const headers = req.headers;

  return (
    headers.get("x-real-ip") || // Vercel, Nginx, some CDNs
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("cf-connecting-ip") || // Cloudflare
    "127.0.0.1" // Safe fallback
  );
}

export function getClientCountry(req: Request): string {
  const headers = req.headers;

  return (
    headers.get("x-vercel-ip-country") || // Vercel
    headers.get("cf-ipcountry") || // Cloudflare (most reliable)
    headers.get("x-country-code") || // Some other CDNs
    "unknown" // Ensure a value is always returned
  );
}
