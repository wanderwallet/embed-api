"use client";

import { trpc } from "@/client/utils/trpc/trpc-client";
import { Toaster } from "sonner";
import AuthGuard from "@/client/components/AuthGuard";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" richColors />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}

export default trpc.withTRPC(Providers);
