const CHAIN_RPCS = {
  1:      "https://cloudflare-eth.com",
  42161:  "https://arb1.arbitrum.io/rpc",
  8453:   "https://mainnet.base.org",
  10:     "https://mainnet.optimism.io",
  137:    "https://polygon-bor-rpc.publicnode.com",
  43114:  "https://avalanche-c-chain-rpc.publicnode.com",
  56:     "https://bsc-rpc.publicnode.com",
  81457:  "https://blast-rpc.publicnode.com",
  534352: "https://scroll-rpc.publicnode.com",
  59144:  "https://linea-rpc.publicnode.com",
  5000:   "https://mantle-rpc.publicnode.com",
  34443:  "https://mainnet.mode.network",
  146:    "https://rpc.soniclabs.com",
  130:    "https://mainnet.unichain.org",
  480:    "https://worldchain-mainnet.g.alchemy.com/public",
  80094:  "https://berachain-rpc.publicnode.com",
  999:    "https://rpc.hyperliquid.xyz/evm",
  143:    "https://testnet-rpc.monad.xyz",
  57073:  "https://rpc-gel.inkonchain.com",
  2741:   "https://api.mainnet.abs.xyz",
};

async function tryChain(chainId, rpc, txHash) {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "eth_getTransactionByHash",
        params: [txHash],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data?.result?.hash) {
      return { chainId: String(chainId), input: data.result.input };
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { txHash } = req.query;
  if (!txHash) return res.status(400).json({ error: "txHash is required" });

  try {
    const result = await Promise.any(
      Object.entries(CHAIN_RPCS).map(([chainId, rpc]) =>
        tryChain(chainId, rpc, txHash).then(r => {
          if (!r) throw new Error("not found");
          return r;
        })
      )
    );
    return res.status(200).json(result);
  } catch {
    return res.status(404).json({ error: "Transaction not found on any supported chain." });
  }
}
