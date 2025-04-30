import { Context } from "@/server/context";

export async function getUserProfile(ctx: Context) {
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
  
  if (!existingProfile) {
    throw new Error(`User profile not found for user ID: ${ctx.user.id}`); 
  }

  // If user profile exists, return a connect object
  return {
    connect: {
      supId: ctx.user.id,
    },
  };
}
