import { inferAsyncReturnType } from "@trpc/server"
import { PrismaClient, Session } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
}

export async function createContext({ req }: { req: Request }) {
  const prisma = new PrismaClient();

  // TODO: There's no need to load the User from the DB but at least we need to load its `jwkSecret` to be able to
  // verify JWTs with different keys for each user. Also, there are some fields we are currently not using:
  // `User.ipFilterSetting`, `USer.countryFilterSetting`...
  //
  // If a JWT is invalid, we might want to mark its corresponding `Session` as `INVALIDATED`
  //
  // Also see if we need our own sessions table or if we can add additional columns to the default one:
  //
  // - See https://supabase.com/docs/guides/auth/sessions
  // - See https://github.com/orgs/supabase/discussions/14708

  async function getUserFromHeader(): Promise<User | null> {
    const authHeader = req.headers.get("authorization");

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      if (token) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token)

        if (error) {
          console.error("Error verifying token:", error)
        }

        return user;
      }
    }

    return null;
  }

  const user = await getUserFromHeader();

  // TODO: Lazily update session...

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

