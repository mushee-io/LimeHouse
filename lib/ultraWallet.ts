import { UltraWalletSDK } from "@ultraos/wallet-sdk";

let instance: UltraWalletSDK | undefined;

export type UltraAction = {
  contract: string;
  action: string;
  data: Record<string, unknown>;
  authorization?: Array<{ actor: string; permission: string }>;
};

export function getUltraWallet() {
  if (typeof window === "undefined") {
    throw new Error("Ultra Wallet is only available in the browser.");
  }

  if (!instance) {
    instance = new UltraWalletSDK({
      environment: "testnet",
      provider: "extension"
    });
  }

  return instance;
}

export async function connectUltraWallet() {
  const wallet = getUltraWallet();
  const response = await wallet.connect();
  return response.data;
}

export async function disconnectUltraWallet() {
  const wallet = getUltraWallet();
  await wallet.disconnect();
}

export async function signUltraTransaction(transaction: UltraAction | UltraAction[]) {
  const wallet = getUltraWallet();
  return wallet.signTransaction(transaction);
}
