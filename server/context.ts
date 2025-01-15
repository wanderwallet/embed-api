import { inferAsyncReturnType } from "@trpc/server"
import { verifyJWT } from "./auth"

export async function createContext({ req }: { req: Request }) {
  // TODO: get user from db
  async function getUserFromHeader() {
    if (req.headers.get("authorization")) {
      const token = req.headers.get("authorization")?.split("")[1]
      if (token) {
        try {
          const verified = await verifyJWT(token)
          return verified
        } catch {
          return null
        }
      }
    }
    return null
  }

  const user = await getUserFromHeader()

  return {
    user,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

