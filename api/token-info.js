const CHAIN_RPCS = {
  1:       "https://cloudflare-eth.com",
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

// Decode ABI-encoded string returned by symbol() / name()
function decodeString(hex) {
  if (!hex || hex === "0x") return null;
  try {
    const data = hex.startsWith("0x") ? hex.slice(2) : hex;
    // ABI encoded string: 32 bytes offset + 32 bytes length + data
    if (data.length < 128) {
      // Some tokens return a bytes32 instead of a string — try that
      const trimmed = data.replace(/^0+/, "").replace(/0+$/, "");
      return Buffer.from(trimmed, "hex").toString("utf8").replace(/\0/g, "").trim() || null;
    }
    const lengthHex = data.slice(64, 128);
    const length = parseInt(lengthHex, 16);
    if (!length || length > 100) return null;
    const strHex = data.slice(128, 128 + length * 2);
    return Buffer.from(strHex, "hex").toString("utf8").replace(/\0/g, "").trim() || null;
  } catch { return null; }
}

function decodeUint(hex) {
  if (!hex || hex === "0x") return null;
  try {
    return parseInt(hex, 16);
  } catch { return null; }
}

async function ethCall(rpc, to, data) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  return json?.result || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { address, chainId } = req.query;
  if (!address || !chainId) {
    return res.status(400).json({ error: "address and chainId required" });
  }

  const rpc = CHAIN_RPCS[String(chainId)];
  if (!rpc) return res.status(404).json({ error: "unsupported chain" });

  try {
    const [symbolHex, decimalsHex] = await Promise.all([
      ethCall(rpc, address, "0x95d89b41"), // symbol()
      ethCall(rpc, address, "0x313ce567"), // decimals()
    ]);

    const symbol   = decodeString(symbolHex);
    const decimals = decodeUint(decimalsHex);

    if (!symbol) return res.status(404).json({ error: "not an ERC20 or symbol not available" });

    return res.status(200).json({ symbol, decimals: decimals ?? 18 });
  } catch (err) {
    return res.status(500).json({ error: "RPC call failed" });
  }
}
