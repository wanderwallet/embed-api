"use client"

import { getAuthToken, trpc } from "@/client/utils/trpc/trpc-client"
import { jwtDecode } from "jwt-decode";

export function ProtectedApiInteraction() {
  const { data, isLoading, error } = trpc.debugSession.useQuery()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{ error.message }</div>
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      {data && (
        <div className="bg-gray-100 p-4 rounded-md">
          <h3>JWT Token</h3>
          <pre>{JSON.stringify(jwtDecode(getAuthToken() || ""), null, "  ")}</pre>

          <h3>auth.users</h3>
          <pre>{JSON.stringify(data.user, null, "  ")}</pre>

          <h3>Session</h3>
          <pre>{JSON.stringify(data.session, null, "  ")}</pre>
        </div>
      )}
    </div>
  )
}

