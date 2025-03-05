import { Application } from "@prisma/client";
import { prisma } from "../prisma/prisma-client";

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
  applicationId: string,
  clientId: string,
  origin: string,
  sessionId?: string
): Promise<{
  application: Pick<Application, "id" | "domains"> | null;
  valid: boolean;
}> {
  try {
    // Get clientId with a single query
    const clientIdRecord = await prisma.clientId.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        expiresAt: true,
        applicationId: true,
        application: { select: { id: true, domains: true } },
      },
    });

    // Validate clientId
    if (
      !clientIdRecord ||
      (clientIdRecord.expiresAt && clientIdRecord.expiresAt < new Date())
    ) {
      console.error("Invalid or expired clientId");
      return { application: null, valid: false };
    }

    // Check application binding
    if (clientIdRecord.applicationId !== applicationId) {
      console.error("clientId is not valid for this application");
      return { application: null, valid: false };
    }

    const application = clientIdRecord.application;

    if (!application) {
      console.error("Application not found or not associated with the team");
      return { application: null, valid: false };
    }

    // Domain validation
    if (application.domains.length > 0) {
      const requestDomain = extractDomain(origin);
      if (
        !requestDomain ||
        !isDomainAllowed(requestDomain, application.domains)
      ) {
        console.error(
          `Request domain ${requestDomain} not allowed for this application`
        );
        return { application: null, valid: false };
      }
    }

    if (sessionId) {
      await prisma.applicationSession
        .upsert({
          where: {
            applicationId_sessionId: {
              applicationId,
              sessionId,
            },
          },
          create: {
            applicationId,
            sessionId,
          },
          update: {},
        })
        .catch((error) =>
          console.error("Error linking session to application:", error)
        );
    }

    return { application, valid: true };
  } catch (error) {
    console.error("Error validating clientId or application:", error);
    return { application: null, valid: false };
  }
}
