"use client"

import { useState } from "react"
import { trpc } from "@/utils/trpc"

// TODO: just a test public page, could possible convert to a swagger docs
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = trpc.authenticate.useMutation({
    onSuccess: () => {
      setIsAuthenticated(true)
    },
  });

  const wallets = trpc.fetchWallets.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <div>
      <h1>Public Page</h1>

      { isAuthenticated ? (
        <pre>
          { JSON.stringify(wallets.data, null, "  ") }
        </pre>
      ) : (
        <button onClick={() => authenticate.mutate()}>Authenticate</button>
      ) }
    </div>
  )
}

