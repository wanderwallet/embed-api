import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { CloudProvider } from "@prisma/client";

export const UpdateCloudBackupInputSchema = z.object({
  walletId: z.string().uuid(),
  fileId: z.string().min(1).max(255).optional(),
  provider: z.nativeEnum(CloudProvider).optional(),
  email: z.string().email().max(255).optional(),
});

export const updateCloudBackup = protectedProcedure
  .input(UpdateCloudBackupInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Verify the user owns the wallet and the backup exists
    const existingBackup = await ctx.prisma.cloudBackup.findFirst({
      where: {
        walletId: input.walletId,
        wallet: {
          userId: ctx.user.id,
        },
      },
    });

    if (!existingBackup) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.CLOUD_BACKUP_NOT_FOUND,
      });
    }

    // Prepare update data (only include fields that are provided)
    const updateData: {
      fileId?: string;
      provider?: CloudProvider;
      email?: string;
    } = {};

    if (input.fileId !== undefined) updateData.fileId = input.fileId;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.email !== undefined) updateData.email = input.email;

    // Update the cloud backup
    const cloudBackup = await ctx.prisma.cloudBackup.update({
      where: {
        id: existingBackup.id,
      },
      data: updateData,
    });

    return { cloudBackup };
  });
