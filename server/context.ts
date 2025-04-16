import { inferAsyncReturnType } from "@trpc/server";
import { Session } from "@prisma/client";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { jwtDecode } from "jwt-decode";
import { basePrisma, createAuthenticatedPrismaClient } from "./utils/prisma/prisma-client";
import {
  getClientIp,
  getIpInfo,
} from "./utils/ip/ip.utils";
import { PrismaClient } from "@prisma/client";

export async function createContext({ req }: { req: Request }) {
  const authHeader = req.headers.get("authorization");
  const clientId = req.headers.get("x-client-id");
  const applicationId = req.headers.get("x-application-id") || "";

  // Default to using unauthenticated prisma client
  let prisma = basePrisma;
  
  if (!authHeader || !clientId) {
    return createEmptyContext();
  }

  const token = authHeader.split(" ")[1];
  if (!token) return createEmptyContext();

  const userAgent = req.headers.get("user-agent") || "";
  const deviceNonce = req.headers.get("x-device-nonce") || "";
  const supabase = await createServerClient(userAgent);

  // We should be retrieving the session to make sure we are not using a token from a logged out session.
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
  
  // Create an authenticated Prisma client with the user's JWT token
  // Pass 'authenticated' role to activate RLS policies
  // This will pass the user.id as the sub claim which is what RLS policies check
  prisma = createAuthenticatedPrismaClient(user.id, 'authenticated') as typeof basePrisma;
  
  let ip = getClientIp(req);

  if (process.env.NODE_ENV === "development") {
    const ipInfo = await getIpInfo();
    if (ipInfo) {
      ({ ip } = ipInfo);
    }
  }

  try {
    const sessionData = await getAndUpdateSession(token, {
      userAgent,
      deviceNonce,
      ip,
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

async function getAndUpdateSession(
  token: string,
  updates: Pick<Session, "userAgent" | "deviceNonce" | "ip">
): Promise<Session> {
  const { sub: userId, session_id: sessionId, sessionData } = decodeJwt(token);

  const sessionUpdates: Partial<typeof updates> = {};
  for (const [key, value] of Object.entries(updates) as [
    keyof typeof updates,
    string
  ][]) {
    if (value && sessionData?.[key] !== value) {
      sessionUpdates[key] = value;
    }
  }

  if (Object.keys(sessionUpdates).length > 0) {
    console.log("Updating session:", sessionUpdates);

    // Use the secure database function with SECURITY DEFINER
    try {
      // PgBouncer in transaction mode requires special handling
      const authPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.POSTGRES_PRISMA_URL,
          },
        },
      });
      
      // Call the upsert_session function using a simpler query format
      // This works better with PgBouncer
      await authPrisma.$executeRawUnsafe(`
        SELECT public.upsert_session(
          '${sessionId}'::uuid, 
          '${userId}'::uuid, 
          '${updates.deviceNonce || ''}', 
          '${updates.ip || ''}', 
          '${updates.userAgent || ''}'
        )
      `);
      
      await authPrisma.$disconnect();
    } catch (error) {
      console.error("Error updating session:", error);
      // Continue without failing - we'll still return a valid session object
    }
  }

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
    prisma: basePrisma, // Use base prisma client for unauthenticated requests
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
  // - session.deviceNonce,
  // - session.userAgent,

  return {
    id: sessionData?.id || "",
    createdAt: sessionData?.createdAt || new Date(),
    updatedAt: sessionData?.updatedAt || new Date(),
    deviceNonce: sessionData?.deviceNonce || "",
    ip: sessionData?.ip || "",
    userAgent: sessionData?.userAgent || "",
    userId: sessionData?.userId || "",
    applicationId: applicationId || "",
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
