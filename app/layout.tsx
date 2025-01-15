"use client"

import { trpc } from "@/utils/trpc"

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export default trpc.withTRPC(RootLayout)

