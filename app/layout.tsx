"use client";

import { supabase } from "@/client/utils/supabase/supabase-client-client";
import "./globals.css";

import { trpc } from "@/client/utils/trpc/trpc-client";
import { useAuth } from "@/client/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/client/components/Header";
import { Toaster } from "sonner";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" richColors />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const logoutMutation = trpc.logout.useMutation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [isAuthLoading, user, router]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutMutation.mutateAsync();
      await supabase.auth.signOut();
      setIsLoading(false);
      router.push("/");
    } catch (error) {
      setIsLoading(false);
      console.error("Logout failed:", error);
    }
  };

  if (isAuthLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isLoading) {
    return <LoadingScreen message="Signing out..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={handleLogout} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default trpc.withTRPC(RootLayout);
