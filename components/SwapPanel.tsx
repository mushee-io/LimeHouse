"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LimeLogo from "@/components/LimeLogo";
import { LIMEB_CONTRACT, LIME_TOKEN_CONTRACT } from "@/lib/config";
import {
  decimalToUnits,
  fetchPool0,
  parseAsset,
  PoolRow,
  quotePool,
  unitsToAsset
} from "@/lib/ultraRpc";
import { connectUltraWallet, signUltraTransaction } from "@/lib/ultraWallet";

type Token = {
  symbol: "UOS" | "LIME";
  name: string;
  precision: number;
};

const TOKENS: Token[] = [
  { symbol: "UOS", name: "Ultra", precision: 8 },
  { symbol: "LIME", name: "Lime B", precision: 6 }
];

function TokenIcon({ token }: { token: Token }) {
  return token.symbol === "UOS" ? (
    <span className="app-token-icon uos">U</span>
  ) : (
    <span className="app-token-icon lime"><LimeLogo compact /></span>
  );
}

function Picker({
  value,
  exclude,
  onChange
}: {
  value: Token;
  exclude: string;
  onChange: (token: Token) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-token-picker-wrap">
      <button type="button" className="app-token-picker" onClick={() => setOpen((v) => !v)}>
        <TokenIcon token={value} />
        <strong>{value.symbol}</strong>
        <span>⌄</span>
      </button>
      {open && (
        <div className="app-token-menu">
          {TOKENS.filter((token) => token.symbol !== exclude).map((token) => (
            <button
              key={token.symbol}
              type="button"
              onClick={() => {
                onChange(token);
                setOpen(false);
              }}
            >
              <TokenIcon token={token} />
              <span><strong>{token.symbol}</strong><small>{token.name}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function hasLiquidity(pool: PoolRow | null) {
  if (!pool) return false;
  try {
    return parseAsset(pool.reserve0).units > 0n && parseAsset(pool.reserve1).units > 0n;
  } catch {
    return false;
  }
}

export default function SwapPanel({ compact = false }: { compact?: boolean }) {
  const [pool, setPool] = useState<PoolRow | null>(null);
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const refresh = useCallback(async () => {
    try {
      setPool(await fetchPool0());
    } catch {
      setPool(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const liquid = hasLiquidity(pool);

  const quote = useMemo(() => {
    if (!pool || !amount) return null;
    try {
      const reserve0 = parseAsset(pool.reserve0);
      const reserve1 = parseAsset(pool.reserve1);
      const inputReserve = reserve0.symbol === tokenIn.symbol ? reserve0 : reserve1;
      if (inputReserve.symbol !== tokenIn.symbol) return null;
      const units = decimalToUnits(amount, inputReserve.precision);
      if (units <= 0n) return null;
      return quotePool(pool, tokenIn.symbol, units);
    } catch {
      return null;
    }
  }, [amount, pool, tokenIn.symbol]);

  const estimate = useMemo(() => {
    if (!amount) return "";
    if (!quote || quote.output <= 0n) return "—";
    return Number(
      unitsToAsset(quote.output, quote.outputAsset.precision, quote.outputAsset.symbol).split(" ")[0]
    ).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, quote]);

  const ratio = useMemo(() => {
    if (!pool || !liquid) return "—";
    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      const u = Number(uos.units) / 10 ** uos.precision;
      const l = Number(lime.units) / 10 ** lime.precision;
      return u > 0 ? `1 UOS = ${(l / u).toLocaleString(undefined, { maximumFractionDigits: 4 })} LIME` : "—";
    } catch {
      return "—";
    }
  }, [pool, liquid]);

  async function connect() {
    setBusy(true);
    setNotice("");
    try {
      const data = await connectUltraWallet();
      setAccount(data.blockchainid);
    } catch (error) {
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Ultra Wallet could not connect."
      );
    } finally {
      setBusy(false);
    }
  }

  async function execute() {
    if (!account) {
      await connect();
      return;
    }

    if (!pool || !pool.enabled || !liquid) {
      setNotice("Pool 0 is unavailable.");
      return;
    }

    if (!quote || quote.output <= 0n) {
      setNotice("Enter a valid amount.");
      return;
    }

    try {
      const inputUnits = decimalToUnits(amount, quote.inputAsset.precision);
      const amountIn = unitsToAsset(inputUnits, quote.inputAsset.precision, quote.inputAsset.symbol);
      const slippageBps = Math.max(0, Math.min(9999, Math.round(Number(slippage) * 100)));
      const minOutUnits = (quote.output * BigInt(10000 - slippageBps)) / 10000n;
      const minOut = unitsToAsset(minOutUnits, quote.outputAsset.precision, quote.outputAsset.symbol);

      setBusy(true);
      setNotice("Approve the Lime B swap in Ultra Wallet.");

      const response = await signUltraTransaction([
        {
          contract: quote.inputAsset.symbol === "UOS" ? "eosio.token" : LIME_TOKEN_CONTRACT,
          action: "transfer",
          data: {
            from: account,
            to: LIMEB_CONTRACT,
            quantity: amountIn,
            memo: "Lime B swap deposit"
          }
        },
        {
          contract: LIMEB_CONTRACT,
          action: "swap",
          data: {
            user: account,
            pool_id: Number(pool.id),
            amount_in: amountIn,
            min_out: minOut
          }
        }
      ]);

      const data = response.data as { transactionHash?: string };
      setNotice(
        data.transactionHash
          ? `Swap executed · ${data.transactionHash.slice(0, 12)}…`
          : "Swap executed on Ultra Testnet."
      );
      setAmount("");
      await refresh();
    } catch (error) {
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Swap was not completed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={compact ? "app-swap-card compact" : "app-swap-card"}>
      <div className="app-swap-tabs">
        <button className="active" type="button">Swap</button>
        <button type="button" disabled>Limit</button>
        <button type="button" disabled>Recurring</button>
        <span>⚙</span>
      </div>

      <div className="app-swap-field">
        <div className="app-swap-label">
          <span>Selling</span>
          <span>{account ? `${account.slice(0, 5)}…${account.slice(-4)}` : "Balance —"}</span>
        </div>
        <div className="app-swap-row">
          <Picker value={tokenIn} exclude={tokenOut.symbol} onChange={setTokenIn} />
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
      </div>

      <button
        type="button"
        className="app-flip"
        onClick={() => {
          setTokenIn(tokenOut);
          setTokenOut(tokenIn);
        }}
        aria-label="Switch assets"
      >
        ⇅
      </button>

      <div className="app-swap-field">
        <div className="app-swap-label">
          <span>Buying</span>
          <span>{liquid ? "Live quote" : "Pool unavailable"}</span>
        </div>
        <div className="app-swap-row">
          <Picker value={tokenOut} exclude={tokenIn.symbol} onChange={setTokenOut} />
          <div className={estimate && estimate !== "—" ? "app-estimate" : "app-estimate muted"}>
            {estimate || "0.00"}
          </div>
        </div>
      </div>

      <button className="acid-button app-swap-submit" type="button" onClick={execute} disabled={busy}>
        {busy ? "Working…" : account ? "Review swap" : "Connect wallet"}
      </button>

      <div className="app-swap-details">
        <div><span>Route</span><strong>{tokenIn.symbol} → {tokenOut.symbol}</strong></div>
        <div><span>Execution price</span><strong>{ratio}</strong></div>
        <div><span>Price impact</span><strong>Calculated on review</strong></div>
        <div>
          <span>Slippage</span>
          <select value={slippage} onChange={(event) => setSlippage(event.target.value)}>
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1.0">1.0%</option>
          </select>
        </div>
        <div><span>Pool fee</span><strong>{pool ? `${(Number(pool.fee_bps) / 100).toFixed(2)}%` : "—"}</strong></div>
      </div>

      {notice && <div className="app-inline-notice">{notice}</div>}
    </section>
  );
}
