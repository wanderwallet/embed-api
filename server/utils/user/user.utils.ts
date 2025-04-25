import { Context } from "@/server/context";
import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export async function getUserConnectOrCreate(ctx: Context) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  // First check if the user profile exists
  const existingProfile = await ctx.prisma.userProfile.findUnique({
    select: {
      supId: true,
    },
    where: {
      supId: ctx.user.id,
    },
  });
  
  // If user profile exists, return a connect object
  if (existingProfile) {
    return {
      connect: {
        supId: ctx.user.id,
      },
    };
  }
  
  // If not found, return a create object with minimal required fields
  return {
    create: {
      supId: ctx.user.id,
      email: ctx.user.email,
      updatedAt: new Date(),
    },
  };
}
