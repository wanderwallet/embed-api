import { useState, useEffect } from "react"
import { setAuthToken, trpc } from "@/client/utils/trpc/trpc-client"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/client/utils/supabase/supabase-client-client"

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [customAuthActive, setCustomAuthActive] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      // First check for passkey authentication
      const customSessionId = localStorage.getItem('sessionId');
      const customUserId = localStorage.getItem('userId');
      const customAuthToken = localStorage.getItem('authToken');
      const isCustomAuth = localStorage.getItem('isCustomAuth') === 'true';
      
      // Log what type of auth we're checking
      console.log("Checking auth state:", {
        hasCustomSessionId: !!customSessionId,
        hasCustomUserId: !!customUserId,
        hasAuthToken: !!customAuthToken,
        isCustomAuth
      });
      
      // Handle custom auth token (passkeys)
      if (isCustomAuth && customSessionId && customUserId && customAuthToken) {
        console.log("Found custom auth session", { customSessionId, hasToken: !!customAuthToken });
        
        // Verify the custom token looks valid (should be a base64 encoded JSON)
        try {
          // Attempt to parse the token (just as a validation check)
          const decodedToken = JSON.parse(atob(customAuthToken));
          if (!decodedToken.user_id || !decodedToken.session_id) {
            console.warn("Custom auth token is malformed, clearing auth state");
            localStorage.removeItem('authToken');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('userId');
            localStorage.removeItem('isCustomAuth');
            setToken(null);
            setAuthToken(null);
            setCustomAuthActive(false);
            setIsLoading(false);
            return;
          }
          
          // Token validates, use it
          setToken(customAuthToken);
          setAuthToken(customAuthToken);
          setCustomAuthActive(true);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse custom auth token, clearing auth state", e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('sessionId');
          localStorage.removeItem('userId');
          localStorage.removeItem('isCustomAuth');
          setToken(null);
          setAuthToken(null);
          setCustomAuthActive(false);
          setIsLoading(false);
          return;
        }
      }
      
      // If not custom auth, check standard Supabase session
      console.log("Checking standard Supabase session");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("Session init =", session ? {
          hasAccessToken: !!session.access_token,
          user: session.user ? { id: session.user.id } : null
        } : "No session");

        const accessToken = session?.access_token ?? null;
        
        if (accessToken) {
          // Also store in localStorage for consistency
          localStorage.setItem('authToken', accessToken);
          
          // Make sure custom auth flag is cleared
          localStorage.removeItem('isCustomAuth');
        }

        setToken(accessToken);
        setAuthToken(accessToken);
        setCustomAuthActive(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting session:", error);
        setToken(null);
        setAuthToken(null);
        setCustomAuthActive(false);
        setIsLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update if we're not using custom auth
      if (!customAuthActive) {
        console.log("Session change =", session);

        const accessToken = session?.access_token ?? null;

        setToken(accessToken);
        setAuthToken(accessToken);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [customAuthActive]);

  const {
    data,
    isLoading: isUserLoading,
    error: userError,
  } = trpc.getUser.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  // If using custom auth and no user data is available, construct a minimal user object
  const user: User | null = data?.user || (customAuthActive ? {
    id: localStorage.getItem('userId') || '',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User : null);

  return token ? {
    token,
    user,
    isLoading: isLoading || isUserLoading,
    error: userError,
  } : {
    token: null,
    user: null,
    isLoading,
    error: null,
  }
}

