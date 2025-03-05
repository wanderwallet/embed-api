"use client";

import "./globals.css";

import { trpc } from "@/client/utils/trpc/trpc-client";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default trpc.withTRPC(RootLayout);
