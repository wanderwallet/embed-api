import { Context } from "@/server/context";

export function getUserConnectOrCreate(
  ctx: Context,
) {
  if (!ctx.user) {
    throw new Error("Missing `ctx.user`");
  }

  return {
    connect: {
      supId: ctx.user.id,
    },
  };
}
