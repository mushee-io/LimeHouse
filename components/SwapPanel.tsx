"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeftRight, ChartNoAxesCombined, Check, ChevronDown, Settings2 } from "lucide-react";
import LimeLogo from "@/components/LimeLogo";
import { useUltraWallet } from "@/components/WalletProvider";
import { LIMEB_CONTRACT, LIME_TOKEN_CONTRACT } from "@/lib/config";
import {
  decimalToUnits,
  fetchPool0,
  parseAsset,
  PoolRow,
  quotePool,
  unitsToAsset
} from "@/lib/ultraRpc";
import { signUltraTransaction } from "@/lib/ultraWallet";

type Token = {
  symbol: "UOS" | "LIME";
  name: string;
  precision: number;
};
type Mode = "Swap" | "Limit" | "Buy" | "Sell";

const TOKENS: Token[] = [
  { symbol: "UOS", name: "Ultra", precision: 8 },
  { symbol: "LIME", name: "LimeHouse", precision: 6 }
];

function TokenIcon({ token }: { token: Token }) {
  return token.symbol === "UOS" ? (
    <span className="lh-token-icon lh-token-uos">U</span>
  ) : (
    <span className="lh-token-icon lh-token-lime"><LimeLogo compact /></span>
  );
}

function Picker({ value, onChange }: { value: Token; onChange: (token: Token) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lh-token-picker">
      <button type="button" className="lh-token-trigger" aria-expanded={open} aria-label={`Select token, currently ${value.symbol}`} onClick={() => setOpen(!open)}>
        <TokenIcon token={value} /><strong>{value.symbol}</strong><ChevronDown size={19} aria-hidden="true" />
      </button>
      {open && (
        <div className="lh-token-list" role="menu" aria-label="Select a token">
          <div className="lh-token-list-title">Tokens on Ultra Testnet</div>
          {TOKENS.map((token) => (
            <button
              key={token.symbol}
              type="button"
              role="menuitem"
              onClick={() => { onChange(token); setOpen(false); }}
            >
              <TokenIcon token={token} />
              <span><strong>{token.symbol}</strong><small>{token.name}</small></span>
              {value.symbol === token.symbol && <Check size={16} aria-label="Selected" />}
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
  const { account, busy: walletBusy, connect } = useUltraWallet();
  const [pool, setPool] = useState<PoolRow | null>(null);
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [mode, setMode] = useState<Mode>("Swap");
  const [showSettings, setShowSettings] = useState(false);

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
    if (!amount) return "0";
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

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setNotice("");
    if (nextMode === "Buy") {
      setTokenIn(TOKENS[0]);
      setTokenOut(TOKENS[1]);
    }
    if (nextMode === "Sell") {
      setTokenIn(TOKENS[1]);
      setTokenOut(TOKENS[0]);
    }
  }

  function selectInput(token: Token) {
    if (token.symbol === tokenOut.symbol) setTokenOut(tokenIn);
    setTokenIn(token);
  }

  function selectOutput(token: Token) {
    if (token.symbol === tokenIn.symbol) setTokenIn(tokenOut);
    setTokenOut(token);
  }

  function flip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    if (mode === "Buy") setMode("Sell");
    else if (mode === "Sell") setMode("Buy");
    setNotice("");
  }

  async function execute() {
    if (!account) {
      try {
        await connect();
        setNotice("");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Ultra Wallet could not connect.");
      }
      return;
    }

    if (!pool || !pool.enabled || !liquid) {
      setNotice("Pool 0 is not currently available for swapping on Ultra Testnet.");
      return;
    }

    if (!quote || quote.output <= 0n) {
      setNotice("Enter a valid amount to receive a live quote.");
      return;
    }

    try {
      const inputUnits = decimalToUnits(amount, quote.inputAsset.precision);
      const amountIn = unitsToAsset(inputUnits, quote.inputAsset.precision, quote.inputAsset.symbol);
      const slippageBps = Math.max(0, Math.min(9999, Math.round(Number(slippage) * 100)));
      const minOutUnits = (quote.output * BigInt(10000 - slippageBps)) / 10000n;
      const minOut = unitsToAsset(minOutUnits, quote.outputAsset.precision, quote.outputAsset.symbol);

      setBusy(true);
      setNotice("Approve the LimeHouse swap in Ultra Wallet.");

      const response = await signUltraTransaction([
        {
          contract: quote.inputAsset.symbol === "UOS" ? "eosio.token" : LIME_TOKEN_CONTRACT,
          action: "transfer",
          data: {
            from: account,
            to: LIMEB_CONTRACT,
            quantity: amountIn,
            memo: "LimeHouse swap deposit"
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
      setNotice(error instanceof Error ? error.message : "Swap was not completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={compact ? "lh-swap lh-swap-compact" : "lh-swap"} aria-label="LimeHouse swap">
      <div className="lh-swap-toolbar">
        <div className="lh-swap-tabs" role="tablist" aria-label="Trade mode">
          {(["Swap", "Limit", "Buy", "Sell"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={mode === item}
              className={mode === item ? "active" : ""}
              onClick={() => chooseMode(item)}
            >{item}</button>
          ))}
        </div>
        <div className="lh-swap-tools">
          <Link href="/analytics" className="lh-icon-button" title="Protocol analytics" aria-label="Protocol analytics"><ChartNoAxesCombined size={22} /></Link>
          <button type="button" className={showSettings ? "lh-icon-button active" : "lh-icon-button"} title="Swap settings" aria-label="Swap settings" aria-expanded={showSettings} onClick={() => setShowSettings(!showSettings)}><Settings2 size={22}/></button>
        </div>
      </div>

      {showSettings && (
        <div className="lh-swap-settings" aria-label="Swap settings">
          <div>
            <strong>Swap settings</strong><span>Ultra Testnet · Pool 0</span>
          </div>
          <label htmlFor="lh-slippage">Max slippage
            <select id="lh-slippage" value={slippage} onChange={(event) => setSlippage(event.target.value)}>
              <option value="0.1">0.1%</option><option value="0.5">0.5%</option><option value="1.0">1.0%</option>
            </select>
          </label>
        </div>
      )}

      {mode === "Limit" ? (
        <div className="lh-mode-coming">
          <span>COMING SOON</span>
          <h2>Limit orders</h2>
          <p>Limit orders are not live on Ultra Testnet yet. You can still execute live pool swaps.</p>
          <button type="button" onClick={() => chooseMode("Swap")}>Back to Swap <ArrowLeftRight size={16}/></button>
        </div>
      ) : (
        <>
          <div className="lh-swap-fields">
            <div className="lh-swap-field lh-swap-sell">
              <div className="lh-field-label">Sell</div>
              <div className="lh-field-content">
                <input
                  aria-label={`Amount to sell in ${tokenIn.symbol}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (/^\d*(?:\.\d*)?$/.test(next)) setAmount(next);
                  }}
                />
                <Picker value={tokenIn} onChange={selectInput} />
              </div>
              <div className="lh-field-foot"><span>Ultra Testnet</span><span>{account ? "Quote from Pool 0" : "Connect for balances"}</span></div>
            </div>

            <button className="lh-flip-button" type="button" onClick={flip} aria-label="Switch sell and buy tokens">
              <ArrowDown size={24} strokeWidth={2.2} />
            </button>

            <div className="lh-swap-field lh-swap-buy">
              <div className="lh-field-label">Buy</div>
              <div className="lh-field-content">
                <output aria-live="polite" className={estimate === "—" ? "lh-output unavailable" : "lh-output"}>{estimate}</output>
                <Picker value={tokenOut} onChange={selectOutput} />
              </div>
              <div className="lh-field-foot"><span>{quote ? "Live pool estimate" : liquid ? "Enter an amount for a quote" : "Pool quote unavailable"}</span></div>
            </div>
          </div>
          <button className="lh-swap-submit" type="button" disabled={busy || walletBusy} onClick={execute}>
            {busy || walletBusy ? "Working…" : account ? "Review swap" : "Connect Wallet"}
          </button>
          {(quote || (account && !liquid) || notice) && (
            <div className="lh-swap-meta" aria-live="polite">
              {quote && <div><span>Indicative price</span><strong>{ratio}</strong></div>}
              {quote && <div><span>Pool fee</span><strong>{pool ? `${(Number(pool.fee_bps) / 100).toFixed(2)}%` : "—"}</strong></div>}
              {quote && <div><span>Max slippage</span><strong>{slippage}%</strong></div>}
              {account && !liquid && <p>Pool 0 currently has no available liquidity. Swaps cannot execute until liquidity is available.</p>}
              {notice && <p role="status">{notice}</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
