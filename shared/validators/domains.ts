import { z } from "zod";
import { TRPCError } from "@trpc/server";

export function getBaseDomain(url: string): string {
  try {
    let normalizedUrl = url;
    if (!url.includes("://")) {
      normalizedUrl = `http://${url}`;
    }
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    throw new Error(`Invalid domain format: ${url}`);
  }
}

export function areDomainsRelated(domain1: string, domain2: string): boolean {
  try {
    const base1 = getBaseDomain(domain1);
    const base2 = getBaseDomain(domain2);

    if (base1 === base2) return true;
    return base1.endsWith(`.${base2}`) || base2.endsWith(`.${base1}`);
  } catch {
    return false;
  }
}

export function validateDomains(domains: string[]): {
  valid: boolean;
  error?: string;
} {
  if (domains.length === 0) return { valid: true };

  try {
    const firstDomain = domains[0];
    const isValid = domains.every((domain) =>
      areDomainsRelated(firstDomain, domain)
    );

    return {
      valid: isValid,
      error: isValid
        ? undefined
        : "All domains must be subdomains or ports of the same base domain",
    };
  } catch {
    return {
      valid: false,
      error: "Invalid domain format provided",
    };
  }
}

// For backend TRPC validation
export const domainValidator = z
  .array(z.string().max(255))
  .superRefine((domains, ctx) => {
    const result = validateDomains(domains);

    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error!,
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: result.error!,
      });
    }
  });
