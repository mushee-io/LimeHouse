"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { connectUltraWallet, disconnectUltraWallet } from "@/lib/ultraWallet";

type WalletState = {
  account: string;
  busy: boolean;
  error: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

function errorMessage(error: unknown): string {
  return error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message)
    : "Ultra Wallet could not complete the request.";
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = await connectUltraWallet();
      setAccount(result.blockchainid);
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await disconnectUltraWallet();
      setAccount("");
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(""), []);
  const value = useMemo(() => ({ account, busy, error, connect, disconnect, clearError }), [account, busy, error, connect, disconnect, clearError]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useUltraWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useUltraWallet must be used within WalletProvider");
  return context;
}
