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

// Known bridge/router contracts to exclude as "recipient"
const BRIDGE_CONTRACTS = new Set([
  "0x0000000000001ff3684f28c67538d4d072c22734", // 0x AllowanceHolder
  "0x4cd00e387622c35bddb9b4c962c136462338bc31", // Relay Depository
  "0xe80179520000000000000000000000000000000e", // Gas.Zip
]);

function extractQuoteId(input) {
  if (!input || input.length < 10) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;
  const start = idx + 8 + 64;
  if (start + 32 > hex.length) return null;
  return "0x" + hex.slice(start, start + 32);
}

// Extract recipient from exec calldata:
// exec(address operator, address token, uint256 amount, address target, bytes data)
// The recipient for the dest chain is encoded inside `data` after the quoteId.
// As a fallback we look for any 20-byte EVM address in the bridge data section.
function extractRecipient(input) {
  if (!input) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;

  // After quoteId (idx+8+64+32 = idx+104), scan for the first EVM address
  // that is NOT a known token/contract and looks like a user wallet
  const dataStart = idx + 104; // after selector(8) + offset(64) + quoteId(32)
  const dataHex   = hex.slice(dataStart);

  // Walk 32-byte (64 hex char) chunks looking for address-shaped values
  // An EVM address in ABI encoding = 12 zero bytes + 20 address bytes
  // Pattern: 24 zero chars + 40 non-zero hex chars
  const addrPattern = /^0{24}([0-9a-f]{40})/i;
  for (let i = 0; i + 64 <= dataHex.length; i += 64) {
    const chunk = dataHex.slice(i, i + 64);
    const m = chunk.match(addrPattern);
    if (m) {
      const addr = "0x" + m[1];
      // Skip zero address and known bridge contracts
      if (addr !== "0x0000000000000000000000000000000000000000" &&
          !BRIDGE_CONTRACTS.has(addr.toLowerCase())) {
        return addr;
      }
    }
  }
  return null;
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
    input:     tx.input || null,
    taker:     tx.from  || null,
    recipient: extractRecipient(tx.input),
  };
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
  const recipient = txData.recipient || null;

  const params = new URLSearchParams({ originChain, originTxHash });
  if (quoteId) params.append("quoteId", quoteId);

  try {
    const upstream = await fetch(
      `https://0x-cross-chain-status-one.vercel.app/api/status?${params}`
    );
    const data = await upstream.json();
    if (data && !data.error) {
      if (taker) data.taker = taker;
      // Only include recipient if different from taker
      if (recipient && recipient.toLowerCase() !== taker?.toLowerCase()) {
        data.recipient = recipient;
      }
    }
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach status API" });
  }
}
