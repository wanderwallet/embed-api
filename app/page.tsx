"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/client/utils/trpc/trpc-client"
import { useAuth } from "@/client/hooks/useAuth"

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const { url } = await loginMutation.mutateAsync({ authProviderType: "GOOGLE" });

      if (url) {
        // Redirect to Google's OAuth page
        window.location.href = url
      } else {
        console.error("No URL returned from authenticate")
      }
    } catch (error) {
      console.error("Google sign-in failed:", error)
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])


  if (isAuthLoading || isLoading || user) return <div>Authenticating...</div>

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

