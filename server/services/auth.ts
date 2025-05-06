import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { TRPCError } from "@trpc/server";

export async function getUser() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user
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
