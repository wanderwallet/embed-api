// Cache IP info for 5 minutes
let IP_CACHE = { ip: "", timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

// IPv4 validation regex
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Helper function to validate IPv4
const isValidIPv4 = (ip: string): boolean => ipv4Regex.test(ip.trim());

/**
 * Fetch IPv4 address from multiple sources with fallback
 * @returns Promise resolving to the validated IPv4 address string
 * @throws Error if no valid IPv4 address could be retrieved
 */
export async function getIPAddress(): Promise<string> {
  const sources = [
    {
      url: "https://ipv4.icanhazip.com/",
      extract: async (response: Response) => (await response.text()).trim(),
    },
    {
      url: "https://1.0.0.1/cdn-cgi/trace",
      extract: async (response: Response) => {
        const data = await response.text();
        const match = data.match(/ip=([^\n]+)/);
        return match?.[1]?.trim() ?? "";
      },
    },
    {
      url: "https://ipinfo.io/json",
      extract: async (response: Response) => {
        const data = await response.json();
        return data.ip;
      },
    },
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) continue;

      const ip = await source.extract(response);
      if (isValidIPv4(ip)) {
        return ip;
      }
    } catch (error) {
      console.error(`IP lookup failed for ${source.url}:`, error);
      continue;
    }
  }

  throw new Error("Could not retrieve a valid IPv4 address from any source");
}

export async function getIpInfo() {
  // Check cache first
  if (IP_CACHE.ip && Date.now() - IP_CACHE.timestamp < CACHE_TTL) {
    return IP_CACHE;
  }

  try {
    const ip = await getIPAddress();
    if (!ip) return null;

    IP_CACHE = { ip, timestamp: Date.now() };
    return { ip };
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

export function getClientCountryCode(req: Request): string {
  const headers = req.headers;

  return (
    headers.get("x-vercel-ip-country") || // Vercel
    headers.get("cf-ipcountry") || // Cloudflare (most reliable)
    headers.get("x-country-code") || // Some other CDNs
    "unknown" // Ensure a value is always returned
  );
}
