// src/server/routers/passkeys.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "@/server/trpc";
import {
  relyingPartyID,
  relyingPartyName,
  relyingPartyOrigin,
} from "@/server/services/webauthnConfig";
import { stringToUint8Array, uint8ArrayToString } from "@/server/services/auth";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { createWebAuthnAccessTokenForUser, createWebAuthnRefreshTokenForUser } from "@/server/utils/passkey/session";
import { PasskeyChallengePurpose, UserProfile, PrismaClient } from "@prisma/client";

// Helper function to convert base64 to Uint8Array
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Creates or updates a user session in both Supabase Auth and our database.
 * 
 * This function centralizes session management logic to:
 * 1. Create JWT tokens (access + refresh) for the user
 * 2. Set the session in Supabase Auth
 * 3. Create or update a session record in our database
 * 4. Return session data including deviceNonce
 */
async function createOrUpdateUserSession(params: {
  userProfile: UserProfile;
  ctx: { 
    prisma: PrismaClient; 
    session?: { 
      deviceNonce?: string; 
      userAgent?: string; 
      ip?: string 
    }; 
  };
  deviceNonce?: string;
  tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">; // Prisma transaction type
}) {
  const { userProfile, ctx, deviceNonce: inputDeviceNonce, tx } = params;
  const supabase = await createServerClient();

  // Use provided deviceNonce, ctx deviceNonce, or generate a new one
  const deviceNonce = inputDeviceNonce || ctx?.session?.deviceNonce || crypto.randomUUID();
  
  // Default values for IP and user agent
  const userAgent = ctx?.session?.userAgent || "";
  const ip = ctx?.session?.ip || "127.0.0.1";
  
  // Use either the transaction or prisma client
  const prisma = tx || ctx.prisma;
  
  // Check if a session for this user+device already exists
  const existingSession = await prisma.session.findUnique({
    where: {
      userSession: {
        userId: userProfile.supId,
        deviceNonce
      }
    }
  });
  
  let dbSession;
  
  // Create or update the session in our database
  if (existingSession) {
    // Update existing session
    dbSession = await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        updatedAt: new Date(),
        ip,
        userAgent
      }
    });
  } else {
    // Create new session
    dbSession = await prisma.session.create({
      data: {
        userId: userProfile.supId,
        deviceNonce,
        ip,
        userAgent,
      },
    });
  }
  
  // Now we have a session ID from the database to use for our tokens
  // Create JWT tokens for authentication using the session ID and session data
  const sessionDataForTokens = {
    id: dbSession.id,
    deviceNonce,
    ip,
    userAgent,
    createdAt: dbSession.createdAt,
    updatedAt: dbSession.updatedAt
  };
  
  const accessToken = createWebAuthnAccessTokenForUser(userProfile, sessionDataForTokens);
  const refreshToken = createWebAuthnRefreshTokenForUser(
    userProfile, 
    dbSession.id,
    sessionDataForTokens
  );
  
  // Set the session in Supabase Auth
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  if (sessionError) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to create session: ${sessionError.message}`,
    });
  }
  
  return {
    session: sessionData.session,
    deviceNonce,
  };
}

/**
 * Updates an existing user session with device information
 * This is used when the user already has a valid session but we need to
 * associate it with device information
 */
async function updateExistingUserSession(params: {
  userProfile: UserProfile;
  ctx: { 
    prisma: PrismaClient; 
    session?: { 
      deviceNonce?: string; 
      userAgent?: string; 
      ip?: string 
    }; 
  };
  deviceNonce?: string;
  tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">; // Prisma transaction type
}) {
  const { userProfile, ctx, deviceNonce: inputDeviceNonce, tx } = params;
  
  // Use provided deviceNonce, ctx deviceNonce, or generate a new one
  const deviceNonce = inputDeviceNonce || ctx?.session?.deviceNonce || crypto.randomUUID();
  
  // Default values for IP and user agent
  const userAgent = ctx?.session?.userAgent || "";
  const ip = ctx?.session?.ip || "127.0.0.1";
  
  // Use either the transaction or prisma client
  const prisma = tx || ctx.prisma;
  
  // Check if a session for this user+device already exists
  const existingSession = await prisma.session.findUnique({
    where: {
      userSession: {
        userId: userProfile.supId,
        deviceNonce
      }
    }
  });
  
  // Create or update the session in our database
  if (existingSession) {
    // Update existing session
    await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        updatedAt: new Date(),
        ip,
        userAgent
      }
    });
  } else {
    // Create new session
    await prisma.session.create({
      data: {
        userId: userProfile.supId,
        deviceNonce,
        ip,
        userAgent,
      },
    });
  }
  
  // We don't create new tokens here because the user already has a valid session
  // from the magic link authentication flow, but we do want to update our session record
  
  return { deviceNonce };
}

export const passkeysRoutes = {
  // Start registration requiring a pre-existing user
  startRegistration: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      
      // Check if user exists
      const userProfile = await ctx.prisma.userProfile.findFirst({
        where: { supEmail: email },
      });
      
      if (!userProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not registered. Please register with another authentication method first.",
        });
      }
      
      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName: relyingPartyName,
        rpID: relyingPartyID,
        userID: stringToUint8Array(userProfile.supId),
        userName: email,
        attestationType: "direct",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });
      
      const challenge = options.challenge;
      await ctx.prisma.passkeyChallenge.upsert({
        where: {
          userId_purpose: {
            userId: userProfile.supId,
            purpose: PasskeyChallengePurpose.REGISTRATION
          }
        },
        update: {
          value: challenge,
          version: "1",
          createdAt: new Date(),
        },
        create: {
          userId: userProfile.supId,
          value: challenge,
          purpose: PasskeyChallengePurpose.REGISTRATION,
          version: "1",
          createdAt: new Date(),
        },
      });
      
      return {
        options,
        userId: userProfile.supId,
      };
    }),

  verifyOtp: publicProcedure
    .input(
      z.object({
        verificationId: z.string(),
        otp: z.string(),
        email: z.string().email(),
        deviceNonce: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { verificationId, otp, email, deviceNonce } = input;
      const supabase = await createServerClient();
      
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          // Get the credential data
          const credentialRecord = await tx.passkeyChallenge.findFirst({
            where: {
              userId: verificationId,
              purpose: PasskeyChallengePurpose.REGISTRATION,
            },
          });
          
          if (!credentialRecord) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Credential record not found",
            });
          }
          
          const credentialData = JSON.parse(credentialRecord.value);
          
          // Verify the OTP
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
          });
          
          if (error || !data.user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `OTP verification failed: ${error?.message || "Invalid code"}`,
            });
          }
          
          // Get the user profile
          const userProfile = await tx.userProfile.findFirst({
            where: { supEmail: email },
          });
          
          if (!userProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User profile not found",
            });
          }
          
          // Create the passkey
          await tx.passkey.create({
            data: {
              userId: userProfile.supId,
              credentialId: uint8ArrayToString(credentialData.credentialID),
              publicKey: uint8ArrayToString(credentialData.credentialPublicKey),
              signCount: credentialData.counter,
              label: "1",
              createdAt: new Date(),
              lastUsedAt: new Date(),
            },
          });
          
          // Create session using the helper function
          const sessionResult = await createOrUpdateUserSession({
            userProfile,
            ctx,
            deviceNonce,
            tx
          });
          
          // Clean up temporary records
          await tx.passkeyChallenge.deleteMany({
            where: {
              userId: {
                in: [verificationId, credentialData.userId],
              },
            },
          });
          
          return {
            verified: true,
            userId: userProfile.supId,
            session: sessionResult.session,
            deviceNonce: sessionResult.deviceNonce,
          };
        } catch (error) {
          console.error("OTP verification error:", error);
          throw error;
        }
      });
    }),

  verifyRegistration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        attestationResponse: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, attestationResponse } = input;
      const supabase = await createServerClient();
      
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          // Get the challenge
          const challengeRecord = await tx.passkeyChallenge.findFirst({
            where: {
              userId: userId,
              purpose: PasskeyChallengePurpose.REGISTRATION,
            },
            orderBy: {
              createdAt: "desc",
            },
          });
          
          if (!challengeRecord) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Challenge not found",
            });
          }
          
          // Get the user profile
          const userProfile = await tx.userProfile.findUnique({
            where: { supId: userId },
          });
          
          if (!userProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User profile not found",
            });
          }
          
          if (!userProfile.supEmail) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User has no email address",
            });
          }
          
          // Verify the registration
          const verification = await verifyRegistrationResponse({
            response: attestationResponse,
            expectedChallenge: challengeRecord.value,
            expectedOrigin: relyingPartyOrigin,
            expectedRPID: relyingPartyID,
          });
          
          if (!verification.verified || !verification.registrationInfo) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Verification failed",
            });
          }
          
          // Log the verification info for debugging
          console.log("Verification info:", JSON.stringify({
            verified: verification.verified,
            hasRegistrationInfo: !!verification.registrationInfo,
            hasCredentialID: !!verification.registrationInfo?.credential.id,
            hasCredentialPublicKey: !!verification.registrationInfo?.credential.publicKey,
            counter: verification.registrationInfo?.credential.counter,
          }));
          
          // Log the credential ID from the browser
          console.log("Original credential ID from browser:", attestationResponse.id);
          
          // Store the credential ID exactly as it comes from the browser
          const credentialId = attestationResponse.id;
          
          console.log("Creating passkey with credentialId:", credentialId);
          
          // Extract the public key from the attestation response
          let publicKey;
          try {
            // Try to get the public key from the verification result
            if (verification.registrationInfo?.credential?.publicKey) {
              publicKey = Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64');
            } else if (attestationResponse.response?.publicKey) {
              // Try to get it from the attestation response
              publicKey = Buffer.from(attestationResponse.response.publicKey).toString('base64');
            } else if (attestationResponse.response?.publicKeyBytes) {
              // Try to get it from publicKeyBytes
              publicKey = Buffer.from(attestationResponse.response.publicKeyBytes).toString('base64');
            } else {
              // Use a placeholder if we can't find it
              console.warn("Could not find public key in attestation response");
              // TODO: Can be used for cleanup cronjob
              publicKey = "placeholder-public-key";
            }
          } catch (error) {
            console.error("Error extracting public key:", error);
            // TODO: Can be used for cleanup cronjob
            publicKey = "error-extracting-public-key";
          }
          
          // Create a default label using the verified email
          const defaultLabel = `Passkey for ${userProfile.supEmail}`;
          
          // Create the passkey directly with the label field
          const passkey = await tx.passkey.create({
            data: {
              userId: userProfile.supId,
              credentialId: credentialId,
              publicKey: publicKey,
              signCount: verification.registrationInfo?.credential?.counter || 0,
              createdAt: new Date(),
              lastUsedAt: new Date(),
              label: defaultLabel,
            },
          });
          
          console.log("Created passkey:", passkey);
          
          // Send magic link to the user's email for verification
          const { error } = await supabase.auth.signInWithOtp({
            email: userProfile.supEmail,
          });
          
          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to send magic link: ${error.message}`,
            });
          }
          
          // Clean up challenges
          await tx.passkeyChallenge.deleteMany({
            where: {
              userId: userId,
              purpose: PasskeyChallengePurpose.REGISTRATION,
            },
          });
          
          return {
            message: "Passkey registered successfully. Please check your email for a magic link to verify your account.",
          };
        } catch (error) {
          console.error("Verification error:", error);
          throw error;
        }
      });
    }),

  // Add authentication endpoints
  startAuthentication: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          let userPasskeys: { id: string; credentialId: string; publicKey: string; signCount: number }[] = [];
          
          if (input.email) {
            // If email is provided, find the user's passkeys
            const userProfile = await tx.userProfile.findFirst({
              where: { supEmail: input.email },
            });
            
            if (userProfile) {
              userPasskeys = await tx.passkey.findMany({
                where: { userId: userProfile.supId },
              });
            }
          }
          
          // Generate authentication options
          // If email was not provided, pass an empty array for allowCredentials
          const options = await generateAuthenticationOptions({
            rpID: relyingPartyID,
            userVerification: "preferred",
            allowCredentials: userPasskeys.map(pk => ({
              id: pk.credentialId,
              type: 'public-key',
            })),
          });
          
          // Generate a random ID for the authentication challenge
          const randomUserId = `anon-${ crypto.randomUUID() }`;
          
          const challenge = options.challenge;
          await tx.passkeyChallenge.upsert({
            where: {
              userId_purpose: {
                userId: randomUserId,
                purpose: PasskeyChallengePurpose.AUTHENTICATION
              }
            },
            update: {
              value: challenge,
              version: "1",
              createdAt: new Date(),
            },
            create: {
              userId: randomUserId,
              value: challenge,
              purpose: PasskeyChallengePurpose.AUTHENTICATION,
              version: "1",
              createdAt: new Date(),
            },
          });
          
          return {
            options,
          };
        } catch (error) {
          console.error("Start authentication error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to start authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      });
    }),

  verifyAuthentication: publicProcedure
    .input(
      z.object({
        credentialId: z.string().optional(),
        authenticatorData: z.string(),
        clientDataJSON: z.string(),
        signature: z.string(),
        userHandle: z.string().optional(),
        challenge: z.string(),
        deviceNonce: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { credentialId, userHandle, challenge, deviceNonce } = input;
      
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          // Find the challenge - make sure it's an AUTHENTICATION challenge
          const challengeRecord = await tx.passkeyChallenge.findFirst({
            where: {
              value: challenge,
              purpose: PasskeyChallengePurpose.AUTHENTICATION,
            },
          });
          
          if (!challengeRecord) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Authentication challenge not found",
            });
          }
          
          // Find the passkey
          let passkey;
          
          if (credentialId) {
            console.log("Looking for passkey with credentialId:", credentialId);
            
            passkey = await tx.passkey.findFirst({
              where: {
                credentialId: credentialId,
              },
            });
          } else if (userHandle) {
            // If no credentialId but userHandle is provided, try to find by userId
            passkey = await tx.passkey.findFirst({
              where: {
                userId: userHandle,
              },
            });
          }
          
          if (!passkey) {
            console.error("Passkey not found", { credentialId, userHandle });
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Passkey not found",
            });
          }
          
          // Get the user profile
          const userProfile = await tx.userProfile.findUnique({
            where: {
              supId: passkey.userId,
            },
          });
          
          if (!userProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }
          
          if (!credentialId) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Credential ID is required",
            });
          }

          try {
            const publicKeyBuffer = base64ToArrayBuffer(passkey.publicKey);
            
            // Create the WebAuthn credential with the correct types
            // Verify algorithm ES256
            const credential = {
              id: credentialId,
              publicKey: new Uint8Array(publicKeyBuffer),
              algorithm: -7, // ES256 algorithm
              counter: passkey.signCount,
            };

            // Set up the full verification
            const verification = await verifyAuthenticationResponse({
              response: {
                id: credentialId,
                rawId: credentialId,
                response: {
                  authenticatorData: input.authenticatorData,
                  clientDataJSON: input.clientDataJSON,
                  signature: input.signature,
                  userHandle: userHandle,
                },
                clientExtensionResults: {},
                type: 'public-key',
              },
              expectedChallenge: challengeRecord.value,
              expectedOrigin: relyingPartyOrigin,
              expectedRPID: relyingPartyID,
              credential,
            });

            // Update counter only if verification succeeded
            if (verification.verified) {
              await tx.passkey.update({
                where: {
                  id: passkey.id,
                },
                data: {
                  signCount: verification.authenticationInfo.newCounter,
                  lastUsedAt: new Date(),
                },
              });
            } else {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Authentication verification failed",
              });
            }
          } catch (verificationError) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Authentication verification failed: ${verificationError}`,
            });
          }
          
          // Token creation and session management
          const sessionResult = await createOrUpdateUserSession({ 
            userProfile, 
            ctx,
            deviceNonce,
            tx 
          });
          
          // Clean up the used challenge
          await tx.passkeyChallenge.delete({
            where: {
              id: challengeRecord.id,
            },
          });
          
          return {
            verified: true,
            userId: passkey.userId,
            user: userProfile,
            session: sessionResult.session,
            deviceNonce: sessionResult.deviceNonce,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      });
    }),

  finalizePasskey: publicProcedure
    .input(
      z.object({
        verificationId: z.string(),
        email: z.string().email(),
        sessionToken: z.string(),
        deviceNonce: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { verificationId, email, sessionToken, deviceNonce } = input;
      const supabase = await createServerClient();
      
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          // Verify the session token
          const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
          
          if (error || !user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid session token",
            });
          }
          
          // Verify the email matches
          if (user.email !== email) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email mismatch",
            });
          }
          
          // Get the credential data - look for the registration challenge
          const credentialRecord = await tx.passkeyChallenge.findFirst({
            where: {
              userId: verificationId,
              purpose: PasskeyChallengePurpose.REGISTRATION,
            },
          });
          
          if (!credentialRecord) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Challenge record not found",
            });
          }
          
          // Parse the JSON value (contains the credential data from the verification step)
          let credentialData;
          try {
            credentialData = JSON.parse(credentialRecord.value);
          } catch (parseError) {
            console.error("Error parsing credential data:", parseError);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid credential data format",
            });
          }
          
          // Use the browser's credential ID
          const browserCredentialId = credentialData.credentialId || credentialData.id;
          if (!browserCredentialId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing credential ID in stored data",
            });
          }
          
          // Get the public key
          const publicKey = credentialData.publicKey || credentialData.publicKeyBytes || "placeholder-public-key";

          // Get the user profile
          const userProfile = await tx.userProfile.findFirst({
            where: { supEmail: email },
          });
          
          if (!userProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User profile not found",
            });
          }
          
          console.log("Creating passkey with credentialId:", browserCredentialId);
          
          // Create the passkey - use the browser's credential ID directly
          await tx.passkey.create({
            data: {
              userId: userProfile.supId,
              credentialId: browserCredentialId,
              publicKey: publicKey,
              signCount: credentialData.counter || 0,
              label: `Passkey for ${email}`,
              createdAt: new Date(),
              lastUsedAt: new Date(),
            },
          });
          
          // User already has a valid session (from magic link auth)
          // We just need to update it with device information
          const sessionResult = await updateExistingUserSession({
            userProfile,
            ctx,
            deviceNonce,
            tx
          });
          
          // Clean up challenge
          await tx.passkeyChallenge.delete({
            where: {
              id: credentialRecord.id,
            },
          });
          
          return {
            verified: true,
            userId: userProfile.supId,
            deviceNonce: sessionResult.deviceNonce,
          };
        } catch (error) {
          console.error("Finalize passkey error:", error);
          throw error;
        }
      });
    }),
};
