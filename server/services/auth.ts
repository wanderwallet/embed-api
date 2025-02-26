import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { TRPCError } from "@trpc/server";
import { relyingPartyID, relyingPartyOrigin } from "./webauthnConfig";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  // Retrieve user's passkeys
  const passkeys = await prisma.passkey.findMany({
    where: {
      userId: userId,
    },
    select: {
      credentialId: true,
    },
  });

  if (!passkeys.length) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No passkeys found for user",
    });
  }

  const options = await generateAuthenticationOptions({
    rpID: relyingPartyID,
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.credentialId,
      type: "public-key",
    })),
    userVerification: "preferred",
  });

  // Store the challenge
  await prisma.challenge.create({
    data: {
      type: "SIGNATURE",
      purpose: "ACTIVATION",
      value: options.challenge,
      version: "1.0",
      userId: userId,
      walletId: "", // You'll need to handle this appropriately
    },
  });

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

  // Retrieve the challenge
  const challenge = await prisma.challenge.findFirst({
    where: {
      userId: userId,
      purpose: "ACTIVATION",
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }

  // Retrieve the matching passkey
  const passkey = await prisma.passkey.findFirst({
    where: {
      userId: userId,
      credentialId: assertionResponse.id,
    },
  });

  if (!passkey) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Passkey not found" });
  }

  // Convert the passkey to the format expected by verifyAuthenticationResponse
  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge: challenge.value,
    expectedOrigin: relyingPartyOrigin,
    expectedRPID: relyingPartyID,
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, 'base64'), 
      counter: passkey.signCount,
    },
  });

  if (!verification.verified) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Verification failed" });
  }

  // Update the passkey
  await prisma.passkey.update({
    where: {
      id: passkey.id,
    },
    data: {
      signCount: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });

  // Delete the challenge
  await prisma.challenge.delete({
    where: {
      id: challenge.id,
    },
  });

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
