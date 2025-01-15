"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/utils/trpc"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const authenticate = trpc.authenticate.useMutation({
    onSuccess: () => {
      setIsAuthenticated(true)
      router.push("/protected")
    },
  })

  return (
    <div>
      <h1>Public Page</h1>
      {!isAuthenticated && (
        <button onClick={() => authenticate.mutate()}>Authenticate</button>
      )}
    </div>
  )
}

