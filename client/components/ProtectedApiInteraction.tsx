"use client"

import { trpc } from "@/client/utils/trpc/trpc-client-client"

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
          <pre>{JSON.stringify(data, null, "  ")}</pre>
        </div>
      )}
    </div>
  )
}

