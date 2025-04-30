import { Context } from "@/server/context";
import { PrismaClient, Prisma } from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export async function getDeviceAndLocationId(ctx: Context) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  // Look for existing device and location first
  let deviceAndLocation = await ctx.prisma.deviceAndLocation.findFirst({
    where: {
      userId: ctx.user.id,
      deviceNonce: ctx.session.deviceNonce,
      ip: ctx.session.ip,
      userAgent: ctx.session.userAgent
    },
    select: {
      id: true
    }
  });

  // If not found, create a new one
  if (!deviceAndLocation) {
    deviceAndLocation = await ctx.prisma.deviceAndLocation.create({
      data: {
        deviceNonce: ctx.session.deviceNonce,
        ip: ctx.session.ip,
        userAgent: ctx.session.userAgent,
        userId: ctx.user.id,
        createdAt: new Date()
      },
      select: {
        id: true
      }
    });
  }
  
  return deviceAndLocation.id;
}

export async function getDeviceAndLocationConnectOrCreate(ctx: Context) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  // TODO: Get ip, userAgent, applicationId...
  return {
    connectOrCreate: {
      where: {
        userDevice: {
          userId: ctx.user.id,
          deviceNonce: ctx.session.deviceNonce,
          ip: ctx.session.ip,
          userAgent: ctx.session.userAgent,
        },
      },
      create: {
        deviceNonce: ctx.session.deviceNonce,
        ip: ctx.session.ip,
        userAgent: ctx.session.userAgent,
        userId: ctx.user.id,
        applicationId: null,
      },
    },
  };
}
