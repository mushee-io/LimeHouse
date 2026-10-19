import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  title: "LimeHouse — Trade and Swap on Ultra",
  description: "Explore LimeHouse, the Ultra-native DEX. Trade, swap tokens, explore liquidity pools, and manage your DeFi portfolio."
};

export default function Page() {
  return <HomePage />;
}
