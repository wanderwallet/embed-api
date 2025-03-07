"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/client/utils/trpc/trpc-client"
import { ProtectedApiInteraction } from "../../client/components/ProtectedApiInteraction"
import { useAuth } from "@/client/hooks/useAuth"
import { supabase } from "@/client/utils/supabase/supabase-client-client"

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const logoutMutation = trpc.logout.useMutation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/")
    }
  }, [isAuthLoading, user, router])

  const handleRefresh = async () => {
    await supabase.auth.refreshSession();
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      await logoutMutation.mutateAsync();
      await supabase.auth.signOut();
    } catch (error) {
      setIsLoading(false);

      console.error("Logout failed:", error)
    }
  }

  if (isAuthLoading || !user) return <div>Loading user data...</div>;
  if (isLoading) return <div>Signing out...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleRefresh}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Refresh Session
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
      </div>
      <p className="mb-4">Welcome, user with ID: {user.id}</p>
      <ProtectedApiInteraction />
    </div>
  )
}

