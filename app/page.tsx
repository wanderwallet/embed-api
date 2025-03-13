"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/client/utils/trpc/trpc-client"
import { useAuth } from "@/client/hooks/useAuth"
import { AuthProviderType } from "@prisma/client"
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();
  const startRegistrationMutation = trpc.startRegistration.useMutation();
  const verifyRegistrationMutation = trpc.verifyRegistration.useMutation();
  const startAuthenticationMutation = trpc.startAuthentication.useMutation();
  const verifyAuthenticationMutation = trpc.verifyAuthentication.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const handleOAuthSignIn = async (provider: Exclude<AuthProviderType, "EMAIL_N_PASSWORD">) => {
    try {
      setIsLoading(true);

      const { data } = await loginMutation.mutateAsync({ authProviderType: provider });

      if (data) {
        // Redirect to OAuth page
        window.location.href = data
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

  // Handle passkey registration
  const handlePasskeySignUp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Start registration process
      const { options, tempUserId } = await startRegistrationMutation.mutateAsync();
      
      // Get attestation from browser
      const attestationResponse = await startRegistration({ optionsJSON: options });
      
      // Verify registration with server
      const verificationResult = await verifyRegistrationMutation.mutateAsync({
        tempUserId,
        attestationResponse,
      });
      
      if (verificationResult.verified) {
        // Registration successful, user should be logged in now
        router.push("/dashboard");
      } else {
        setErrorMessage("Passkey registration failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Passkey registration failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Passkey registration failed");
      setIsLoading(false);
    }
  };

  // Handle passkey authentication
  const handlePasskeySignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Start authentication process
      const { options, tempId } = await startAuthenticationMutation.mutateAsync();
      
      // Get assertion from browser
      const authenticationResponse = await startAuthentication({ optionsJSON: options });
      
      // Verify authentication with server
      const verificationResult = await verifyAuthenticationMutation.mutateAsync({
        tempId,
        authenticationResponse,
      });
      if (verificationResult.verified) {
        // Authentication successful, user should be logged in now
        router.push("/dashboard");
      } else {
        setErrorMessage("Passkey authentication failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Passkey authentication failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Passkey authentication failed");
      setIsLoading(false);
    }
  };

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
              disabled={loginMutation.isLoading}
              className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loginMutation.isLoading ? "Loading..." : "Sign in"}
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
              disabled={loginMutation.isLoading || isLoading}
              className="bg-blue-500 text-white font-semibold py-2 px-4 border border-blue-600 rounded shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Email & Password
            </button>

            {/* Passkey buttons */}
            <button
              onClick={handlePasskeySignUp}
              disabled={isLoading}
              className="bg-green-500 text-white font-semibold py-2 px-4 border border-green-600 rounded shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Sign Up with Passkey
            </button>

            <button
              onClick={handlePasskeySignIn}
              disabled={isLoading}
              className="bg-purple-500 text-white font-semibold py-2 px-4 border border-purple-600 rounded shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Sign In with Passkey
            </button>

            <button
              onClick={() => handleOAuthSignIn("GOOGLE")}
              disabled={loginMutation.isLoading || isLoading}
              className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google
            </button>

            <button
              onClick={() => handleOAuthSignIn("FACEBOOK")}
              disabled={loginMutation.isLoading || isLoading}
              className="bg-blue-600 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Facebook
            </button>

            <button
              onClick={() => handleOAuthSignIn("X")}
              disabled={loginMutation.isLoading || isLoading}
              className="bg-black text-white font-semibold py-2 px-4 border border-black rounded shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with X
            </button>

            <button
              onClick={() => handleOAuthSignIn("APPLE")}
              disabled={loginMutation.isLoading || isLoading}
              className="bg-black text-white font-semibold py-2 px-4 border border-black rounded shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with Apple
            </button>
          </>
        )}
      </div>

      {errorMessage ? (<p className="mt-4 text-red-500">{errorMessage}</p>) : null}
      {loginMutation.error ? (<p className="mt-4 text-red-500">{loginMutation.error.message}</p>) : null}
    </div>
  )
}

