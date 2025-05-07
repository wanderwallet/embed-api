import { Context } from "@/server/context";
import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export async function getDeviceAndLocationId(
  ctx: Context,
  prismaClient: Omit<PrismaClient, ITXClientDenyList> = ctx.prisma
) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }
  
  // First try to find the existing record
  const existingRecord = await prismaClient.deviceAndLocation.findUnique({
    select: { id: true },
    where: {
      userDevice: {
        userId: ctx.user.id,
        deviceNonce: ctx.session.deviceNonce,
        ip: ctx.session.ip,
        userAgent: ctx.session.userAgent,
      },
    },
  });
  
  if (existingRecord) {
    return existingRecord.id;
  }
  
  // If not found, create a new record
  try {
    const newRecord = await prismaClient.deviceAndLocation.create({
      select: { id: true },
      data: {
        deviceNonce: ctx.session.deviceNonce,
        ip: ctx.session.ip,
        userAgent: ctx.session.userAgent,
        userId: ctx.user.id,
        applicationId: null,
      },
    });
    return newRecord.id;
  } catch (error) {
    // If there's a race condition and another request created the record,
    // try to fetch it one more time
    const retryRecord = await prismaClient.deviceAndLocation.findUnique({
      select: { id: true },
      where: {
        userDevice: {
          userId: ctx.user.id,
          deviceNonce: ctx.session.deviceNonce,
          ip: ctx.session.ip,
          userAgent: ctx.session.userAgent,
        },
      },
    });
    
    if (retryRecord) {
      return retryRecord.id;
    }
    
    // If we still can't find it, rethrow the error
    throw error;
  }
}

export function getDeviceAndLocationConnectOrCreate(ctx: Context) {
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
