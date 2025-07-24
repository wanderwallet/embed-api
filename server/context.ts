import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { prisma } from "./utils/prisma/prisma-client";
import {  getClientIp, getIpInfo } from "./utils/ip/ip.utils";
import { createAnonSession, parseAccessTokenAndHeaders } from "@/server/utils/session/session.utils";
import { User } from "@supabase/supabase-js";
import { SupabaseJwtSessionHeaders } from "@/server/utils/session/session.types";

function createAnonContext(sessionHeaders: SupabaseJwtSessionHeaders) {
  // We force the types here so that we don't get an error when accessing ctx.user inside the different
  // procedures. `protectedProcedure` takes care of returning an error if `ctx.user` is null for those procedures that
  // require it.

  // The session, however, is populated with some data, as `publicProcedure`s might still want to access properties such
  // as `deviceNonce`, `ip` or `userAgent`.

  return {
    prisma,
    clientId: null,
    user: null as unknown as User,
    session: createAnonSession(sessionHeaders),
  };
}

export async function createContext({ req }: { req: Request }) {
  const accessToken = (req.headers.get("authorization") || "").split(" ")[1];
  const userAgent = req.headers.get("user-agent") || "";
  const deviceNonce = req.headers.get("x-device-nonce") || "";
  const clientId = req.headers.get("x-client-id");

  let ip = getClientIp(req);

  if (process.env.NODE_ENV === "development") {
    const ipInfo = await getIpInfo();

    if (!ip && ipInfo?.ip) ip = ipInfo.ip;
  }

  const sessionHeaders: SupabaseJwtSessionHeaders = {
    userAgent,
    deviceNonce,
    ip,
  };

  if (!accessToken || !clientId) {
    return createAnonContext(sessionHeaders);
  }

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
    return createAnonContext(sessionHeaders);
  }

  const user = data.user;

  try {
    const session = parseAccessTokenAndHeaders(accessToken, sessionHeaders);

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

    // Note that we don't throw an error from here as tRPC will not automatically send a reply to the user. Instead,
    // it is `protectedProcedure` who checks if `user` is set (it is not if there was an error), and send an
    // error back to the user.
    return createAnonContext(sessionHeaders);
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
