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
import { PasskeyChallengePurpose } from "@prisma/client";

// Helper function to convert base64 to Uint8Array
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { verificationId, otp, email } = input;
      const supabase = await createServerClient();
      
      try {
        // Get the credential data
        const credentialRecord = await ctx.prisma.passkeyChallenge.findFirst({
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
        const userProfile = await ctx.prisma.userProfile.findFirst({
          where: { supEmail: email },
        });
        
        if (!userProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User profile not found",
          });
        }
        
        // Create the passkey
        await ctx.prisma.passkey.create({
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
        
        // Create tokens for the user
        const accessToken = createWebAuthnAccessTokenForUser(userProfile);
        const refreshToken = createWebAuthnRefreshTokenForUser(userProfile);
        
        // Set the session in Supabase
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
        
        // Get request information from context
        const deviceNonce = ctx?.session?.deviceNonce || crypto.randomUUID();
        const userAgent = ctx?.session?.userAgent || "";
        const ip = ctx?.session?.ip;
        
        // Create a session in our database
        await ctx.prisma.session.create({
          data: {
            userId: userProfile.supId,
            deviceNonce,
            ip,
            userAgent,
          },
        });
        
        // Clean up temporary records
        await ctx.prisma.passkeyChallenge.deleteMany({
          where: {
            userId: {
              in: [verificationId, credentialData.userId],
            },
          },
        });
        
        return {
          verified: true,
          userId: userProfile.supId,
          session: sessionData.session,
          deviceNonce,
        };
      } catch (error) {
        throw error;
      }
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
      
      try {
        // Get the challenge
        const challengeRecord = await ctx.prisma.passkeyChallenge.findFirst({
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
        const userProfile = await ctx.prisma.userProfile.findUnique({
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
        const passkey = await ctx.prisma.passkey.create({
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
        await ctx.prisma.passkeyChallenge.deleteMany({
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
    }),

  // Add authentication endpoints
  startAuthentication: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        let userPasskeys: { id: string; credentialId: string; publicKey: string; signCount: number }[] = [];
        
        if (input.email) {
          // If email is provided, find the user's passkeys
          const userProfile = await ctx.prisma.userProfile.findFirst({
            where: { supEmail: input.email },
          });
          
          if (userProfile) {
            userPasskeys = await ctx.prisma.passkey.findMany({
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
        await ctx.prisma.passkeyChallenge.upsert({
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { credentialId, userHandle, challenge } = input;
      const supabase = await createServerClient();
      
      try {
        // Find the challenge - make sure it's an AUTHENTICATION challenge
        const challengeRecord = await ctx.prisma.passkeyChallenge.findFirst({
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
          
          passkey = await ctx.prisma.passkey.findFirst({
            where: {
              credentialId: credentialId,
            },
          });
        } else if (userHandle) {
          // If no credentialId but userHandle is provided, try to find by userId
          passkey = await ctx.prisma.passkey.findFirst({
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
        const userProfile = await ctx.prisma.userProfile.findUnique({
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
            await ctx.prisma.passkey.update({
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
        try {
          const accessToken = createWebAuthnAccessTokenForUser(userProfile);
          const refreshToken = createWebAuthnRefreshTokenForUser(userProfile);
          
          const deviceNonce = ctx?.session?.deviceNonce || crypto.randomUUID();
          
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
          
          // Clean up the used challenge
          await ctx.prisma.passkeyChallenge.delete({
            where: {
              id: challengeRecord.id,
            },
          });
          
          return {
            verified: true,
            userId: passkey.userId,
            user: userProfile,
            session: sessionData.session,
            deviceNonce,
          };
        } catch (tokenError) {
          console.error("Token creation error:", tokenError);
          
          return {
            verified: true,
            userId: passkey.userId,
            user: userProfile,
            message: "Authentication successful, but token creation failed.",
          };
        }
      } catch (error) {
        console.error("Authentication error:", error);
        throw error;
      }
    }),

  finalizePasskey: publicProcedure
    .input(
      z.object({
        verificationId: z.string(),
        email: z.string().email(),
        sessionToken: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { verificationId, email, sessionToken } = input;
      const supabase = await createServerClient();
      
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
        const credentialRecord = await ctx.prisma.passkeyChallenge.findFirst({
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
        const userProfile = await ctx.prisma.userProfile.findFirst({
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
        await ctx.prisma.passkey.create({
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
        
        // Create tokens for the user
        const accessToken = createWebAuthnAccessTokenForUser(userProfile);
        const refreshToken = createWebAuthnRefreshTokenForUser(userProfile);
        
        // Set the session in Supabase
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
        
        // Get request information from context
        const deviceNonce = ctx?.session?.deviceNonce || crypto.randomUUID();
        const userAgent = ctx?.session?.userAgent || "";
        const ip = ctx?.session?.ip;
        
        // Create a session in our database
        await ctx.prisma.session.create({
          data: {
            userId: userProfile.supId,
            deviceNonce,
            ip,
            userAgent,
          },
        });
        
        // Clean up challenge
        await ctx.prisma.passkeyChallenge.delete({
          where: {
            id: credentialRecord.id,
          },
        });
        
        return {
          verified: true,
          userId: userProfile.supId,
          session: sessionData.session,
          deviceNonce,
        };
      } catch (error) {
        console.error("Finalize passkey error:", error);
        throw error;
      }
    }),
};
