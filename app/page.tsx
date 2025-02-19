"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/services/trpc"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem("supabase.auth.token", session.access_token);

        router.push("/dashboard");
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      const { url } = await loginMutation.mutateAsync({ authProviderType: "GOOGLE" });

      if (url) {
        // Redirect to Google's OAuth page
        window.location.href = url
      } else {
        console.error("No URL returned from authenticate")
      }
    } catch (error) {
      console.error("Google sign-in failed:", error)
    }
  }

  if (isAuthLoading) return <div>Loading...</div>
  if (user) return null // This will redirect to dashboard

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Our App</h1>

      <button
        onClick={handleGoogleSignIn}
        disabled={loginMutation.isLoading}
        className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loginMutation.isLoading ? "Loading..." : "Sign in with Google"}
      </button>

      { loginMutation.error ? (<p>{ loginMutation.error.message }</p>) : null }

    </div>
  )
}

