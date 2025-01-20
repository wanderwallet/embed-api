"use client"
import { trpc } from "@/services/trpc"

export function ProtectedApiInteraction() {
  const { data, isLoading } = trpc.protectedRoute.useQuery()

  if(isLoading){
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      {data && (
        <div className="bg-gray-100 p-4 rounded-md">
          <pre>{JSON.stringify(data)}</pre>
        </div>
      )}
    </div>
  )
}

