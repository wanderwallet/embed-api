import { Session } from "@prisma/client";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { prisma } from "./utils/prisma/prisma-client";
import {  getClientIp, getIpInfo } from "./utils/ip/ip.utils";
import { parseAccessTokenAndHeaders } from "@/server/utils/session/session.utils";

function createEmptyContext() {
  return {
    prisma,
    user: null,
    session: createSessionObject(null),
  };
}

export async function createContext({ req }: { req: Request }) {
  const authHeader = req.headers.get("authorization");
  const clientId = req.headers.get("x-client-id");

  if (!authHeader || !clientId) {
    return createEmptyContext();
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) return createEmptyContext();

  const userAgent = req.headers.get("user-agent") || "";
  const deviceNonce = req.headers.get("x-device-nonce") || "";
  const supabase = await createServerClient(userAgent);

  // We retrieve the session to make sure we are not using a token from a logged out session.
  // See https://supabase.com/docs/guides/auth/sessions#how-do-i-make-sure-that-an-access-token-jwt-cannot-be-used-after-a-user-clicks-sign-out

  // The right method to use is `supabase.auth.getUser(token)`, not `supabase.auth.getSession`.
  // See https://supabase.com/docs/reference/javascript/auth-getuser

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    console.error("Error verifying session:", error);

    // Note that we don't throw an error from here as tRPC will not automatically send a reply to the user. Instead,
    // it is `protectedProcedure` who checks if `user` is set (it is not if there was an error), and send an
    // error back to the user.
    return createEmptyContext();
  }

  const user = data.user;

  let ip = getClientIp(req);

  if (process.env.NODE_ENV === "development") {
    const ipInfo = await getIpInfo();
    if (ipInfo) {
      ({ ip } = ipInfo);
    }
  }

  try {
    const session = parseAccessTokenAndHeaders(accessToken, {
      userAgent,
      deviceNonce,
      ip,
    });

    // TODO: Get `data.user.user_metadata.ipFilterSetting` and `data.user.user_metadata.countryFilterSetting` and
    // check if they are defined and, if so, if they pass.

    // Note we simply add `clientId` to the context. There's no need to resolve clientId => Application on every request.

    return {
      prisma,
      clientId,
      user,
      session,
    };
  } catch (error) {
    console.error("Error processing session:", error);
    return createEmptyContext();
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
