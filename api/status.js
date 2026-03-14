const CHAIN_RPCS = {
  1:       [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.drpc.org",
    "https://rpc.ankr.com/eth",
    "https://1rpc.io/eth",
    "https://cloudflare-eth.com",
  ],
  42161:   "https://arb1.arbitrum.io/rpc",
  8453:    "https://mainnet.base.org",
  10:      "https://mainnet.optimism.io",
  137:     "https://polygon-bor-rpc.publicnode.com",
  43114:   "https://avalanche-c-chain-rpc.publicnode.com",
  56:      "https://bsc-rpc.publicnode.com",
  81457:   "https://blast-rpc.publicnode.com",
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
  9745:    "https://rpc.plasma.io",
};

function extractQuoteId(input) {
  if (!input || input.length < 10) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;
  const start = idx + 8 + 64;
  if (start + 32 > hex.length) return null;
  return "0x" + hex.slice(start, start + 32);
}

async function fetchTx(rpc, txHash) {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "eth_getTransactionByHash",
        params: [txHash],
      }),
    });
    const data = await res.json();
    return data?.result || null;
  } catch { return null; }
}

async function fetchOriginTxData(chainId, txHash) {
  const rpc = CHAIN_RPCS[String(chainId)];
  if (!rpc) return {};

  const tx = Array.isArray(rpc)
    ? await Promise.any(rpc.map(r => fetchTx(r, txHash).then(t => { if (!t) throw new Error(); return t; }))).catch(() => null)
    : await fetchTx(rpc, txHash);

  if (!tx) return {};
  return {
    input: tx.input || null,
    taker: tx.from  || null,
  };
}

// ENS reverse lookup using Cloudflare's ENS gateway — no API key needed
async function resolveENS(address) {
  if (!address) return null;
  try {
    // Use the ENS subgraph via the public API
    const res = await fetch("https://api.thegraph.com/subgraphs/name/ensdomains/ens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ domains(where: { resolvedAddress: "${address.toLowerCase()}" }, first: 1) { name } }`
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.domains?.[0]?.name || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { originChain, originTxHash, quoteId: providedQuoteId } = req.query;

  if (!originChain || !originTxHash) {
    return res.status(400).json({ error: "originChain and originTxHash are required" });
  }

  const txData  = await fetchOriginTxData(originChain, originTxHash);
  const quoteId = providedQuoteId || extractQuoteId(txData.input);
  const taker   = txData.taker || null;

  const params = new URLSearchParams({ originChain, originTxHash });
  if (quoteId) params.append("quoteId", quoteId);

  try {
    const [upstreamRes, takerENS] = await Promise.all([
      fetch(`https://0x-cross-chain-status-one.vercel.app/api/status?${params}`),
      taker ? resolveENS(taker) : Promise.resolve(null),
    ]);

    const data = await upstreamRes.json();
    if (data && !data.error) {
      if (taker) data.taker = taker;
      if (takerENS) data.takerENS = takerENS;
    }
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach status API" });
  }
}
