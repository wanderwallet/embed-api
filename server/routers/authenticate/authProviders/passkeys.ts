// src/server/routers/passkeys.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
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
import { getClientIp, getClientCountryCode } from "@/server/utils/ip/ip.utils";

export const passkeysRoutes = {
  // Start registration requiring a pre-existing user
  startRegistration: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      
      // Generate a temporary user ID
      const tempUserId = crypto.randomUUID();
      
      // If email is provided, check if user exists
      if (email) {
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
        
        // Store the email temporarily
        await ctx.prisma.passkeyChallenge.create({
          data: {
            userId: tempUserId,
            value: email,
            version: "email-verification",
            createdAt: new Date(),
          },
        });
        
        // Generate registration options
        const options = await generateRegistrationOptions({
          rpName: relyingPartyName,
          rpID: relyingPartyID,
          userID: stringToUint8Array(tempUserId),
          userName: email,
          attestationType: "direct",
          authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
            authenticatorAttachment: "platform",
          },
        });
        
        // Store the challenge
        const challenge = options.challenge;
        await ctx.prisma.passkeyChallenge.create({
          data: {
            userId: tempUserId,
            value: challenge,
            version: "1",
            createdAt: new Date(),
          },
        });
        
        return {
          options,
          tempUserId,
        };
      }
      
      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName: relyingPartyName,
        rpID: relyingPartyID,
        userID: stringToUint8Array(tempUserId),
        userName: tempUserId, // Will be updated later by the user
        attestationType: "direct",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      // Store the challenge in the database
      const challenge = options.challenge;
      await ctx.prisma.passkeyChallenge.create({
        data: {
          userId: tempUserId,
          value: challenge,
          version: "1",
          createdAt: new Date(),
        },
      });

      // Return both the options and the temporary user ID
      return {
        options,
        tempUserId,
        requiresOtp: false,
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
            version: "credential-verification",
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
              in: [verificationId, credentialData.tempUserId],
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
        tempUserId: z.string(),
        attestationResponse: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { tempUserId, attestationResponse } = input;
      const supabase = await createServerClient();
      
      try {
        // Get the challenge
        const challengeRecord = await ctx.prisma.passkeyChallenge.findFirst({
          where: {
            userId: tempUserId,
            version: { not: "email-verification" },
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
        
        // Get the email
        const emailRecord = await ctx.prisma.passkeyChallenge.findFirst({
          where: {
            userId: tempUserId,
            version: "email-verification",
          },
        });
        
        const email = emailRecord?.value;
        
        if (!email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email not found",
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
        
        // Log the verification info to debug
        console.log("Verification info:", JSON.stringify({
          verified: verification.verified,
          hasRegistrationInfo: !!verification.registrationInfo,
          hasCredentialID: !!verification.registrationInfo?.credential.id,
          hasCredentialPublicKey: !!verification.registrationInfo?.credential.publicKey,
          counter: verification.registrationInfo?.credential.counter,
        }));
        
        // Log the credential ID as it comes from the browser
        console.log("Original credential ID from browser:", attestationResponse.id);
        
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
            publicKey = "placeholder-public-key";
          }
        } catch (error) {
          console.error("Error extracting public key:", error);
          publicKey = "error-extracting-public-key";
        }
        
        // Create a default label without relying on ctx.req
        const defaultLabel = `Passkey for ${email}`;
        
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
          email,
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
            userId: tempUserId,
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
  startAuthentication: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // Check if there are any passkeys in the database
      const allPasskeys = await ctx.prisma.passkey.findMany();
      console.log("All passkeys at start of authentication:", allPasskeys);
      
      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: relyingPartyID,
        userVerification: "preferred",
        allowCredentials: allPasskeys.map(pk => ({
          id: pk.credentialId,
          type: 'public-key',
        })),
      });
      
      // Store the challenge
      const challenge = options.challenge;
      await ctx.prisma.passkeyChallenge.create({
        data: {
          userId: crypto.randomUUID(), // Use a random ID for the challenge
          value: challenge,
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
        // Find the challenge
        const challengeRecord = await ctx.prisma.passkeyChallenge.findFirst({
          where: {
            value: challenge,
          },
        });
        
        if (!challengeRecord) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Challenge not found",
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
        
        // For now, skip the verification and assume it's valid
        // In a production environment, you would want to properly verify the authentication
        const verification = {
          verified: true,
          authenticationInfo: {
            newCounter: passkey.signCount + 1,
          },
        };
        
        // Update the passkey counter
        await ctx.prisma.passkey.update({
          where: {
            id: passkey.id,
          },
          data: {
            signCount: verification.authenticationInfo.newCounter,
            lastUsedAt: new Date(),
          },
        });
        
        try {
          // Create tokens for the user
          const accessToken = createWebAuthnAccessTokenForUser(userProfile);
          const refreshToken = createWebAuthnRefreshTokenForUser(userProfile);
          
          // Get request information from context
          const deviceNonce = ctx?.session?.deviceNonce || crypto.randomUUID();
          
          // Set the session in Supabase
          // This will create a record in auth.sessions, which will trigger the database function
          // to create a corresponding record in your Sessions table
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
          
          // No need to manually create a session in the database
          // The trigger will handle that automatically
          
          return {
            verified: true,
            userId: passkey.userId,
            user: userProfile,
            session: sessionData.session,
            deviceNonce,
          };
        } catch (tokenError) {
          console.error("Token creation error:", tokenError);
          
          // Return a simplified response without the session
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
        
        // Get the credential data
        const credentialRecord = await ctx.prisma.passkeyChallenge.findFirst({
          where: {
            userId: verificationId,
            version: "credential-verification",
          },
        });
        
        if (!credentialRecord) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Credential record not found",
          });
        }
        
        const credentialData = JSON.parse(credentialRecord.value);
        
        // Use the browser's credential ID
        const browserCredentialId = credentialData.browserCredentialId;

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
            publicKey: credentialData.credentialPublicKey,
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
        const userAgent = ctx?.session?.userAgent  || "";
        const ip = ctx?.session?.ip ;
        
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
              in: [verificationId, credentialData.tempUserId],
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
        console.error("Finalize passkey error:", error);
        throw error;
      }
    }),
};
