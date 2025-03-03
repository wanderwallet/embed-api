import { Context } from "@/server/context";
import { PrismaClient } from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";

export function getDeviceAndLocationId(
  ctx: Context,
  prismaClient: Omit<PrismaClient, ITXClientDenyList> = ctx.prisma
) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  // TODO: Get ip, countryCode, userAgent, applicationId...

  return prismaClient.deviceAndLocation
    .upsert({
      select: {
        id: true,
      },
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
        countryCode: "",
        userAgent: ctx.session.userAgent,
        userId: ctx.user.id,
        applicationId: null,
      },
      update: {},
    })
    .then((result) => result.id);
}

export function getDeviceAndLocationConnectOrCreate(
  ctx: Context,
) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  // TODO: Get ip, countryCode, userAgent, applicationId...

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
        countryCode: "",
        userAgent: ctx.session.userAgent,
        userId: ctx.user.id,
        applicationId: null,
      },
    },
  };
}
