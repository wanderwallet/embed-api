// src/server/routers/passkeys.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "@/server/trpc";
import {
  relyingPartyID,
  relyingPartyName,
  relyingPartyOrigin,
} from "@/server/services/webauthnConfig";
import { PrismaClient } from "@prisma/client";
import { 
  createChallenge, 
  getLatestChallenge, 
  validateChallenge, 
  deleteChallenge,
  stringToUint8Array,
  uint8ArrayToString
} from "@/server/services/auth";

const prisma = new PrismaClient();

export const passkeysRoutes = {
  startRegistration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        userEmail: z.string(),
        walletId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, userEmail, walletId } = input;

      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName: relyingPartyName,
        rpID: relyingPartyID,
        userID: stringToUint8Array(userId),
        userName: userEmail,
        attestationType: "direct",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      // Store challenge using the shared utility
      await createChallenge(userId, walletId, options.challenge);

      return options;
    }),
  verifyRegistration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        attestationResponse: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, attestationResponse } = input;

      try {
        // Get and validate the challenge using shared utilities
        const challenge = await getLatestChallenge(userId);
        await validateChallenge(challenge);

        if (!challenge) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
        }

        // Verify the response
        const verification = await verifyRegistrationResponse({
          response: attestationResponse,
          expectedChallenge: challenge.value,
          expectedOrigin: relyingPartyOrigin,
          expectedRPID: relyingPartyID,
        });

        if (!verification.verified || !verification.registrationInfo) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Verification failed",
          });
        }

        // Save the credential to Passkey table
        await prisma.passkey.create({
          data: {
            credentialId: verification.registrationInfo.credential.id,
            publicKey: uint8ArrayToString(verification.registrationInfo.credential.publicKey),
            signCount: verification.registrationInfo.credential.counter,
            label: `Passkey created ${new Date().toLocaleString()}`,
            userId: userId,
          },
        });

        // Delete the challenge using shared utility
        await deleteChallenge(challenge.id);

        return { verified: true };
      } catch (error) {
        // Re-throw the error
        throw error;
      }
    }),
};
