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

function extractQuoteId(input) {
  if (!input || input.length < 10) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;
  const start = idx + 8 + 66;  // +8 selector, +64 ABI offset param, +2 skip length byte
  if (start + 32 > hex.length) return null;
  return "0x" + hex.slice(start, start + 32);
}

const MULTI_RPCS = {
  "143":   ["https://monad-mainnet.drpc.org", "https://rpc.monad.xyz"],
  "43114": ["https://rpc.ankr.com/avalanche", "https://avalanche-c-chain-rpc.publicnode.com", "https://1rpc.io/avax/c"],
};


// Fetch recipient wallet from a Solana transaction
// We look at postTokenBalances to find the wallet whose token balance increased,
// falling back to the feePayer of the transaction
async function fetchSolanaRecipient(txHash) {
  const SOLANA_RPCS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
  ];
  for (const rpc of SOLANA_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getTransaction",
          params: [txHash, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
        }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      const tx = data?.result;
      if (!tx) continue;

      // Try postTokenBalances — find the owner whose balance increased
      const pre  = tx.meta?.preTokenBalances  || [];
      const post = tx.meta?.postTokenBalances || [];
      for (const p of post) {
        const preEntry = pre.find(x => x.accountIndex === p.accountIndex && x.mint === p.mint);
        const preAmt  = Number(preEntry?.uiTokenAmount?.amount  || 0);
        const postAmt = Number(p.uiTokenAmount?.amount || 0);
        if (postAmt > preAmt && p.owner) return p.owner;
      }

      // Fallback: feePayer is usually the recipient wallet
      const feePayer = tx.transaction?.message?.accountKeys?.[0]?.pubkey;
      if (feePayer) return feePayer;
    } catch { continue; }
  }
  return null;
}

async function fetchTxData(chainId, txHash) {
  const rpc = CHAIN_RPCS[String(chainId)];
  if (!rpc) return {};

  // For chains with unreliable RPCs, race multiple endpoints
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
      const tx = data?.result;
      if (!tx) throw new Error("not found");
      return { from: tx.from || null, to: tx.to || null, input: tx.input || null, value: tx.value || "0x0" };
    }));
    return result;
  } catch { return {}; }
}

async function fetchTxFrom(chainId, txHash) {
  const { from } = await fetchTxData(chainId, txHash);
  return from || null;
}

// Fetch transaction receipt to get ERC20 Transfer logs
async function fetchTxReceipt(chainId, txHash) {
  const rpc = CHAIN_RPCS[String(chainId)];
  if (!rpc) return null;
  const rpcs = MULTI_RPCS[String(chainId)] || [rpc];
  try {
    return await Promise.any(rpcs.map(async r => {
      const res = await fetch(r, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (!data?.result) throw new Error("no receipt");
      return data.result;
    }));
  } catch { return null; }
}

// ERC20 Transfer event topic: Transfer(address,address,uint256)
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Extract the first outbound ERC20 transfer from the sender, or the largest transfer
function extractSellTransfer(receipt, sender) {
  if (!receipt?.logs) return null;
  const transfers = receipt.logs
    .filter(l => l.topics?.[0] === TRANSFER_TOPIC && l.topics?.length >= 3)
    .map(l => ({
      token: l.address,
      from:  "0x" + l.topics[1]?.slice(26),
      to:    "0x" + l.topics[2]?.slice(26),
      amount: l.data && l.data !== "0x" ? BigInt(l.data).toString() : "0",
    }));

  // Prefer a transfer FROM the sender
  const fromSender = transfers.find(t => t.from.toLowerCase() === sender?.toLowerCase());
  if (fromSender) return { token: fromSender.token, amount: fromSender.amount };

  // Fallback: first transfer in the tx
  if (transfers.length > 0) return { token: transfers[0].token, amount: transfers[0].amount };
  return null;
}

// Extract the last inbound ERC20 transfer (what the recipient received)
function extractBuyTransfer(receipt, recipient) {
  if (!receipt?.logs) return null;
  const transfers = receipt.logs
    .filter(l => l.topics?.[0] === TRANSFER_TOPIC && l.topics?.length >= 3)
    .map(l => ({
      token: l.address,
      from:  "0x" + l.topics[1]?.slice(26),
      to:    "0x" + l.topics[2]?.slice(26),
      amount: l.data && l.data !== "0x" ? BigInt(l.data).toString() : "0",
    }));

  // Prefer a transfer TO the recipient
  const toRecipient = transfers.filter(t => t.to.toLowerCase() === recipient?.toLowerCase());
  if (toRecipient.length > 0) {
    const last = toRecipient[toRecipient.length - 1];
    return { token: last.token, amount: last.amount };
  }

  // Fallback: last transfer in the tx
  if (transfers.length > 0) {
    const last = transfers[transfers.length - 1];
    return { token: last.token, amount: last.amount };
  }
  return null;
}

async function resolveENS(address) {
  if (!address) return null;
  try {
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

  const { originChain, originTxHash } = req.query;
  if (!originChain || !originTxHash) {
    return res.status(400).json({ error: "originChain and originTxHash are required" });
  }

  const apiKey = process.env.ZERO_EX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    // Fetch origin tx data (sender + calldata for quoteId extraction)
    const { from: sender, input, value: txValue } = await fetchTxData(originChain, originTxHash);
    const quoteId = extractQuoteId(input);

    const url = new URL("https://api.0x.org/cross-chain/status");
    url.searchParams.append("originChain", originChain);
    url.searchParams.append("originTxHash", originTxHash);
    if (quoteId) url.searchParams.append("quoteId", quoteId);

    const upstream = await fetch(url.toString(), { headers: { "0x-api-key": apiKey } });
    const data = await upstream.json();

    if (data && !data.error && !data.name) {
      if (sender) data.sender = sender;

      // Get recipient from destination tx
      // Try steps first, then fall back to data.transactions (e.g. near_intents returns steps:[])
      const steps = data.steps || [];
      const lastStep = steps[steps.length - 1];
      const destTxFromStep = lastStep?.transactions?.[lastStep.transactions.length - 1];
      const rawTxs = data.transactions || [];
      const destTx = destTxFromStep || (rawTxs.length > 1 ? rawTxs[rawTxs.length - 1] : null);

      const SOLANA_CHAIN_ID = 999999999991;
      const isSolanaDestination = destTx?.chainId === SOLANA_CHAIN_ID
        || (destTx?.txHash && !destTx.txHash.startsWith("0x"));

      // ── Run recipient fetch, ENS, and token enrichment ALL in parallel ──
      const recipientPromise = (async () => {
        if (!destTx?.txHash || !destTx?.chainId) return null;
        if (isSolanaDestination) return fetchSolanaRecipient(destTx.txHash);
        return fetchTxFrom(destTx.chainId, destTx.txHash);
      })();

      const tokenPromise = (async () => {
        const firstStep = steps[0];
        const lastStep2 = steps[steps.length - 1];

        // Always try ClickHouse for extra fields (appName, gas, slippage, etc.)
        let chData = null;
        const chHost = process.env.CLICKHOUSE_HOST;
        const chUser = process.env.CLICKHOUSE_USER;
        const chPass = process.env.CLICKHOUSE_PASSWORD;

        if (chHost && chUser) {
          try {
            const chQuery = `SELECT sell_token, sell_token_symbol, toString(sell_amount) as sell_amount, buy_token, buy_token_symbol, toString(buy_amount) as buy_amount, origin_chain_id, destination_chain_id, zippo_app_name, gas_usd, slippage_bps, fee_total_usd, trade_type, sell_usd, buy_usd, volume_usd FROM magic.trades_cross_chain WHERE origin_transaction_hash = '${originTxHash.replace(/'/g, "''")}' LIMIT 1`;
            const chUrl = `${chHost}/?default_format=JSONEachRow`;
            const authHeader = "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64");
            const chRes = await fetch(chUrl, {
              method: "POST",
              headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
              body: chQuery,
              signal: AbortSignal.timeout(3000),
            });
            if (chRes.ok) {
              const chText = await chRes.text();
              const line = chText.trim().split("\n")[0];
              if (line) {
                const chResult = JSON.parse(line);
                chData = {
                  sellToken: chResult.sell_token || null,
                  sellAmount: chResult.sell_amount || null,
                  buyToken: chResult.buy_token || null,
                  buyAmount: chResult.buy_amount || null,
                  sellSymbol: chResult.sell_token_symbol || null,
                  buySymbol: chResult.buy_token_symbol || null,
                  originChainId: Number(chResult.origin_chain_id) || null,
                  destinationChainId: Number(chResult.destination_chain_id) || null,
                  appName: chResult.zippo_app_name || null,
                  gasUsd: chResult.gas_usd != null ? Number(chResult.gas_usd) : null,
                  slippageBps: chResult.slippage_bps != null ? Number(chResult.slippage_bps) : null,
                  feeTotalUsd: chResult.fee_total_usd != null ? Number(chResult.fee_total_usd) : null,
                  tradeType: chResult.trade_type || null,
                  sellUsd: chResult.sell_usd != null ? Number(chResult.sell_usd) : null,
                  buyUsd: chResult.buy_usd != null ? Number(chResult.buy_usd) : null,
                  volumeUsd: chResult.volume_usd != null ? Number(chResult.volume_usd) : null,
                  _source: "clickhouse",
                };
              }
            }
          } catch { /* ClickHouse query failed */ }
        }

        // If steps exist, use steps for token data but merge ClickHouse extra fields
        if (firstStep) {
          const stepsResult = {
            sellToken:  firstStep.sellToken  || null,
            sellAmount: firstStep.sellAmount || null,
            buyToken:   lastStep2?.buyToken  || null,
            buyAmount:  lastStep2?.settledBuyAmount || lastStep2?.quotedBuyAmount || null,
            originChainId:      firstStep.transactions?.[0]?.chainId || null,
            destinationChainId: lastStep2?.destinationChainId || lastStep2?.transactions?.[lastStep2?.transactions?.length - 1]?.chainId || null,
          };
          // Merge ClickHouse extra fields (appName, gas, slippage, USD values, etc.)
          if (chData) {
            stepsResult.appName = chData.appName;
            stepsResult.gasUsd = chData.gasUsd;
            stepsResult.slippageBps = chData.slippageBps;
            stepsResult.feeTotalUsd = chData.feeTotalUsd;
            stepsResult.tradeType = chData.tradeType;
            stepsResult.sellUsd = chData.sellUsd;
            stepsResult.buyUsd = chData.buyUsd;
            stepsResult.volumeUsd = chData.volumeUsd;
            stepsResult._source = "steps+clickhouse";
          }
          return stepsResult;
        }

        // No steps — use ClickHouse data with swap-then-bridge detection
        if (chData) {
          const authHeader = "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64");
          // For swap-then-bridge: check if user's actual sell token differs from the bridge token
          if (sender && originTxHash) {
            try {
              const originCid = Number(originChain);
              const originReceipt = await fetchTxReceipt(originCid, originTxHash);
              const sellTransfer = extractSellTransfer(originReceipt, sender);
              if (sellTransfer?.token && sellTransfer.token.toLowerCase() !== (chData.sellToken || "").toLowerCase()) {
                chData.sellToken = sellTransfer.token;
                chData.sellAmount = sellTransfer.amount;
                let realSellSymbol = null;
                const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
                if (sellTransfer.token === NATIVE) {
                  const NATIVE_SYMBOLS = {1:"ETH",8453:"ETH",42161:"ETH",10:"ETH",534352:"ETH",59144:"ETH",5000:"MNT",34443:"ETH",146:"S",130:"ETH",480:"ETH",2741:"ETH",80094:"BERA",999:"HYPE",57073:"ETH",10143:"MON",9745:"ETH",4217:"TEMPO",137:"POL",43114:"AVAX",56:"BNB"};
                  realSellSymbol = NATIVE_SYMBOLS[originCid] || "ETH";
                } else {
                  try {
                    const regQuery = `SELECT symbol FROM api.token_registry WHERE lower(address) = '${sellTransfer.token.toLowerCase()}' LIMIT 1`;
                    const regRes = await fetch(`${chHost}/?default_format=JSONEachRow`, {
                      method: "POST",
                      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
                      body: regQuery,
                      signal: AbortSignal.timeout(2000),
                    });
                    if (regRes.ok) {
                      const regText = await regRes.text();
                      const regLine = regText.trim().split("\n")[0];
                      if (regLine) realSellSymbol = JSON.parse(regLine).symbol;
                    }
                  } catch {}
                }
                if (realSellSymbol) chData.sellSymbol = realSellSymbol;
                chData._source = "clickhouse+on-chain";
              }
            } catch { /* on-chain check failed, use ClickHouse data as-is */ }
          }

          // If ClickHouse has no buy data but we have a destination tx, parse on-chain
          if (!chData.buyAmount && destTx?.txHash && destTx?.chainId && !isSolanaDestination) {
            try {
              const destReceipt = await fetchTxReceipt(destTx.chainId, destTx.txHash);
              const recipient = data.recipient || sender;
              const buyTransfer = extractBuyTransfer(destReceipt, recipient);
              if (buyTransfer?.token) {
                chData.buyToken = buyTransfer.token;
                chData.buyAmount = buyTransfer.amount;
                const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
                if (buyTransfer.token === NATIVE) {
                  const NATIVE_SYMBOLS = {1:"ETH",8453:"ETH",42161:"ETH",10:"ETH",534352:"ETH",59144:"ETH",5000:"MNT",34443:"ETH",146:"S",130:"ETH",480:"ETH",2741:"ETH",80094:"BERA",999:"HYPE",57073:"ETH",10143:"MON",9745:"ETH",4217:"TEMPO",137:"POL",43114:"AVAX",56:"BNB"};
                  chData.buySymbol = NATIVE_SYMBOLS[destTx.chainId] || "ETH";
                } else {
                  try {
                    const regQuery = `SELECT symbol FROM api.token_registry WHERE lower(address) = '${buyTransfer.token.toLowerCase()}' LIMIT 1`;
                    const regRes = await fetch(`${chHost}/?default_format=JSONEachRow`, {
                      method: "POST",
                      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
                      body: regQuery,
                      signal: AbortSignal.timeout(2000),
                    });
                    if (regRes.ok) {
                      const regText = await regRes.text();
                      const regLine = regText.trim().split("\n")[0];
                      if (regLine) chData.buySymbol = JSON.parse(regLine).symbol;
                    }
                  } catch {}
                }
                chData._source = chData._source === "clickhouse+on-chain" ? "clickhouse+on-chain" : "clickhouse+on-chain-dest";
              }
            } catch { /* destination enrichment failed */ }
          }

          return chData;
        }

        // On-chain fallback
        const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        const originCid = Number(originChain);
        const destCid = destTx?.chainId || null;
        const destHash = destTx?.txHash || null;
        try {
          const [originReceipt, destReceipt, destTxData] = await Promise.all([
            fetchTxReceipt(originCid, originTxHash),
            (destHash && destCid) ? fetchTxReceipt(destCid, destHash) : Promise.resolve(null),
            (destHash && destCid) ? fetchTxData(destCid, destHash) : Promise.resolve({}),
          ]);

          const sellTransfer = extractSellTransfer(originReceipt, sender);
          let sellToken = sellTransfer?.token || null;
          let sellAmount = sellTransfer?.amount || null;
          if (!sellToken && txValue) {
            const nativeWei = BigInt(txValue);
            if (nativeWei > 0n) { sellToken = NATIVE; sellAmount = nativeWei.toString(); }
          }

          const recipient = data.recipient || sender;
          const buyTransfer = extractBuyTransfer(destReceipt, recipient);
          let buyToken = buyTransfer?.token || null;
          let buyAmount = buyTransfer?.amount || null;
          if (!buyToken && destTxData?.value) {
            const destNativeWei = BigInt(destTxData.value);
            if (destNativeWei > 0n) { buyToken = NATIVE; buyAmount = destNativeWei.toString(); }
          }

          // Resolve token symbols from ClickHouse token registry if available
          let sellSymbol = null, buySymbol = null;
          if (chHost && chUser && (sellToken || buyToken)) {
            try {
              const tokens = [sellToken, buyToken].filter(t => t && t !== NATIVE);
              if (tokens.length > 0) {
                const inClause = tokens.map(t => `'${t.toLowerCase()}'`).join(",");
                const regQuery = `SELECT lower(address) as addr, symbol FROM api.token_registry WHERE lower(address) IN (${inClause}) LIMIT ${tokens.length}`;
                const regRes = await fetch(`${chHost}/?default_format=JSONEachRow`, {
                  method: "POST",
                  headers: { "Authorization": "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64"), "Content-Type": "text/plain" },
                  body: regQuery,
                  signal: AbortSignal.timeout(2000),
                });
                if (regRes.ok) {
                  const regText = await regRes.text();
                  const regMap = {};
                  regText.trim().split("\n").filter(Boolean).forEach(line => {
                    try { const r = JSON.parse(line); regMap[r.addr] = r.symbol; } catch {}
                  });
                  if (sellToken && sellToken !== NATIVE) sellSymbol = regMap[sellToken.toLowerCase()] || null;
                  if (buyToken && buyToken !== NATIVE) buySymbol = regMap[buyToken.toLowerCase()] || null;
                }
              }
            } catch { /* registry lookup failed, symbols stay null */ }
          }
          // Chain-specific native token symbols
          const NATIVE_SYMBOLS = {
            1:"ETH", 8453:"ETH", 42161:"ETH", 10:"ETH", 534352:"ETH", 59144:"ETH",
            5000:"MNT", 34443:"ETH", 146:"S", 130:"ETH", 480:"ETH", 2741:"ETH",
            80094:"BERA", 999:"HYPE", 57073:"ETH", 10143:"MON", 9745:"ETH",
            4217:"TEMPO",
            137:"POL", 43114:"AVAX", 56:"BNB",
          };
          const nativeSym = (cid) => NATIVE_SYMBOLS[cid] || "ETH";
          if (sellToken === NATIVE) sellSymbol = nativeSym(originCid);
          if (buyToken === NATIVE) buySymbol = nativeSym(destCid);

          return { sellToken, sellAmount, buyToken, buyAmount, sellSymbol, buySymbol, originChainId: originCid, destinationChainId: destCid, _source: "on-chain" };
        } catch { return null; }
      })();

      // Start ENS resolution for sender immediately (don't wait for recipient)
      const senderENSPromise = sender ? resolveENS(sender) : Promise.resolve(null);

      // Await recipient first, then start recipient ENS
      const recipientAddr = await recipientPromise;
      if (recipientAddr) data.recipient = recipientAddr;

      // Now resolve ENS for both in parallel (sender already started)
      const [senderENS, recipientENS, tokenSummary] = await Promise.all([
        senderENSPromise,
        (data.recipient && data.recipient !== sender) ? resolveENS(data.recipient) : Promise.resolve(null),
        tokenPromise,
      ]);

      if (senderENS) data.senderENS = senderENS;
      if (recipientENS) data.recipientENS = recipientENS;
      data.taker = sender;
      data.takerENS = senderENS;
      data._tokenSummary = tokenSummary;
    }

    // ── ClickHouse override for stale pending status ──
    // When the live API returns bridge_pending but ClickHouse has bridge_filled,
    // trust ClickHouse (e.g., Near Intents never reports destination to the status API)
    if (data?.status === "bridge_pending" && !data?.error && !data?.name) {
      const chHost = process.env.CLICKHOUSE_HOST;
      const chUser = process.env.CLICKHOUSE_USER;
      const chPass = process.env.CLICKHOUSE_PASSWORD;
      if (chHost && chUser) {
        try {
          const chQuery = `SELECT settlement_status, destination_transaction_hash, destination_chain_id, toString(destination_timestamp) as dest_ts FROM magic.trades_cross_chain WHERE origin_transaction_hash = '${originTxHash.replace(/'/g, "''")}' AND settlement_status = 'bridge_filled' LIMIT 1`;
          const authHeader = "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64");
          const chRes = await fetch(`${chHost}/?default_format=JSONEachRow`, {
            method: "POST",
            headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
            body: chQuery,
            signal: AbortSignal.timeout(3000),
          });
          if (chRes.ok) {
            const chText = await chRes.text();
            const line = chText.trim().split("\n")[0];
            if (line) {
              const chRow = JSON.parse(line);
              // ClickHouse says filled — override the pending status
              data.status = "bridge_filled";
              data._statusOverride = "clickhouse";
              // Add destination tx if the API didn't have it
              if (chRow.destination_transaction_hash && data.transactions?.length === 1) {
                const parseChainId = (cid) => cid === "solana" ? 999999999991 : Number(cid) || null;
                const destTs = chRow.dest_ts ? Math.floor(new Date(chRow.dest_ts + "Z").getTime() / 1000) : null;
                data.transactions.push({
                  chainId: parseChainId(chRow.destination_chain_id),
                  chain: chRow.destination_chain_id,
                  txHash: chRow.destination_transaction_hash,
                  timestamp: destTs,
                });
              }
            }
          }
        } catch { /* ClickHouse check failed, keep API status */ }
      }
    }

    // Handle the INPUT_INVALID timestamp=0 case — bridge is still in-flight
    // The API found the tx but destination hasn't confirmed yet
    if (data?.name === "INPUT_INVALID" && data?.data?.details?.some(d => d.reason?.includes("greater than 0"))) {
      return res.status(200).json({
        status: "bridge_pending",
        bridge: null,
        transactions: [],
        steps: [],
        zid: data?.data?.zid || null,
        _pending: true,
      });
    }

    // ── ClickHouse fallback for bridge provider errors ──
    // When the 0x API can't reach the bridge provider (e.g. Mayan), try ClickHouse
    if (data?.name === "BRIDGE_PROVIDER_ERROR" || (data?.name && !data?.status)) {
      const chHost = process.env.CLICKHOUSE_HOST;
      const chUser = process.env.CLICKHOUSE_USER;
      const chPass = process.env.CLICKHOUSE_PASSWORD;
      if (chHost && chUser) {
        try {
          const chQuery = `SELECT origin_chain_id, destination_chain_id, origin_transaction_hash, destination_transaction_hash, bridge_provider, settlement_status, sell_token_symbol, toString(sell_amount) as sell_amount, sell_usd, buy_token_symbol, toString(buy_amount) as buy_amount, buy_usd, volume_usd, origin_address, destination_address, toString(timestamp) as origin_ts, toString(destination_timestamp) as dest_ts FROM magic.trades_cross_chain WHERE origin_transaction_hash = '${originTxHash.replace(/'/g, "''")}' LIMIT 1`;
          const chUrl = `${chHost}/?default_format=JSONEachRow`;
          const authHeader = "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64");
          const chRes = await fetch(chUrl, {
            method: "POST",
            headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
            body: chQuery,
            signal: AbortSignal.timeout(5000),
          });
          if (chRes.ok) {
            const chText = await chRes.text();
            const line = chText.trim().split("\n")[0];
            if (line) {
              const r = JSON.parse(line);
              const parseChainId = (cid) => cid === "solana" ? 999999999991 : Number(cid) || null;
              const originTs = r.origin_ts ? Math.floor(new Date(r.origin_ts + "Z").getTime() / 1000) : null;
              const destTs = r.dest_ts ? Math.floor(new Date(r.dest_ts + "Z").getTime() / 1000) : null;
              const txs = [
                { chainId: parseChainId(r.origin_chain_id), chain: r.origin_chain_id, txHash: r.origin_transaction_hash, timestamp: originTs },
              ];
              if (r.destination_transaction_hash) {
                txs.push({ chainId: parseChainId(r.destination_chain_id), chain: r.destination_chain_id, txHash: r.destination_transaction_hash, timestamp: destTs });
              }
              const fallbackResult = {
                status: r.settlement_status || "unknown",
                bridge: r.bridge_provider,
                steps: [],
                failure: null,
                transactions: txs,
                zid: data?.data?.zid || null,
                sender: r.origin_address || sender,
                recipient: r.destination_address || null,
                taker: r.origin_address || sender,
                _tokenSummary: {
                  sellToken: null,
                  sellAmount: r.sell_amount,
                  buyToken: null,
                  buyAmount: r.buy_amount,
                  sellSymbol: r.sell_token_symbol,
                  buySymbol: r.buy_token_symbol,
                  originChainId: parseChainId(r.origin_chain_id),
                  destinationChainId: parseChainId(r.destination_chain_id),
                  _source: "clickhouse",
                },
                _fallback: "clickhouse",
              };
              return res.status(200).json(fallbackResult);
            }
          }
        } catch { /* ClickHouse fallback failed, return original error */ }
      }
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach 0x API" });
  }
}
