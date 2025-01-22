// src/server/routers/passkeys.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { supabase } from "@/lib/supabaseClient";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "@/server/trpc";
import {
  relyingPartyID,
  relyingPartyName,
  relyingPartyOrigin,
} from "@/services/webauthnConfig";

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export const passkeysRoutes = {
  startRegistration: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        userEmail: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, userEmail } = input;

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
      const { error } = await supabase.from("Challenges").insert({
        type: "SIGNATURE",
        purpose: "ACCOUNT_RECOVERY",
        value: options.challenge,
        user_id: userId,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

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
      const { data: challenge, error: challengeError } = await supabase
        .from("Challenges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challenge) {
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

      if (!verification.verified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Verification failed",
        });
      }

      // Save the credential
      const { error: saveError } = await supabase.from("AuthMethods").insert({
        user_id: userId,
        provider_id: verification.registrationInfo?.credential.id,
        public_key: verification.registrationInfo?.credential.publicKey,
        sign_count: verification.registrationInfo?.credential.counter,
        provider_label: `Passkey created ${new Date().toLocaleString()}`,
        provider_type: "PASSKEYS",
      });

      if (saveError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: saveError.message,
        });
      }

      // Delete the challenge
      await supabase.from("Challenges").delete().eq("id", challenge.id);

      return { verified: true };
    }),
};
