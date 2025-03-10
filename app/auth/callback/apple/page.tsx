"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";

export default function AppleAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = await createServerClient();
        // Get the auth code from the URL
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error("Error exchanging code for session:", error);
          throw error;
        }

        // Redirect to the dashboard or home page after successful authentication
        router.push("/dashboard");
      } catch (error) {
        console.error("Error during Apple authentication callback:", error);
        // Redirect to login page if there's an error
        router.push("/?error=Authentication failed");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authenticating with Apple...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
