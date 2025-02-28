import { inferAsyncReturnType } from "@trpc/server";
import { Application, Session } from "@prisma/client";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { jwtDecode } from "jwt-decode";
import { prisma } from "./utils/prisma/prisma-client";
import {
  getClientCountryCode,
  getClientIp,
  getIpInfo,
} from "./utils/ip/ip.utils";

export async function createContext({ req }: { req: Request }) {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");
  const applicationId = req.headers.get("x-application-id");
  const origin = req.headers.get("origin") || req.headers.get("referer");

  if (!authHeader || !apiKey || !applicationId) {
    return createEmptyContext();
  }

  const token = authHeader.split(" ")[1];
  if (!token) return createEmptyContext();

  // Validate API key and application
  const { valid } = await validateApiKeyAndApplication(
    apiKey,
    applicationId,
    origin
  );

  if (!valid) {
    return createEmptyContext();
  }

  const userAgent = req.headers.get("user-agent") || "";
  const deviceNonce = req.headers.get("x-device-nonce") || "";
  const supabase = await createServerClient(userAgent);

  // We should be retrieving the session we make sure we are not used a token from a logged out session.
  // See https://supabase.com/docs/guides/auth/sessions#how-do-i-make-sure-that-an-access-token-jwt-cannot-be-used-after-a-user-clicks-sign-out

  // The right method to use is `supabase.auth.getUser(token)`, not `supabase.auth.getSession`.
  // See https://supabase.com/docs/reference/javascript/auth-getuser

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("Error verifying session:", error);

    // Note that we don't throw an error from here as tRPC will not automatically send a reply to the user. Instead,
    // the it is `protectedProcedure` who checks if `user` is set (it is not if there was an error), and send an
    // error back to the user.
    return createEmptyContext();
  }

  const user = data.user;
  let ip = getClientIp(req);
  let countryCode = getClientCountryCode(req);

  if (process.env.NODE_ENV === "development") {
    const ipInfo = await getIpInfo();
    if (ipInfo) {
      ({ ip, countryCode } = ipInfo);
    }
  }

  try {
    const sessionData = await getAndUpdateSession(token, applicationId, {
      userAgent,
      deviceNonce,
      ip,
      countryCode,
    });

    // TODO: Get `data.user.user_metadata.ipFilterSetting` and `data.user.user_metadata.countryFilterSetting` and
    // check if they are defined and, if so, if they pass.

    return {
      prisma,
      user,
      session: createSessionObject(sessionData, applicationId),
    };
  } catch (error) {
    console.error("Error processing session:", error);
    return createEmptyContext();
  }
}

async function validateApiKeyAndApplication(
  apiKey: string,
  applicationId: string,
  origin: string | null
): Promise<{
  application: Pick<Application, "id" | "domains"> | null;
  teamId: string | null;
  valid: boolean;
}> {
  try {
    // Get API key with a single query
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        id: true,
        expiresAt: true,
        applicationId: true,
        teamId: true,
        application: { select: { id: true, domains: true } },
      },
    });

    // Validate API key
    if (
      !apiKeyRecord ||
      (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date())
    ) {
      console.error("Invalid or expired API key");
      return { application: null, teamId: null, valid: false };
    }

    // Check application binding
    if (
      apiKeyRecord.applicationId &&
      apiKeyRecord.applicationId !== applicationId
    ) {
      console.error("API key is not valid for this application");
      return { application: null, teamId: null, valid: false };
    }

    const teamId = apiKeyRecord.teamId;

    // Update last used timestamp asynchronously (don't await)
    // prisma.apiKey
    //   .update({
    //     where: { id: apiKeyRecord.id },
    //     data: { lastUsedAt: new Date() },
    //   })
    //   .catch((error) => console.error("Error updating API key usage:", error));

    // Get application
    const application = apiKeyRecord.applicationId
      ? apiKeyRecord.application
      : await prisma.application.findFirst({
          where: { id: applicationId, teamId },
        });

    if (!application) {
      console.error("Application not found or not associated with the team");
      return { application: null, teamId: null, valid: false };
    }

    // Domain validation
    if (application.domains.length > 0) {
      const requestDomain = extractDomain(origin);

      if (!requestDomain) {
        console.warn(
          "No origin or referer header provided for domain validation"
        );
        return { application: null, teamId: null, valid: false };
      }

      if (!isDomainAllowed(requestDomain, application.domains)) {
        console.error(
          `Request domain ${requestDomain} not allowed for this application`
        );
        return { application: null, teamId: null, valid: false };
      }
    }

    return { application, teamId, valid: true };
  } catch (error) {
    console.error("Error validating API key or application:", error);
    return { application: null, teamId: null, valid: false };
  }
}

function extractDomain(origin: string | null): string | null {
  if (origin) {
    try {
      return new URL(origin).host;
    } catch {
      // Invalid origin, continue to referer
    }
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

async function getAndUpdateSession(
  token: string,
  applicationId: string,
  updates: Pick<Session, "userAgent" | "deviceNonce" | "ip" | "countryCode">
): Promise<Session> {
  const { sub: userId, session_id: sessionId, sessionData } = decodeJwt(token);

  const sessionUpdates: Partial<typeof updates> = {};
  for (const [key, value] of Object.entries(updates) as [
    keyof typeof updates,
    string
  ][]) {
    if (value && sessionData[key] !== value) {
      sessionUpdates[key] = value;
    }
  }

  if (Object.keys(sessionUpdates).length > 0) {
    console.log("Updating session:", sessionUpdates);
    prisma.session
      .update({
        where: { id: sessionId },
        data: sessionUpdates,
      })
      .catch((error) => console.error("Error updating session:", error));
  }

  // Link the session to the application if not already linked
  prisma.application
    .update({
      where: { id: applicationId },
      data: {
        Session: {
          connect: { id: sessionId },
        },
      },
    })
    .catch((error) =>
      console.error("Error linking session to application:", error)
    );

  return {
    userId,
    id: sessionId,
    ...sessionData,
    ...sessionUpdates,
  } satisfies Session;
}

function decodeJwt(token: string) {
  return jwtDecode(token) as {
    sub: string;
    session_id: string;
    sessionData: Omit<Session, "id" | "userId">;
  };
}

function createEmptyContext() {
  return {
    prisma,
    user: null,
    session: createSessionObject(null),
  };
}

function createSessionObject(
  sessionData: Session | null,
  applicationId?: string
): Session & { applicationId: string } {
  // TODO: How to link `Session` to `Applications`?
  // Note the following data is used for challenge validation:
  //
  // - session.id,
  // - session.ip,
  // - session.countryCode,
  // - session.deviceNonce,
  // - session.userAgent,

  return {
    id: sessionData?.id || "",
    createdAt: sessionData?.createdAt || new Date(),
    updatedAt: sessionData?.updatedAt || new Date(),
    deviceNonce: sessionData?.deviceNonce || "",
    ip: sessionData?.ip || "",
    countryCode: sessionData?.countryCode || "",
    userAgent: sessionData?.userAgent || "",
    userId: sessionData?.userId || "",
    applicationId: applicationId || "",
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
