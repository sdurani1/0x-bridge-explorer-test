// Instead of querying RPCs (unreliable), try the 0x status API
// with each chain ID until one returns a valid result.
const CHAIN_IDS = [8453, 42161, 1, 10, 137, 56, 43114, 81457, 534352,
                   59144, 5000, 34443, 146, 130, 480, 80094, 999, 143,
                   57073, 2741, 9745];

const STATUS_BASE = "https://0x-cross-chain-status-one.vercel.app/api/status";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function tryChainStatus(chainId, txHash) {
  try {
    const params = new URLSearchParams({ originChain: String(chainId), originTxHash: txHash });
    const res = await withTimeout(
      fetch(`${STATUS_BASE}?${params}`),
      6000
    );
    if (!res.ok) return null;
    const data = await res.json();
    // A valid response has a status field and no error
    if (data?.status && !data?.error) {
      return { chainId: String(chainId), data };
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

  // Race all chain IDs against the status API
  const promises = CHAIN_IDS.map(chainId =>
    tryChainStatus(chainId, txHash).then(r => {
      if (!r) throw new Error("not found");
      return r;
    })
  );

  try {
    const result = await Promise.any(promises);
    // Return both the detected chainId and the full status data
    return res.status(200).json({ chainId: result.chainId, statusData: result.data });
  } catch {
    return res.status(404).json({ error: "Transaction not found on any supported chain." });
  }
}
