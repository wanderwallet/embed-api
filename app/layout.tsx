import "./globals.css";
import { Metadata } from "next";
import Providers from "@/client/components/Providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
