"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/client/utils/trpc/trpc-client"
import { useAuth } from "@/client/hooks/useAuth"
import { AuthProviderType } from "@prisma/client"

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const { url } = await loginMutation.mutateAsync({ authProviderType: "GOOGLE" });

      if (url) {
        // Redirect to Google's OAuth page
        window.location.href = url
      } else {
        console.error("No URL returned from authenticate")
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google sign-in failed:", error)
      setIsLoading(false);
    }
  }

  const handleOAuthSignIn = async (provider: Exclude<AuthProviderType, "EMAIL_N_PASSWORD">) => {
    try {
      setIsLoading(true);

      const { url } = await loginMutation.mutateAsync({ authProviderType: provider });

      if (url) {
        // Redirect to OAuth page
        window.location.href = url
      } else {
        console.error(`No URL returned from ${provider} authenticate`)
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error)
      setIsLoading(false);
    }
  }

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      await loginMutation.mutateAsync({
        authProviderType: "EMAIL_N_PASSWORD",
        email,
        password,
      });

      // If successful, the useEffect will handle redirection
    } catch (error) {
      console.error("Email/password sign-in failed:", error)
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

      <div className="flex flex-col space-y-4 w-64">
        {showEmailForm ? (
          <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending }
              className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loginMutation.isPending  ? "Loading..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Options
            </button>
          </form>
        ) : (
          <>
            <button
              onClick={() => setShowEmailForm(true)}
              disabled={loginMutation.isPending || isLoading}
              className="bg-blue-500 text-white font-semibold py-2 px-4 border border-blue-600 rounded shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Email & Password
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={loginMutation.isPending || isLoading}
              className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google
            </button>

            <button
              onClick={() => handleOAuthSignIn("FACEBOOK")}
              disabled={loginMutation.isPending || isLoading}
              className="bg-blue-600 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Facebook
            </button>

            <button
              onClick={() => handleOAuthSignIn("X")}
              disabled={loginMutation.isPending || isLoading}
              className="bg-black text-white font-semibold py-2 px-4 border border-black rounded shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with X
            </button>

            <button
              onClick={() => handleOAuthSignIn("APPLE")}
              disabled={loginMutation.isPending || isLoading}
              className="bg-black text-white font-semibold py-2 px-4 border border-black rounded shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with Apple
            </button>
          </>
        )}
      </div>

      {loginMutation.error ? (<p className="mt-4 text-red-500">{loginMutation.error.message}</p>) : null}
    </div>
  )
}

