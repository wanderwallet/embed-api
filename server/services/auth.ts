import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { TRPCError } from "@trpc/server";
import { relyingPartyID, relyingPartyOrigin } from "./webauthnConfig";
import { Challenge, ChallengePurpose, ChallengeType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createChallenge(userId: string, walletId: string = "", challenge: string) {
  return prisma.challenge.create({
    data: {
      type: ChallengeType.SIGNATURE,
      purpose: ChallengePurpose.AUTHENTICATION,
      value: challenge,
      version: "1.0",
      userId: userId,
      walletId: walletId,
    },
  });
}

export async function getLatestChallenge(userId: string) {
  return prisma.challenge.findFirst({
    where: {
      userId: userId,
      type: ChallengeType.SIGNATURE,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function validateChallenge(challenge: Challenge | null) {
  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }

  // Validate challenge expiration (30 minutes for passkeys)
  const currentTime = new Date();
  const challengeCreatedAt = new Date(challenge.createdAt);
  const timeDifferenceMs = currentTime.getTime() - challengeCreatedAt.getTime();
  const passkeyChallengeExpirationMs = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  if (timeDifferenceMs > passkeyChallengeExpirationMs) {
    // Delete expired challenge
    await prisma.challenge.delete({
      where: {
        id: challenge.id,
      },
    });
    
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Challenge has expired. Please try again.",
    });
  }

  return challenge;
}

export async function deleteChallenge(challengeId: string) {
  return prisma.challenge.delete({
    where: {
      id: challengeId,
    },
  });
}

export function uint8ArrayToString(array: Uint8Array): string {
  return Buffer.from(array).toString();
}

export function stringToUint8Array(str: string): Uint8Array {
  return Buffer.from(str);
}

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

  // Use the new utility function
  await createChallenge(userId, "", options.challenge);

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

  // Use the new utility functions
  const challenge = await getLatestChallenge(userId);
  await validateChallenge(challenge);

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

  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
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
  await deleteChallenge(challenge.id);

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
