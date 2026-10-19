import type { Metadata } from "next";
import "./globals.css";
import "./vaultshield.css";

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
      <head>
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
