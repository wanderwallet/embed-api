"use client"

import { trpc } from "@/client/utils/trpc/trpc-client-client"

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export default trpc.withTRPC(RootLayout)

