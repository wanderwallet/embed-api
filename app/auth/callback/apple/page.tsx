"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/client/utils/supabase/supabase-client-client"

const redirectToHash = (path: string, params?: Record<string, string>) => {
  const baseUrl = window.location.origin;
  let url = `${baseUrl}/#${path}`;
  
  // Add query params if provided
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  console.log("Redirecting to:", url);
  window.location.replace(url);
};

export default function AppleAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing Apple OAuth callback");
        
        // Get the auth code from the URL
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error("Error exchanging code for session:", error);
          redirectToHash('/', { error: "Authentication failed" });
          return;
        }
        
        console.log("Apple authentication successful", data);
        
        // Save the session token in localStorage
        if (data.session?.access_token) {
          localStorage.setItem('authToken', data.session.access_token);
          // Make sure we don't have any conflicting auth flags
          localStorage.removeItem('isCustomAuth');
          
          // We can also store the refresh token if available
          if (data.session.refresh_token) {
            localStorage.setItem('refreshToken', data.session.refresh_token);
          }
        }
        
        // Redirect to the auth/restore-shares path after successful authentication
        redirectToHash('/auth/restore-shares');
      } catch (error) {
        console.error("Error during Apple authentication callback:", error);
        // Redirect to login page if there's an error
        redirectToHash('/', { error: "Authentication failed" });
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
