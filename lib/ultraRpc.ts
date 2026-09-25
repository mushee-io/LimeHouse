import { LIMEB_CONTRACT, ULTRA_TESTNET_RPC } from "@/lib/config";

export type PoolRow = {
  id: number;
  reserve0: string;
  reserve1: string;
  total_shares: number;
  fee_bps: number;
  enabled: boolean;
};

export type ParsedAsset = {
  raw: string;
  units: bigint;
  precision: number;
  symbol: string;
};

export function parseAsset(value: string): ParsedAsset {
  const [amount, symbol] = value.trim().split(/\s+/);
  if (!amount || !symbol) {
    throw new Error(`Invalid asset: ${value}`);
  }

  const negative = amount.startsWith("-");
  const normalized = negative ? amount.slice(1) : amount;
  const [whole = "0", fraction = ""] = normalized.split(".");
  const precision = fraction.length;
  const digits = `${whole || "0"}${fraction}`.replace(/^0+(?=\d)/, "") || "0";
  const units = BigInt(digits) * (negative ? -1n : 1n);

  return { raw: value, units, precision, symbol };
}

export function decimalToUnits(value: string, precision: number): bigint {
  const cleaned = value.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error("Enter a valid amount.");
  }

  const [whole, fraction = ""] = cleaned.split(".");
  if (fraction.length > precision) {
    throw new Error(`This token supports up to ${precision} decimal places.`);
  }

  const padded = fraction.padEnd(precision, "0");
  return BigInt(`${whole}${padded}`);
}

export function unitsToAsset(units: bigint, precision: number, symbol: string): string {
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const base = 10n ** BigInt(precision);
  const whole = absolute / base;
  const fraction = absolute % base;
  const fractionText = precision > 0 ? `.${fraction.toString().padStart(precision, "0")}` : "";

  return `${negative ? "-" : ""}${whole}${fractionText} ${symbol}`;
}

export function assetToDisplay(value: string, maxFractionDigits = 6): string {
  const asset = parseAsset(value);
  const numeric = Number(asset.units) / 10 ** asset.precision;
  return numeric.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function quotePool(pool: PoolRow, inputSymbol: string, amountIn: bigint): {
  output: bigint;
  outputAsset: ParsedAsset;
  inputAsset: ParsedAsset;
} {
  const reserve0 = parseAsset(pool.reserve0);
  const reserve1 = parseAsset(pool.reserve1);
  const zeroForOne = inputSymbol === reserve0.symbol;
  const oneForZero = inputSymbol === reserve1.symbol;

  if (!zeroForOne && !oneForZero) {
    throw new Error("Input token is not part of Pool 0.");
  }

  const inputAsset = zeroForOne ? reserve0 : reserve1;
  const outputAsset = zeroForOne ? reserve1 : reserve0;
  const reserveIn = inputAsset.units;
  const reserveOut = outputAsset.units;

  if (reserveIn <= 0n || reserveOut <= 0n) {
    return { output: 0n, outputAsset, inputAsset };
  }

  const feeFactor = BigInt(10000 - pool.fee_bps);
  const amountWithFee = amountIn * feeFactor;
  const numerator = amountWithFee * reserveOut;
  const denominator = reserveIn * 10000n + amountWithFee;

  return {
    output: denominator > 0n ? numerator / denominator : 0n,
    outputAsset,
    inputAsset
  };
}

export async function fetchPools(): Promise<PoolRow[]> {
  const response = await fetch(`${ULTRA_TESTNET_RPC}/v1/chain/get_table_rows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: true,
      code: LIMEB_CONTRACT,
      scope: LIMEB_CONTRACT,
      table: "pools",
      limit: 100
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Ultra RPC returned ${response.status}`);
  }

  const data = (await response.json()) as { rows?: PoolRow[] };
  return Array.isArray(data.rows) ? data.rows : [];
}

export async function fetchPool0(): Promise<PoolRow | null> {
  const pools = await fetchPools();
  return pools.find((pool) => Number(pool.id) === 0) ?? null;
}
