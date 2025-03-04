import { publicProcedure } from "../trpc";
import { z } from "zod";
import { validateApplication } from "../utils/validation/validation.utils";

export const validationRouter = {
  validateApplication: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        clientId: z.string(),
        applicationOrigin: z.string().url(),
        sessionId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { applicationId, clientId, applicationOrigin, sessionId } = input;
      return validateApplication(
        applicationId,
        clientId,
        applicationOrigin,
        sessionId
      );
    }),
};
