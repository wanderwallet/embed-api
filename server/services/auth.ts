import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { TRPCError } from "@trpc/server";
import { relyingPartyID, relyingPartyOrigin } from "./webauthnConfig";

export async function startAuthenticateWithPasskeys(
  authProviderType: string,
  userId: string
) {
  if (authProviderType !== "PASSKEYS") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid auth provider type",
    });
  }

  const supabase = await createServerClient();

  // Retrieve user's credentials
  const { data: credentials, error } = await supabase
    .from("AuthMethods")
    .select("provider_id")
    .eq("user_id", userId)
    .eq("provider_type", "PASSKEYS");

  if (error || !credentials?.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No passkeys found for user",
    });
  }

  const options = await generateAuthenticationOptions({
    rpID: relyingPartyID,
    allowCredentials: credentials.map((cred) => ({
      id: cred.provider_id,
      type: "public-key",
    })),
    userVerification: "preferred",
  });

  // Store the challenge
  const { error: challengeError } = await supabase.from("Challenges").insert({
    type: "SIGNATURE",
    purpose: "ACTIVATION",
    value: options.challenge,
    user_id: userId,
  });

  if (challengeError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: challengeError.message,
    });
  }

  return options;
}
export async function verifyAuthenticateWithPasskeys(
  authProviderType: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assertionResponse: any
) {
  if (authProviderType !== "PASSKEYS") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid auth provider type",
    });
  }

  const supabase = await createServerClient();

  // retrieve the challenge
  const { data: challenge, error: challengeError } = await supabase
    .from("Challenges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (challengeError || !challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }

  // retrieve the matching credential
  const { data: credential, error: credentialError } = await supabase
    .from("AuthMethods")
    .select("*")
    .eq("user_id", userId)
    .eq("provider_id", assertionResponse.id)
    .single();

  if (credentialError || !credential) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
  }

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.value,
    expectedOrigin: relyingPartyOrigin,
    expectedRPID: relyingPartyID,
    credential,
  });

  if (!verification.verified) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Verification failed" });
  }

  // update the credential
  await supabase
    .from("AuthMethods")
    .update({
      sign_count: verification.authenticationInfo.newCounter,
      last_used_at: new Date(),
    })
    .eq("id", credential.id);

  // delete the challenge
  await supabase.from("Challenges").delete().eq("id", challenge.id);

  return { verified: true };
}
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
    });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback/google`
          : undefined,
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  if (!data.url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No redirect URL returned from Supabase",
    });
  }

  return data.url;
}
export async function handleGoogleCallback() {
  const user = await getUser();
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Google authentication failed",
    });
  }
  return user;
}
export async function validateSession() {
  const user = await getUser();
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session",
    });
  }
  return user;
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
    console.error("Error during logout:", error);
    throw error;
  }

  return { success: true }
}
