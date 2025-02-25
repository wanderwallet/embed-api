import { useState, useEffect } from "react"
import { setAuthToken, trpc } from "@/client/utils/trpc/trpc-client-client"
import { supabase } from "@/client/utils/supabase/supabase-client-client"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("Session init =", session);

      const accessToken = session?.access_token ?? null;

      setToken(accessToken);
      setAuthToken(accessToken);
      setIsLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Session change =", session);

      const accessToken = session?.access_token ?? null;

      setToken(accessToken);
      setAuthToken(accessToken);
      setIsLoading(false)
    });

    return () => subscription.unsubscribe()
  }, [])

  const {
    data,
    isLoading: isUserLoading,
    error: userError,
  } = trpc.getUser.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  })

  return token ? {
    token,
    user: data?.user,
    isLoading: isLoading || isUserLoading,
    error: userError,
  } : {
    token: null,
    user: null,
    isLoading,
    error: null,
  }
}

