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
 * Creates or updates a user session in our database (not Supabase Auth).
 * 
 * This function centralizes session management logic to:
 * 1. Create or update a session record in our custom Sessions table
 * 2. Return deviceNonce for the client to store
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

  // Use provided deviceNonce, ctx deviceNonce, or generate a new one
  const deviceNonce = inputDeviceNonce || ctx?.session?.deviceNonce || crypto.randomUUID();
  
  // Default values for IP and user agent
  const userAgent = ctx?.session?.userAgent || "";
  
  // Sanitize IP address to prevent database errors
  let ip = "127.0.0.1";
  if (ctx?.session?.ip) {
    // Handle X-Forwarded-For and multiple IP formats by taking just the first one
    ip = ctx.session.ip.split(',')[0].trim();
    
    // If IP is not valid, use a default
    if (!isValidIpAddress(ip)) {
      console.log(`Invalid IP address format: "${ip}", using default`);
      ip = "127.0.0.1";
    }
  }
  
  // Use either the transaction or prisma client
  const prisma = tx || ctx.prisma;
  
  try {
    // First check if a session exists for this user and device nonce
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: userProfile.supId,
        deviceNonce
      }
    });
    
    let sessionId;
    
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
      
      console.log("Updated existing session:", existingSession.id);
      sessionId = existingSession.id;
    } else {
      // Create new session with a unique ID
      sessionId = crypto.randomUUID();
      
      try {
        await prisma.session.create({
          data: {
            id: sessionId,
            userId: userProfile.supId,
            deviceNonce,
            ip,
            userAgent,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        console.log("Created new session:", sessionId);
      } catch (createError) {
        // In case of a unique constraint error, create with fallback values
        console.error("Error creating session, trying fallback:", createError);
        
        // Generate completely unique values to avoid any constraint issues
        const fallbackNonce = crypto.randomUUID() + "-fallback";
        sessionId = crypto.randomUUID() + "-fallback";
        
        await prisma.session.create({
          data: {
            id: sessionId,
            userId: userProfile.supId,
            deviceNonce: fallbackNonce,
            ip: "127.0.0.1",
            userAgent,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        
        // Return the fallback nonce instead
        console.log("Created fallback session:", sessionId);
        return {
          sessionId,
          deviceNonce: fallbackNonce,
          userId: userProfile.supId
        };
      }
    }
    
    // Return consistent session data
    return {
      sessionId,
      deviceNonce,
      userId: userProfile.supId
    };
  } catch (error) {
    console.error("Session management error:", error);
    
    // In case of any unexpected error, return a minimal valid response
    return {
      sessionId: crypto.randomUUID(),
      deviceNonce: crypto.randomUUID(),
      userId: userProfile.supId
    };
  }
}

// Helper function to validate IP addresses
function isValidIpAddress(ip: string): boolean {
  // Simple regex for IPv4 validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  
  if (!match) return false;
  
  // Check each octet is in valid range (0-255)
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) return false;
  }
  
  return true;
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

  // Check if a user has any registered passkeys
  checkUserPasskeys: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { email } = input;
      
      // Find the user by email
      const userProfile = await ctx.prisma.userProfile.findFirst({
        where: { supEmail: email },
      });
      
      if (!userProfile) {
        // If user doesn't exist, they obviously don't have passkeys
        return { hasPasskeys: false };
      }
      
      // Count user's passkeys
      const passkeyCount = await ctx.prisma.passkey.count({
        where: { userId: userProfile.supId },
      });
      
      return {
        hasPasskeys: passkeyCount > 0,
        count: passkeyCount
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
            sessionId: sessionResult.sessionId,
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
          let userId: string;
          
          if (input.email) {
            // Username-first flow: email is provided, find the user's passkeys
            const userProfile = await tx.userProfile.findFirst({
              where: { supEmail: input.email },
            });
            
            if (!userProfile) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "No user found with this email address.",
              });
            }
            
            userPasskeys = await tx.passkey.findMany({
              where: { userId: userProfile.supId },
            });
            
            if (userPasskeys.length === 0) {
              throw new TRPCError({
                code: "NOT_FOUND", 
                message: "No passkeys found for this user."
              });
            }
            
            userId = userProfile.supId;
          } else {
            // Usernameless flow (discoverable credentials)
            // Generate a secure random ID for the challenge
            userId = crypto.randomUUID();
          }
          
          // Generate authentication options
          const options = await generateAuthenticationOptions({
            rpID: relyingPartyID,
            userVerification: "preferred",
            // If email was provided, use the user's passkeys, otherwise allow any passkey
            allowCredentials: input.email ? userPasskeys.map(pk => ({
              id: pk.credentialId,
              type: 'public-key',
            })) : [],
          });
          
          // Store the challenge
          const challenge = options.challenge;
          await tx.passkeyChallenge.upsert({
            where: {
              userId_purpose: {
                userId: userId,
                purpose: PasskeyChallengePurpose.AUTHENTICATION
              }
            },
            update: {
              value: challenge,
              version: "1",
              createdAt: new Date(),
            },
            create: {
              userId: userId,
              value: challenge,
              purpose: PasskeyChallengePurpose.AUTHENTICATION,
              version: "1",
              createdAt: new Date(),
            },
          });
          
          return {
            options,
            challengeId: userId // Return the challenge ID so we can locate it during verification
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
        challengeId: z.string().optional(),
        deviceNonce: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { credentialId, userHandle, challenge, challengeId, deviceNonce } = input;
      
      return await ctx.prisma.$transaction(async (tx) => {
        try {
          // Find the challenge - look by ID first if provided, then by value
          let challengeRecord;
          
          if (challengeId) {
            challengeRecord = await tx.passkeyChallenge.findFirst({
              where: {
                userId: challengeId,
                purpose: PasskeyChallengePurpose.AUTHENTICATION,
              },
            });
          }
          
          // If not found by ID or ID wasn't provided, look by value
          if (!challengeRecord) {
            challengeRecord = await tx.passkeyChallenge.findFirst({
              where: {
                value: challenge,
                purpose: PasskeyChallengePurpose.AUTHENTICATION,
              },
            });
          }
          
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
              
              // Generate a unique nonce if none provided to avoid constraint conflicts
              const newDeviceNonce = deviceNonce || crypto.randomUUID();
              
              // First check if a session already exists with this userId and deviceNonce
              const existingSession = await tx.session.findFirst({
                where: {
                  userId: passkey.userId,
                  deviceNonce: newDeviceNonce
                }
              });
              
              let sessionId;
              
              // If a session exists, update it, otherwise create a new one
              if (existingSession) {
                console.log("Updating existing session:", existingSession.id);
                
                // Update the existing session
                await tx.session.update({
                  where: {
                    id: existingSession.id
                  },
                  data: {
                    ip: ctx.session?.ip ? ctx.session.ip.split(',')[0].trim() : '127.0.0.1',
                    userAgent: ctx.session?.userAgent || 'unknown',
                    updatedAt: new Date()
                  }
                });
                
                sessionId = existingSession.id;
              } else {
                // Create a new session with a uniquely generated id
                sessionId = crypto.randomUUID();
                console.log("Creating new session:", sessionId);
                
                try {
                  await tx.session.create({
                    data: {
                      id: sessionId,
                      userId: passkey.userId,
                      deviceNonce: newDeviceNonce,
                      ip: ctx.session?.ip ? ctx.session.ip.split(',')[0].trim() : '127.0.0.1',
                      userAgent: ctx.session?.userAgent || 'unknown',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  });
                } catch (createError) {
                  console.error("Error creating session:", createError);
                  
                  // In case of any error, generate a completely new nonce and session ID
                  // This is a fallback to avoid any constraint issues
                  const fallbackNonce = crypto.randomUUID() + "-fallback";
                  sessionId = crypto.randomUUID() + "-fallback";
                  
                  await tx.session.create({
                    data: {
                      id: sessionId,
                      userId: passkey.userId,
                      deviceNonce: fallbackNonce,
                      ip: "127.0.0.1", // Use safe default
                      userAgent: ctx.session?.userAgent || 'unknown',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  });
                }
              }
              
              // Set up required tokens and session data for client
              const authData = {
                sessionId,
                userId: passkey.userId,
                deviceNonce: newDeviceNonce,
                verified: true
              };
              
              // Store this information in localStorage to maintain the session
              console.log("Passkey authentication successful for user:", passkey.userId);
              
              return {
                ...authData,
                // Include any additional information needed by client
                needsWalletActivation: true
              };
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
          
          // Create or update the session with our custom function
          const sessionResult = await createOrUpdateUserSession({
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
            sessionId: sessionResult.sessionId,
            deviceNonce: sessionResult.deviceNonce,
          };
        } catch (error) {
          console.error("Finalize passkey error:", error);
          throw error;
        }
      });
    }),
};
