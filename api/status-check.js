export const config = { runtime: "edge" };

const CHAIN_RPCS = {
  1:       "https://ethereum-rpc.publicnode.com",
  42161:   "https://arb1.arbitrum.io/rpc",
  8453:    "https://mainnet.base.org",
  10:      "https://mainnet.optimism.io",
  137:     "https://polygon-bor-rpc.publicnode.com",
  43114:   "https://rpc.ankr.com/avalanche",
  56:      "https://bsc-rpc.publicnode.com",
  534352:  "https://scroll-rpc.publicnode.com",
  59144:   "https://linea-rpc.publicnode.com",
  5000:    "https://mantle-rpc.publicnode.com",
  34443:   "https://mainnet.mode.network",
  146:     "https://rpc.soniclabs.com",
  130:     "https://mainnet.unichain.org",
  480:     "https://worldchain-mainnet.g.alchemy.com/public",
  80094:   "https://berachain-rpc.publicnode.com",
  999:     "https://rpc.hyperliquid.xyz/evm",
  143:     "https://monad-mainnet.drpc.org",
  57073:   "https://rpc-gel.inkonchain.com",
  2741:    "https://api.mainnet.abs.xyz",
  9745:    "https://rpc.plasma.to",
  4217:    "https://rpc.tempo.xyz",
};

const MULTI_RPCS = {
  "143":   ["https://monad-mainnet.drpc.org", "https://rpc.monad.xyz"],
  "43114": ["https://rpc.ankr.com/avalanche", "https://avalanche-c-chain-rpc.publicnode.com"],
};

function extractQuoteId(input) {
  if (!input || input.length < 10) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;
  const start = idx + 8 + 66;
  if (start + 32 > hex.length) return null;
  return "0x" + hex.slice(start, start + 32);
}

async function fetchCalldata(chainId, txHash) {
  const rpc = CHAIN_RPCS[String(chainId)];
  if (!rpc) return null;
  const rpcs = MULTI_RPCS[String(chainId)] || [rpc];
  try {
    const result = await Promise.any(rpcs.map(async r => {
      const res = await fetch(r, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [txHash] }),
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (!data?.result?.input) throw new Error("not found");
      return data.result.input;
    }));
    return result;
  } catch { return null; }
}

const TERMINAL = new Set(["bridge_filled", "bridge_failed", "origin_tx_reverted"]);
const PENDING = new Set(["bridge_pending", "origin_tx_confirmed", "origin_tx_pending"]);

export default async function handler(req) {
  const apiKey = process.env.ZERO_EX_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), {
    status: 500, headers: { "Content-Type": "application/json" },
  });

  const url = new URL(req.url);
  const originChain = url.searchParams.get("originChain");
  const originTxHash = url.searchParams.get("originTxHash");

  if (!originChain || !originTxHash) {
    return new Response(JSON.stringify({ error: "originChain and originTxHash required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 1: Call API without quoteId (matches eng's approach)
    const apiUrl = new URL("https://api.0x.org/cross-chain/status");
    apiUrl.searchParams.append("originChain", originChain);
    apiUrl.searchParams.append("originTxHash", originTxHash);

    const res = await fetch(apiUrl.toString(), {
      headers: { "0x-api-key": apiKey },
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();

    // If error, return immediately
    if (!data || data.error || data.name) {
      return new Response(JSON.stringify({
        status: null, bridge: null, error: data?.error || data?.name || "unknown",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // If terminal, return immediately — no need for quoteId retry
    if (TERMINAL.has(data.status)) {
      return new Response(JSON.stringify({
        status: data.status, bridge: data.bridge || null, error: null,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Step 2: If still pending, extract quoteId from calldata and retry
    if (PENDING.has(data.status)) {
      const calldata = await fetchCalldata(originChain, originTxHash);
      const quoteId = extractQuoteId(calldata);

      if (quoteId) {
        const retryUrl = new URL("https://api.0x.org/cross-chain/status");
        retryUrl.searchParams.append("originChain", originChain);
        retryUrl.searchParams.append("originTxHash", originTxHash);
        retryUrl.searchParams.append("quoteId", quoteId);

        try {
          const retryRes = await fetch(retryUrl.toString(), {
            headers: { "0x-api-key": apiKey },
            signal: AbortSignal.timeout(6000),
          });
          const retryData = await retryRes.json();

          // Use retry only if it returns a terminal status
          if (retryData && !retryData.error && !retryData.name && TERMINAL.has(retryData.status)) {
            return new Response(JSON.stringify({
              status: retryData.status, bridge: retryData.bridge || data.bridge || null, error: null,
            }), { status: 200, headers: { "Content-Type": "application/json" } });
          }
        } catch { /* retry failed, use original */ }
      }
    }

    // Return whatever we got from the first call
    return new Response(JSON.stringify({
      status: data.status || null, bridge: data.bridge || null, error: null,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "timeout" }), {
      status: 504, headers: { "Content-Type": "application/json" },
    });
  }
}
