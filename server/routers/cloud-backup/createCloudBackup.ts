import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ErrorMessages } from "@/server/utils/error/error.constants";
import { CloudProvider } from "@prisma/client";
import { DbWallet } from "@/prisma/types/types";

export const CreateCloudBackupInputSchema = z.object({
  walletId: z.string().uuid(),
  fileId: z.string().min(1).max(255),
  provider: z.nativeEnum(CloudProvider),
  email: z.string().email().max(255).nullable(),
});

export const createCloudBackup = protectedProcedure
  .input(CreateCloudBackupInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Verify the user owns the wallet
    const userWallet = await ctx.prisma.wallet.findFirst({
      select: { id: true },
      where: {
        id: input.walletId,
        userId: ctx.user.id,
      },
    });

    if (!userWallet) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ErrorMessages.WALLET_NOT_FOUND,
      });
    }

    // Check if wallet already has a cloud backup
    const existingBackup = await ctx.prisma.cloudBackup.findFirst({
      where: {
        walletId: input.walletId,
      },
    });

    if (existingBackup) {
      throw new TRPCError({
        code: "CONFLICT",
        message: ErrorMessages.CLOUD_BACKUP_ALREADY_EXISTS,
      });
    }

    // Create the cloud backup and update wallet stats
    const [cloudBackup, wallet] = await ctx.prisma.$transaction(async (tx) => {
      const dateNow = new Date();

      const cloudBackupPromise = tx.cloudBackup.create({
        data: {
          fileId: input.fileId,
          provider: input.provider,
          walletId: input.walletId,
          email: input.email,
        },
      });

      const updateWalletStatsPromise = tx.wallet.update({
        where: {
          id: input.walletId,
          userId: ctx.user.id,
        },
        data: {
          canBeRecovered: true,
          lastCloudBackedUpAt: dateNow,
          totalCloudBackups: { increment: 1 },
        },
      });

      return Promise.all([cloudBackupPromise, updateWalletStatsPromise]);
    });

    return { cloudBackup, wallet: wallet as DbWallet };
  });
