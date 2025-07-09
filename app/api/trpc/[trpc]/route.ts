import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/routers/_app"
import { createContext } from "@/server/context"
import type { NextRequest } from "next/server"
import { ZodError } from "zod"

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError: ({ type, path, error, input }) => {
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ ${ type } error on ${ path || "?" }: ${error.message}`, input);
      } else if (error.code === "BAD_REQUEST" && error.cause instanceof ZodError) {
        console.error(`${ type } error on ${ path || "?" }: ${error.message}`);
      }
    }
  });

  // TODO: Remove if CORS headers not needed (or transfer to a separate config file)
  // response.headers.append("Access-Control-Allow-Origin", "*")
  // response.headers.append("Access-Control-Request-Method", "*")
  // response.headers.append("Access-Control-Allow-Methods", "OPTIONS, GET, POST")
  // response.headers.append("Access-Control-Allow-Headers", "*")

  return response;
}

export { handler as GET, handler as POST };

