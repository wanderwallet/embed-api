"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../client/utils/supabase/supabase-client-client"

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

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing Google OAuth callback");
        console.log("Current URL:", window.location.href);
        
        // Add protection for double processing
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const codeParam = urlParams.get('code') || hashParams.get('code');
        
        if (!codeParam) {
          console.warn("No code parameter found in URL, cannot exchange for session");
          redirectToHash('/login', { error: "Missing authentication code" });
          return;
        }
        
        // Try the code exchange
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          
          if (error) {
            console.error("Error exchanging code for session:", error);
            // Redirect to login with error using hash-based format
            redirectToHash('/login', { error: "Unable to authenticate: " + error.message });
            return;
          }
          
          console.log("Authentication successful, session data:", 
            data.session ? {
              hasAccessToken: !!data.session.access_token,
              hasRefreshToken: !!data.session.refresh_token,
              expiresAt: data.session.expires_at,
              user: data.session.user ? {
                id: data.session.user.id,
                email: data.session.user.email
              } : null
            } : "No session"
          );
          
          // Save the session token in localStorage
          if (data.session?.access_token) {
            console.log("Storing access token in localStorage");
            localStorage.setItem('authToken', data.session.access_token);
            
            // Make sure we don't have any conflicting auth flags
            localStorage.removeItem('isCustomAuth');
            
            // We can also store the refresh token if available
            if (data.session.refresh_token) {
              localStorage.setItem('refreshToken', data.session.refresh_token);
            }
            
            // For debugging, also log any other session properties
            console.log("Session expires at:", data.session.expires_at ? 
              new Date(data.session.expires_at * 1000).toLocaleString() : 
              "No expiration time"
            );
            
            // Force a delay before redirecting to ensure localStorage is updated
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Successfully authenticated, redirect to auth/restore-shares using hash-based format
            redirectToHash('/auth/restore-shares');
          } else {
            console.error("No access token in session data");
            redirectToHash('/login', { error: "No access token received" });
          }
        } catch (exchangeError: unknown) {
          console.error("Exception during code exchange:", exchangeError);
          const errorMessage = exchangeError instanceof Error ? exchangeError.message : "Unknown error";
          redirectToHash('/login', { error: "Error during authentication: " + errorMessage });
        }
      } catch (err) {
        console.error("Error during auth callback:", err);
        // Redirect to login with error using hash-based format
        redirectToHash('/login', { error: "Authentication process failed" });
      }
    }

    // Delay slightly to ensure DOM is fully loaded
    setTimeout(() => {
      handleAuthCallback();
    }, 100);
  }, [router])

  return <div>Processing Google authentication...</div>
}

