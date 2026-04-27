// Recent cross-chain transactions via 0x internal ClickHouse
// Requires env vars: CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

const QUERY = `
SELECT
  origin_chain_id,
  destination_chain_id,
  origin_transaction_hash,
  destination_transaction_hash,
  origin_address,
  destination_address,
  bridge_provider,
  settlement_status,
  sell_token,
  sell_token_symbol,
  toString(sell_amount) as sell_amount,
  sell_usd,
  buy_token,
  buy_token_symbol,
  toString(buy_amount) as buy_amount,
  buy_usd,
  volume_usd,
  zippo_app_name,
  toString(timestamp) as timestamp
FROM magic.trades_cross_chain
ORDER BY timestamp DESC
LIMIT 20
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const host = process.env.CLICKHOUSE_HOST;
  const user = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;

  if (!host || !user) {
    return res.status(500).json({ error: "ClickHouse not configured" });
  }

  try {
    // ClickHouse HTTP interface — POST query as body, get JSON response
    const url = `${host}/?default_format=JSONEachRow`;
    const authHeader = "Basic " + Buffer.from(`${user}:${password || ""}`).toString("base64");

    const chRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "text/plain",
      },
      body: QUERY,
      signal: AbortSignal.timeout(10000),
    });

    if (!chRes.ok) {
      const errText = await chRes.text();
      console.error("[recent-ch] ClickHouse error:", chRes.status, errText.slice(0, 200));
      return res.status(502).json({ error: "ClickHouse query failed" });
    }

    const text = await chRes.text();
    // JSONEachRow returns one JSON object per line
    const rows = text.trim().split("\n").filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    // Map chain ID strings to numbers — handle "solana" specially
    const parseChainId = (cid) => {
      if (!cid) return null;
      if (cid === "solana") return 999999999991;
      const n = Number(cid);
      return isNaN(n) ? null : n;
    };

    // Map to the shape the frontend expects (backwards-compatible with Dune format)
    // plus new fields for token data
    const mapped = rows.map(r => ({
      // Legacy fields (what the frontend already uses)
      chain_id:       parseChainId(r.origin_chain_id),
      src_tx_hash:    r.origin_transaction_hash,
      sender:         r.origin_address,
      block_time:     r.timestamp,  // ISO-ish string from CH
      dst_tx_hash:    r.destination_transaction_hash || null,
      dst_chain_id:   parseChainId(r.destination_chain_id),

      // New fields from ClickHouse
      bridge:           r.bridge_provider,
      status:           r.settlement_status,
      sell_token:       r.sell_token,
      sell_token_symbol:r.sell_token_symbol,
      sell_amount:      r.sell_amount,
      sell_usd:         r.sell_usd,
      buy_token:        r.buy_token,
      buy_token_symbol: r.buy_token_symbol,
      buy_amount:       r.buy_amount,
      buy_usd:          r.buy_usd,
      volume_usd:       r.volume_usd,
      destination_address: r.destination_address,
      app_name:         r.zippo_app_name || null,
    }));

    return res.status(200).json({
      rows: mapped,
      source: "clickhouse",
      latestTimestamp: mapped.length > 0 ? mapped[0].block_time : null,
    });
  } catch (err) {
    console.error("[recent-ch] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
}
