"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/utils/trpc"

// TODO: get rid of this page, this is just a test protected page

export default function ProtectedPage() {
  const router = useRouter()
  const { data, isLoading, error } = trpc.protectedRoute.useQuery()

  useEffect(() => {
    if (error) {
      router.push("/")
    }
  }, [error, router])

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Protected Page</h1>
      {data && <p>{data.message}</p>}
    </div>
  )
}

