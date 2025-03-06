"use client";

import { useState, useEffect } from "react";
import { setAuthToken, trpc } from "@/client/utils/trpc/trpc-client";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/client/utils/supabase/supabase-client-client";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext, AuthContextType } from "../hooks/useAuth";
import { Toaster } from "sonner";

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token ?? null;

      setToken(accessToken);
      setAuthToken(accessToken);
      setIsLoading(false);

      if (!session && pathname !== "/") {
        router.replace("/");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token ?? null;

      setToken(accessToken);
      setAuthToken(accessToken);
      setIsLoading(false);

      if (!session && pathname !== "/") {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  const {
    data,
    isLoading: isUserLoading,
    error: userError,
  } = trpc.getUser.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  const user: User | null = data?.user || null;

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/") {
      router.replace("/");
    }
  }, [isLoading, user, router, pathname]);

  const value = token
    ? {
        token,
        user,
        isLoading: isLoading || isUserLoading,
        error: userError,
      }
    : {
        token: null,
        user: null,
        isLoading,
        error: null,
      };

  return (
    <AuthContext.Provider value={value as AuthContextType}>
      <Toaster position="top-right" richColors />
      {children}
    </AuthContext.Provider>
  );
};

export default trpc.withTRPC(AuthProvider);
