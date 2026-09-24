import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lime B — Ultra DEX",
  description: "Swap and provide liquidity on Ultra."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
