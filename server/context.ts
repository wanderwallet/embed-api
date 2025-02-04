import { inferAsyncReturnType } from "@trpc/server"
import { verifyJWT } from "./auth"
import { DeviceAndLocation, PrismaClient, Session } from "@prisma/client";

interface User {
  id: string;
}

export async function createContext({ req }: { req: Request }) {
  const prisma = new PrismaClient();

  // TODO: get user from db

  // TODO: We probably want to check the session in the DB either way to be able
  // to close sessions / invalidate JWTs. We can add an "invalidated" column to
  // sessions with an index.

  // TODO: See if we need our own sessions table or if we can add additional
  // columns to the default one.

  // See https://supabase.com/docs/guides/auth/sessions
  // See https://github.com/orgs/supabase/discussions/14708

  async function getUserFromHeader(): Promise<User | null> {
    if (req.headers.get("authorization")) {
      const token = req.headers.get("authorization")?.split("")[1]
      if (token) {
        try {
          const verified = await verifyJWT(token)
          return verified satisfies User;
        } catch {
          return null
        }
      }
    }
    return null
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

