import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lime B — The Exchange for the Ultra Economy",
  description: "Trade UOS and LIME, explore live liquidity and use the Lime B AMM on Ultra Testnet.",
  keywords: ["Lime B", "Ultra", "DEX", "DeFi", "UOS", "LIME", "liquidity"]
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
