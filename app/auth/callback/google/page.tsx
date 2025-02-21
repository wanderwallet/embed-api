"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../client/utils/supabase/supabase-client-client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error during auth callback:", error)
        router.push("/login?error=Unable to authenticate")
      } else if (data.session) {
        router.push("/dashboard")
      } else {
        router.push("/login?error=No session found")
      }
    }

    handleAuthCallback()
  }, [router])

  return <div>Processing authentication...</div>
}

