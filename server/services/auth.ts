import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { TRPCError } from "@trpc/server";

export async function getUser() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user
}

export async function loginWithGoogle(authProviderType: string) {
  if (authProviderType !== "GOOGLE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid auth provider type",
    })
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback/google` : undefined,
    },
  })

  if (error) {
    console.error("Google sign-in error:", error)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    })
  }

  if (!data.url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No redirect URL returned from Supabase",
    })
  }

  return data.url
}

export async function refreshSession() {
  // TODO: This doesn't do anything. It should be syncing our own Session entity, unless we use triggers.

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Failed to refresh session",
    });
  }

  if (!data.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No active session",
    });
  }

  const user = await getUser();
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  return { user, session: data.session };
}

export async function logoutUser() {
  // TODO: This doesn't do anything. It should be syncing our own Session entity, unless we use triggers.

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error during logout:", error)
    throw error
  }

  return { success: true }
}
