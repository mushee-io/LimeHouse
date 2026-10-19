import type { Metadata } from "next";
import "./globals.css";
import "./vaultshield.css";
import "./dex.css";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "LimeHouse — Decentralized Exchange on Ultra",
  description: "Trade and swap tokens, explore liquidity pools, and use LimeHouse on Ultra.",
  keywords: ["LimeHouse", "Ultra", "DEX", "AMM", "DeFi", "UOS", "LIME", "liquidity"]
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
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  );
}
