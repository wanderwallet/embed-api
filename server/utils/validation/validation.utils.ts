import { prisma } from "../prisma/prisma-client";
import { TRPCError } from "@trpc/server";

function extractDomain(origin: string | null): string | null {
  if (origin) {
    try {
      return new URL(origin).host;
    } catch {}
  }

  return null;
}

function isDomainAllowed(
  requestDomain: string,
  allowedDomains: string[]
): boolean {
  return allowedDomains.some((domain) => {
    // Exact match
    if (requestDomain === domain) {
      return true;
    }

    // Subdomain match
    const domainToCheck = domain.startsWith(".") ? domain : `.${domain}`;
    return requestDomain.endsWith(domainToCheck);
  });
}

export async function validateApplication(
  clientId: string,
  origin: string,
  sessionId?: string
): Promise<string> {
  try {
    const application = await prisma.application
      .findUnique({
        where: { clientId },
        select: {
          id: true,
          domains: true,
        },
      })
      .catch(() => null);

    if (!application) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Application not found. Please verify your clientId.`,
      });
    }

    // Domain validation
    if (application.domains.length > 0) {
      const requestDomain = extractDomain(origin);
      if (!requestDomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid origin URL provided: ${origin}`,
        });
      }

      if (!isDomainAllowed(requestDomain, application.domains)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Domain '${requestDomain}' is not allowed. Allowed domains are: ${application.domains.join(
            ", "
          )}`,
        });
      }
    }

    if (sessionId) {
      await prisma.applicationSession
        .upsert({
          where: {
            applicationId_sessionId: {
              applicationId: application.id,
              sessionId,
            },
          },
          create: {
            applicationId: application.id,
            sessionId,
          },
          update: {},
        })
        .catch((error) => {
          console.error("Error linking session to application:", error);
        });
    }

    return application.id;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error("Error validating application:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `An unexpected error occurred while validating the application. Error: ${
        (error as Error).message
      }`,
    });
  }
}
