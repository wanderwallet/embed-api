"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/services/trpc"
import { ProtectedApiInteraction } from "../../components/ProtectedApiInteraction"

export default function DashboardPage() {
  const router = useRouter()
  const { data: userData, isLoading: userLoading } = trpc.getUser.useQuery()
  const logoutMutation = trpc.logout.useMutation()

  useEffect(() => {
    if (!userLoading && !userData) {
      router.push("/")
    }
  }, [userData, userLoading, router])

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      localStorage.removeItem("supabase.auth.token")
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (userLoading) return <div>Loading user data...</div>
  if (!userData) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Logout
        </button>
      </div>
      <p className="mb-4">Welcome, user with ID: {userData.user && userData.user.id}</p>
      <ProtectedApiInteraction />
    </div>
  )
}

