export interface Gateway {
  host: string;
  port: number;
  protocol: string;
}

/**
 * Well-known gateways
 */
export const suggestedGateways = [
  {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "ar-io.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "arweave.dev",
    port: 443,
    protocol: "https"
  },
  {
    host: "g8way.io",
    port: 443,
    protocol: "https"
  }
] as const satisfies Gateway[];

export const defaultGateway = suggestedGateways[0];
