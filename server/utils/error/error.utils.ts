import { ZodError } from "zod";

export function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError;
}

export function getZodErrorMessage(err: ZodError) {
  return err.message || err.name || "Unexpected error";
}

export function getErrorMessage(err: unknown) {
  return isZodError(err)
    ? (err.message || err.name || "Unexpected error")
    : "Unexpected error";
}
