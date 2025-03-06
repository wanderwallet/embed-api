import { publicProcedure } from "../trpc";
import { z } from "zod";
import { validateApplication } from "../utils/validation/validation.utils";

export const validationRouter = {
  validateApplication: publicProcedure
    .input(
      z.object({
        clientId: z.string(),
        applicationOrigin: z.string().url(),
        sessionId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { clientId, applicationOrigin, sessionId } = input;
      return validateApplication(clientId, applicationOrigin, sessionId);
    }),
};
