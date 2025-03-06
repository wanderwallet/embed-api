import "./globals.css";
import { Metadata } from "next";
import AuthProvider from "@/client/components/AuthProvider";
import AuthGuard from "@/client/components/AuthGuard";

export const metadata: Metadata = {
  title: "Wander Embedded",
  description: "Set up teams and apps for your embedded wallet",
  icons: {
    icon: "favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
