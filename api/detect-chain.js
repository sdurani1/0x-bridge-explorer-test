const CHAINS = [
  { chain: "base",        chainId: 8453,   rpcs: ["https://mainnet.base.org"] },
  { chain: "arbitrum",    chainId: 42161,  rpcs: ["https://arb1.arbitrum.io/rpc"] },
  { chain: "ethereum",    chainId: 1,      rpcs: ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"] },
  { chain: "optimism",    chainId: 10,     rpcs: ["https://mainnet.optimism.io"] },
  { chain: "polygon",     chainId: 137,    rpcs: ["https://polygon-bor-rpc.publicnode.com"] },
  { chain: "bnb",         chainId: 56,     rpcs: ["https://bsc-rpc.publicnode.com"] },
  { chain: "avalanche_c", chainId: 43114,  rpcs: ["https://rpc.ankr.com/avalanche", "https://avalanche-c-chain-rpc.publicnode.com", "https://1rpc.io/avax/c"] },
  { chain: "linea",       chainId: 59144,  rpcs: ["https://linea-rpc.publicnode.com"] },
  { chain: "scroll",      chainId: 534352, rpcs: ["https://scroll-rpc.publicnode.com"] },
  { chain: "mantle",      chainId: 5000,   rpcs: ["https://mantle-rpc.publicnode.com"] },
  { chain: "mode",        chainId: 34443,  rpcs: ["https://mainnet.mode.network"] },
  { chain: "sonic",       chainId: 146,    rpcs: ["https://rpc.soniclabs.com"] },
  { chain: "unichain",    chainId: 130,    rpcs: ["https://mainnet.unichain.org"] },
  { chain: "worldchain",  chainId: 480,    rpcs: ["https://worldchain-mainnet.g.alchemy.com/public"] },
  { chain: "berachain",   chainId: 80094,  rpcs: ["https://berachain-rpc.publicnode.com"] },
  { chain: "ink",         chainId: 57073,  rpcs: ["https://rpc-gel.inkonchain.com"] },
  { chain: "monad",       chainId: 143,    rpcs: ["https://monad-mainnet.drpc.org", "https://rpc.monad.xyz"] },
  { chain: "abstract",    chainId: 2741,   rpcs: ["https://api.mainnet.abs.xyz"] },
  { chain: "hyperevm",    chainId: 999,    rpcs: ["https://rpc.hyperliquid.xyz/evm"] },
  { chain: "plasma",      chainId: 9745,   rpcs: ["https://rpc.plasma.to"] },
  { chain: "tempo",       chainId: 4217,   rpcs: ["https://rpc.tempo.xyz"] },
];

async function checkRpc(entry, txHash) {
  // Race all RPCs for this chain in parallel
  try {
    const result = await Promise.any(
      entry.rpcs.map(async rpc => {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [txHash] }),
          signal: AbortSignal.timeout(4000),
        });
        const data = await res.json();
        if (!data?.result?.hash) throw new Error("not found");
        return { chain: entry.chain, chainId: entry.chainId };
      })
    );
    return result;
  } catch {}
  return null;
}

async function detectViaDune(txHash) {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) return null;

  // DuneSQL hex literal format: 0x<hexonly> works directly inline
  const hexLiteral = txHash.toLowerCase().startsWith("0x") ? txHash.toLowerCase() : `0x${txHash.toLowerCase()}`;

  const sql = `
SELECT chain, chain_id FROM (
  SELECT 'base' AS chain, 8453 AS chain_id FROM base.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'arbitrum', 42161 FROM arbitrum.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'ethereum', 1 FROM ethereum.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'optimism', 10 FROM optimism.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'polygon', 137 FROM polygon.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'bnb', 56 FROM bnb.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'avalanche_c', 43114 FROM avalanche_c.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'linea', 59144 FROM linea.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'scroll', 534352 FROM scroll.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'mantle', 5000 FROM mantle.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'berachain', 80094 FROM berachain.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'abstract', 2741 FROM abstract.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'unichain', 130 FROM unichain.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'worldchain', 480 FROM worldchain.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
  UNION ALL SELECT 'monad', 143 FROM monad.transactions WHERE hash = ${hexLiteral} AND block_date >= CURRENT_DATE - INTERVAL '90' DAY
) LIMIT 1`;

  try {
    const createRes = await fetch("https://api.dune.com/api/v1/query", {
      method: "POST",
      headers: { "X-Dune-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "chain-detect-temp", query_sql: sql, is_private: true }),
    });
    const { query_id } = await createRes.json();
    if (!query_id) return null;

    const execRes = await fetch(`https://api.dune.com/api/v1/query/${query_id}/execute`, {
      method: "POST",
      headers: { "X-Dune-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ performance: "medium" }),
    });
    const { execution_id } = await execRes.json();
    if (!execution_id) return null;

    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const stateRes = await fetch(`https://api.dune.com/api/v1/execution/${execution_id}/status`, {
        headers: { "X-Dune-API-Key": apiKey },
      });
      const { state } = await stateRes.json();
      if (state === "QUERY_STATE_COMPLETED") {
        const dataRes = await fetch(`https://api.dune.com/api/v1/execution/${execution_id}/results?limit=1`, {
          headers: { "X-Dune-API-Key": apiKey },
        });
        const data = await dataRes.json();
        const row = data.result?.rows?.[0];
        return row ? { chain: row.chain, chainId: row.chain_id } : null;
      }
      if (state === "QUERY_STATE_FAILED") return null;
    }
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { txHash } = req.query;
  if (!txHash) return res.status(400).json({ error: "txHash required" });

  // Race ALL chains via RPC simultaneously
  const rpcResult = await Promise.any(
    CHAINS.map(entry =>
      checkRpc(entry, txHash).then(r => { if (!r) throw new Error("not found"); return r; })
    )
  ).catch(() => null);

  if (rpcResult) return res.status(200).json({ ...rpcResult, source: "rpc" });

  // Dune fallback with inline hex literal
  const duneResult = await detectViaDune(txHash);
  if (duneResult) return res.status(200).json({ ...duneResult, source: "dune" });

  return res.status(404).json({ error: "Chain not found. Please select it manually." });
}
