import type { inferAsyncReturnType } from "@trpc/server"
import { supabase } from "../lib/supabaseClient"
import type { NextRequest } from "next/server"

export async function createContext({ req }: { req: NextRequest }) {
  async function getUserFromHeader() {
    const authHeader = req.headers.get("authorization")
    if (authHeader) {
      const token = authHeader.split(" ")[1]
      if (token) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token)
        if (error) {
          console.error("Error verifying token:", error)
          return null
        }
        return user
      }
    }
    return null
  }

  const user = await getUserFromHeader()

  return {
    req,
    user,
    supabase,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

