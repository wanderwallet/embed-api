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
import { ChallengePurpose, ChallengeType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function uint8ArrayToString(array: Uint8Array): string {
  return Buffer.from(array).toString();
}

function stringToUint8Array(str: string): Uint8Array {
  return Buffer.from(str);
}

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

      // Store challenge in the database
      await prisma.challenge.create({
        data: {
          type: ChallengeType.SIGNATURE,
          purpose: ChallengePurpose.AUTHENTICATION,
          value: options.challenge,
          version: "1.0",
          userId: userId,
          walletId: walletId,
        },
      });

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

      // Retrieve the challenge
      const challenge = await prisma.challenge.findFirst({
        where: {
          userId: userId,
          purpose: ChallengePurpose.ACCOUNT_RECOVERY,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
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

      // Save the credential to the new Passkey table
      await prisma.passkey.create({
        data: {
          credentialId: verification.registrationInfo.credential.id,
          publicKey: uint8ArrayToString(verification.registrationInfo.credential.publicKey),
          signCount: verification.registrationInfo.credential.counter,
          label: `Passkey created ${new Date().toLocaleString()}`,
          userId: userId,
        },
      });

      // Delete the challenge
      await prisma.challenge.delete({
        where: {
          id: challenge.id,
        },
      });

      return { verified: true };
    }),
};
