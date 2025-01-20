import { useState, useEffect } from "react"
import { trpc } from "@/services/trpc"
import { supabase } from "@/lib/supabaseClient"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setToken(session.access_token)
      }
      setIsLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { data: user, error } = trpc.getUser.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  })

  return {
    user,
    isLoading,
    error,
    token,
  }
}

