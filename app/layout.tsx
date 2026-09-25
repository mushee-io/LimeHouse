import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LimeBay — Professional DeFi on Ultra",
  description: "Trade UOS and LIME, explore liquidity, and use LimeBay on Ultra Testnet.",
  keywords: ["LimeBay", "Ultra", "DEX", "AMM", "DeFi", "UOS", "LIME", "liquidity"]
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
