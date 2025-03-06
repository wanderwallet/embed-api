"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/utils/trpc/trpc-client";
import { useAuth } from "@/client/hooks/useAuth";
import { AuthHeader } from "@/client/components/AuthHeader";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple, FaTwitter } from "react-icons/fa";
import { MdEmail, MdArrowBack, MdExpandMore } from "react-icons/md";

type AuthProvider = "GOOGLE" | "FACEBOOK" | "X" | "APPLE" | "EMAIL_N_PASSWORD";

const initialProviders = [
  {
    id: "GOOGLE" as AuthProvider,
    name: "Google",
    icon: <FcGoogle className="w-5 h-5" />,
  },
];

const additionalProviders = [
  {
    id: "FACEBOOK" as AuthProvider,
    name: "Facebook",
    icon: <FaFacebook className="w-5 h-5 text-[#1877F2]" />,
  },
  {
    id: "X" as AuthProvider,
    name: "X",
    icon: <FaTwitter className="w-5 h-5" />,
  },
  {
    id: "APPLE" as AuthProvider,
    name: "Apple",
    icon: <FaApple className="w-5 h-5" />,
  },
];

export default function Login() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const loginMutation = trpc.authenticate.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAllProviders, setShowAllProviders] = useState(false);

  const handleProviderSignIn = async (provider: AuthProvider) => {
    try {
      setIsLoading(true);
      const { url } = await loginMutation.mutateAsync({
        authProviderType: provider,
      });
      if (url) window.location.href = url;
      else console.error("No URL returned from authenticate");
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // await loginMutation.mutateAsync({
      //   authProviderType: "EMAIL_N_PASSWORD",
      //   email,
      //   password,
      // });
    } catch (error) {
      console.error("Email sign-in failed:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isAuthLoading || isLoading || user) {
    return (
      <>
        <AuthHeader />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-600">Authenticating...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeader />
      <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-white pt-16">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Wander Embedded
                </h1>
                <p className="text-gray-600 mb-8">
                  Set up teams and apps for your embedded wallet
                </p>
              </div>

              <div className="space-y-4">
                {!showEmailForm ? (
                  <>
                    {initialProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderSignIn(provider.id)}
                        disabled={loginMutation.isLoading}
                        className="cursor-pointer w-full flex items-center justify-center space-x-3 bg-white text-gray-700 font-medium py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 h-12"
                      >
                        {provider.icon}
                        <span>Continue with {provider.name}</span>
                      </button>
                    ))}

                    {!showAllProviders ? (
                      <button
                        onClick={() => setShowAllProviders(true)}
                        className="cursor-pointer w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 py-2 h-10"
                      >
                        <span>More options</span>
                        <MdExpandMore className="w-5 h-5" />
                      </button>
                    ) : (
                      <>
                        {additionalProviders.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => handleProviderSignIn(provider.id)}
                            disabled={loginMutation.isLoading}
                            className="cursor-pointer w-full flex items-center justify-center space-x-3 bg-white text-gray-700 font-medium py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 h-12"
                          >
                            {provider.icon}
                            <span>Continue with {provider.name}</span>
                          </button>
                        ))}
                      </>
                    )}

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="cursor-pointer w-full flex items-center justify-center space-x-3 bg-gray-900 text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 h-12"
                    >
                      <MdEmail className="w-5 h-5" />
                      <span>Continue with Email</span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowEmailForm(false)}
                        className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2 h-10"
                      >
                        <MdArrowBack className="w-4 h-4" />
                        <span>Back to all options</span>
                      </button>
                      <button
                        type="submit"
                        disabled={loginMutation.isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10"
                      >
                        Sign In
                      </button>
                    </div>
                  </form>
                )}

                {loginMutation.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {loginMutation.error.message}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
