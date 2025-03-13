// src/server/routers/passkeys.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "@/server/trpc";
import {
  relyingPartyID,
  relyingPartyName,
  relyingPartyOrigin,
} from "@/server/services/webauthnConfig";
import { 
  stringToUint8Array,
  uint8ArrayToString
} from "@/server/services/auth";
import { createServerClient } from "@/server/utils/supabase/supabase-server-client";
import { prisma } from "@/server/utils/prisma/prisma-client";

export const passkeysRoutes = {
  // Start registration without requiring a pre-existing user
  startRegistration: publicProcedure
    .mutation(async () => {
      // Generate a temporary UUID for this registration attempt
      const tempUserId = crypto.randomUUID();
      
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
      await prisma.passkeyChallenge.create({
        data: {
          userId: tempUserId,
          value: options.challenge,
          createdAt: new Date(),
          version: "1" // In case we need to change the challenge format
        }
      });

      // Return both the options and the temporary user ID
      return {
        options,
        tempUserId
      };
    }),

  verifyRegistration: publicProcedure
    .input(
      z.object({
        tempUserId: z.string(),
        attestationResponse: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { tempUserId, attestationResponse } = input;
      const supabase = await createServerClient();

      try {
        // Get the challenge from the database
        const challenge = await prisma.passkeyChallenge.findFirst({
          where: {
            userId: tempUserId
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!challenge) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
        }

        // Check if challenge is expired (e.g., 5 minutes)
        const challengeAge = Date.now() - challenge.createdAt.getTime();
        if (challengeAge > 5 * 60 * 1000) {
          // Delete expired challenge
          await prisma.passkeyChallenge.delete({
            where: { id: challenge.id }
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge expired" });
        }

        // Store the challenge value and immediately delete the challenge from the database
        const challengeValue = challenge.value;
        await prisma.passkeyChallenge.delete({
          where: { id: challenge.id }
        });

        // Verify the response
        const verification = await verifyRegistrationResponse({
          response: attestationResponse,
          expectedChallenge: challengeValue,
          expectedOrigin: relyingPartyOrigin,
          expectedRPID: relyingPartyID,
        });

        if (!verification.verified || !verification.registrationInfo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Verification failed",
          });
        }

        // Use a more widely accepted test domain
        // const validEmail = `passkey_${tempUserId.substring(0, 8)}@communitylabs.com`;
        const validEmail = `milagan@communitylabs.com`;
        
        // Generate a secure random password (at least 8 characters)
        const password = `Pass${Math.random().toString(36).slice(2, 10)}!1A`;
        
        // Use signUp instead of admin.createUser
        const { data: authUser, error: createUserError } = await supabase.auth.signUp({
          email: validEmail,
          password: password,
          phone: "+1234567890",
          options: {
            data: {
              auth_method: 'passkey',
              registration_date: new Date().toISOString(),
              is_passkey_user: true,
              email_confirmed_at: new Date().toISOString(),
              phone_confirmed_at: new Date().toISOString(),
              confirmation_sent_at: new Date().toISOString(),
            }
          }
        });

        if (createUserError || !authUser.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create auth user: ${createUserError?.message || 'Unknown error'}`,
          });
        }

        // The UserProfile should be created automatically via Supabase triggers/hooks
        // But we can ensure it exists and has the right data
        const userProfile = await prisma.userProfile.upsert({
          where: { supId: authUser.user.id },
          update: {
            updatedAt: new Date()
          },
          create: {
            supId: authUser.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Save the credential to Passkey table
        await prisma.passkey.create({
          data: {
            credentialId: verification.registrationInfo.credential.id,
            publicKey: uint8ArrayToString(verification.registrationInfo.credential.publicKey),
            signCount: verification.registrationInfo.credential.counter,
            label: `Passkey created ${new Date().toLocaleString()}`,
            userId: userProfile.supId,
          },
        });

        return { 
          verified: true,
          userId: userProfile.supId,
        };
      } catch (error) {
        // Re-throw the error
        throw error;
      }
    }),

  // Add authentication endpoints
  startAuthentication: publicProcedure
    .mutation(async () => {
      const options = await generateAuthenticationOptions({
        rpID: relyingPartyID,
        userVerification: "preferred",
        // No allowCredentials since we want to allow any registered passkey
      });

      // Store the challenge temporarily
      const tempId = crypto.randomUUID();
      await prisma.passkeyChallenge.create({
        data: {
          userId: tempId, // This is just a placeholder, not a real user ID
          value: options.challenge,
          createdAt: new Date(),
          version: "1" // In case we need to change the challenge format
        }
      });

      return {
        options,
        tempId
      };
    }),

  verifyAuthentication: publicProcedure
    .input(
      z.object({
        tempId: z.string(),
        authenticationResponse: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { tempId, authenticationResponse } = input;

      try {
        // Get the challenge
        const challenge = await prisma.passkeyChallenge.findFirst({
          where: {
            userId: tempId
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!challenge) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
        }

        // Check if challenge is expired (e.g., 5 minutes)
        const challengeAge = Date.now() - challenge.createdAt.getTime();
        if (challengeAge > 5 * 60 * 1000) {
          // Delete expired challenge
          await prisma.passkeyChallenge.delete({
            where: { id: challenge.id }
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge expired" });
        }

        // Store the challenge value and immediately delete the challenge from the database
        const challengeValue = challenge.value;
        await prisma.passkeyChallenge.delete({
          where: { id: challenge.id }
        });

        // Find the passkey by credential ID
        const passkey = await prisma.passkey.findFirst({
          where: {
            credentialId: authenticationResponse.id
          },
          include: {
            UserProfile: true
          }
        });

        if (!passkey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Passkey not found" });
        }

        // Verify the authentication response
        const verification = await verifyAuthenticationResponse({
          response: authenticationResponse,
          expectedChallenge: challengeValue,
          expectedOrigin: relyingPartyOrigin,
          expectedRPID: relyingPartyID,
          credential: {
            id: passkey.credentialId,
            publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
            counter: passkey.signCount,
          },
        });

        if (!verification.verified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Authentication failed",
          });
        }

        // Update the passkey's sign count and last used timestamp
        await prisma.passkey.update({
          where: { id: passkey.id },
          data: {
            signCount: verification.authenticationInfo.newCounter,
            lastUsedAt: new Date()
          }
        });

        return {
          verified: true,
          userId: passkey.userId,
          user: passkey.UserProfile
        };
      } catch (error) {
        throw error;
      }
    }),
};
