import { createBrowserClient } from "@supabase/ssr"

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

console.log("Creating Supabase browser client with URL:", NEXT_PUBLIC_SUPABASE_URL);

// Create a more robust client configuration
export const supabase = createBrowserClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      debug: true,  // Enable debug logs
      // Use explicit storage to avoid conflicts
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key);
          console.log(`Supabase Auth reading from storage: ${key}`, item ? "[PRESENT]" : "[MISSING]");
          return item;
        },
        setItem: (key, value) => {
          console.log(`Supabase Auth writing to storage: ${key}`, value ? "[PRESENT]" : "[MISSING]");
          localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          console.log(`Supabase Auth removing from storage: ${key}`);
          localStorage.removeItem(key);
        }
      }
    },
  },
);

// Add listener after creation
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Supabase auth state change:", event, session ? {
    hasAccessToken: !!session.access_token,
    user: session.user ? { id: session.user.id } : null
  } : "No session");
  
  // Automatically save token on signin event
  if (event === 'SIGNED_IN' && session?.access_token) {
    localStorage.setItem('authToken', session.access_token);
    localStorage.removeItem('isCustomAuth');
    console.log("Automatically stored access token on auth state change");
  }
  
  // Clear token on signout
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isCustomAuth');
    console.log("Cleared auth tokens on sign out");
  }
});
