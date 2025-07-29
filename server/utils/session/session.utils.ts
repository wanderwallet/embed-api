
import { jwtDecode } from "jwt-decode";
import { prisma } from "../prisma/prisma-client";
import { Session } from "@prisma/client";
import { SupabaseJwtPayload, SupabaseJwtSessionHeaders } from "@/server/utils/session/session.types";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const SESSION_ANON_ID = "ANON";

export function createAnonSession(sessionHeaders: SupabaseJwtSessionHeaders): Session {
  const dateNow = new Date();

  return {
    id: SESSION_ANON_ID,
    createdAt: dateNow,
    updatedAt: dateNow,
    deviceNonce: sessionHeaders.deviceNonce,
    ip: sessionHeaders.ip,
    userAgent: sessionHeaders.userAgent,
    userId: "",
  };
}

export function parseAccessTokenAndHeaders(
  accessToken: string,
  sessionHeaders: SupabaseJwtSessionHeaders,
): Session {
  const decodedSession = jwtDecode<SupabaseJwtPayload>(accessToken);
  const { session_id: id, sub: userId, sessionData } = decodedSession;

  if (!userId) throw new Error("Missing `sub` (`userId`) in access token.");

  const sessionUpdates = Object.entries(sessionHeaders).reduce((updates, [key, value]) => {
    if (value && sessionData[key as keyof SupabaseJwtSessionHeaders] !== value) {
      updates[key as keyof SupabaseJwtSessionHeaders] = value;
    }

    return updates;
  }, {} as Partial<SupabaseJwtSessionHeaders>);

  if (Object.keys(sessionUpdates).length > 0) {
    // Note this is not awaited. It's not a mistake, as this runs in `context.ts` and we don't want all requests  to
    // wait some additional time for the session to update. Also, we don't care too much if this fails, so we just
    // log the error.

    prisma.session
      .update({
        where: { id },
        data: sessionUpdates,
      })
      .catch(async (error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          console.log("error.code =", error.code);
          console.log("error.name =", error.name);
        }

        console.error("Error updating session:", error, {
          sessionId: id,
          userId,
          ...sessionUpdates
        });
      });
  }

  return {
    id,
    createdAt: sessionData.createdAt,
    updatedAt: Object.keys(sessionUpdates).length > 0 ? new Date() : sessionData.updatedAt,
    deviceNonce: sessionHeaders.deviceNonce || sessionData.deviceNonce,
    ip: sessionHeaders.ip || sessionData.ip,
    userAgent: sessionHeaders.userAgent || sessionData.userAgent,
    userId,
  } satisfies Session;
}
