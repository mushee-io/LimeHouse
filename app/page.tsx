import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

export const metadata: Metadata = {
  title: "VaultShield — Lock Down Your Passwords",
  description: "VaultShield password manager: zero stress, total control, and a simpler security-first experience."
};

export default function Page() {
  return <HomePage />;
}
