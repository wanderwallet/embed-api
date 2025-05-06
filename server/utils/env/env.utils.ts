export function ensureIsServer(filename: string ) {
  if (typeof window !== "undefined") {
    throw new Error(`"${ filename }" should only be loaded on the server.`);
  }
}
