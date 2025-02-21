import { inferAsyncReturnType, TRPCError } from "@trpc/server"
import { PrismaClient, Session } from "@prisma/client";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import type { User } from "@supabase/supabase-js";

export async function createContext({ req }: { req: Request }) {
  const prisma = new PrismaClient();
  const authHeader = req.headers.get("authorization");

  let user: User | null = null;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (token) {
      const supabase = await createServerClient();

      // We should be retrieving the session we make sure we are not used a token from a logged out session.
      // See https://supabase.com/docs/guides/auth/sessions#how-do-i-make-sure-that-an-access-token-jwt-cannot-be-used-after-a-user-clicks-sign-out

      // The right method to use is `supabase.auth.getUser(token)`, not `supabase.auth.getSession`.
      // See https://supabase.com/docs/reference/javascript/auth-getuser

      const {
        data,
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.error("Error verifying session:", error);

        // Note that we don't throw an error from here as tRPC will not automatically send a reply to the user. Instead,
        // the it is `protectedProcedure` who checks if `user` is set (it is not if there was an error), and send an
        // error back to the user.
      } else {
        user = data.user;

        // TODO: Doesn't seem to work with tRPC:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const ip = (req as any).connection?.remoteAddress;
        // console.log("IP =", ip);

        // TODO: Get `data.user.user_metadata.ipFilterSetting` and `data.user.user_metadata.countryFilterSetting` and
        // check if they are defined and, if so, if they pass.
      }
    }
  }

  // TODO: Check if we need our own `Session` table as Supabase already has `auth.sessions`. However, note that there
  // are currently some issues with it:
  //
  // - How do we retrieve them to show them to the user? We probably need to use triggers too.
  //   See https://www.reddit.com/r/Supabase/comments/srebfg/is_it_possible_to_query_the_auth_database_server/
  // - user_agent says Node rather then the actual user agent. Can that be fixed?
  // - Can we add custom columns (e.g. `deviceNonce`, `countryCode`).
  // - How do we link them to `Applications`?
  //
  // Note the following data is used for challenge validation:
  //
  // - session.id,
  // - session.ip,
  // - session.countryCode,
  // - session.deviceNonce,
  // - session.userAgent,

  const session: Session = {
    id: "",
    providerSessionId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    deviceNonce: "",
    ip: "",
    countryCode: "",
    userAgent: "",
    userId: "",
    // TODO: This should be an array:
    // applicationId: "",
  }

  return {
    prisma,
    user,
    session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>

