// All pending cross-chain transactions via ClickHouse
// Shows bridge_pending, origin_tx_confirmed, origin_tx_pending globally
// Requires env vars: CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

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
    const query = `
      SELECT
        origin_chain_id, destination_chain_id,
        origin_transaction_hash, destination_transaction_hash,
        origin_address, destination_address,
        bridge_provider, settlement_status,
        sell_token_symbol, toString(sell_amount) as sell_amount, sell_usd,
        buy_token_symbol, toString(buy_amount) as buy_amount, buy_usd,
        volume_usd, zippo_app_name, toString(timestamp) as timestamp
      FROM magic.trades_cross_chain
      WHERE settlement_status IN ('bridge_pending', 'origin_tx_confirmed', 'origin_tx_pending')
        AND timestamp >= now() - INTERVAL 7 DAY
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const chUrl = `${host}/?default_format=JSONEachRow`;
    const authHeader = "Basic " + Buffer.from(`${user}:${password || ""}`).toString("base64");

    const chRes = await fetch(chUrl, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
      body: query,
      signal: AbortSignal.timeout(8000),
    });

    if (!chRes.ok) throw new Error("ClickHouse query failed");

    const text = await chRes.text();
    const rows = text.trim().split("\n").filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const parseChainId = (cid) => {
      if (!cid) return null;
      if (cid === "solana") return 999999999991;
      const n = Number(cid);
      return isNaN(n) ? null : n;
    };

    const mapped = rows.map(r => ({
      originChain:      parseChainId(r.origin_chain_id),
      originTx:         r.origin_transaction_hash,
      destinationChain: parseChainId(r.destination_chain_id),
      destinationTx:    r.destination_transaction_hash || null,
      status:           r.settlement_status,
      bridge:           r.bridge_provider,
      sellTokenSymbol:  r.sell_token_symbol,
      sellAmount:       r.sell_amount,
      sellUsd:          r.sell_usd,
      buyTokenSymbol:   r.buy_token_symbol,
      buyAmount:        r.buy_amount,
      buyUsd:           r.buy_usd,
      volumeUsd:        r.volume_usd,
      timestamp:        r.timestamp,
      originAddress:    r.origin_address,
      appName:          r.zippo_app_name || null,
    }));

    return res.status(200).json({ rows: mapped, total: mapped.length });
  } catch (err) {
    console.error("[pending] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch pending transactions" });
  }
}
