export const config = { runtime: "edge" };

export default async function handler(req) {
  const chHost = process.env.CLICKHOUSE_HOST;
  const chUser = process.env.CLICKHOUSE_USER;
  const chPass = process.env.CLICKHOUSE_PASSWORD;

  if (!chHost || !chUser) {
    return new Response(JSON.stringify({ error: "ClickHouse not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  try {
    const countQuery = `SELECT count() as cnt FROM magic.trades_cross_chain WHERE settlement_status = 'bridge_failed'`;

    const dataQuery = `
      SELECT
        origin_chain_id, destination_chain_id,
        origin_transaction_hash, destination_transaction_hash,
        origin_address, destination_address,
        bridge_provider, settlement_status,
        sell_token_symbol, toString(sell_amount) as sell_amount, sell_usd,
        buy_token_symbol, toString(buy_amount) as buy_amount, buy_usd,
        volume_usd, zippo_app_name, toString(timestamp) as timestamp,
        refund_status, refund_token_symbol, refund_usd,
        bridge_failure_reason
      FROM magic.trades_cross_chain
      WHERE settlement_status = 'bridge_failed'
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const authHeader = "Basic " + btoa(`${chUser}:${chPass || ""}`);
    const [countRes, dataRes] = await Promise.all([
      fetch(`${chHost}/?default_format=JSONEachRow`, {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
        body: countQuery,
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${chHost}/?default_format=JSONEachRow`, {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
        body: dataQuery,
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (!countRes.ok || !dataRes.ok) {
      return new Response(JSON.stringify({ error: "ClickHouse query failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const countText = await countRes.text();
    const countLine = countText.trim().split("\n")[0];
    const total = countLine ? JSON.parse(countLine).cnt : 0;

    const dataText = await dataRes.text();
    const rows = dataText.trim().split("\n").filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const mapped = rows.map(r => ({
      originChain:    r.origin_chain_id,
      destinationChain: r.destination_chain_id,
      originTx:       r.origin_transaction_hash,
      destinationTx:  r.destination_transaction_hash,
      bridge:         r.bridge_provider || null,
      sellSymbol:     r.sell_token_symbol,
      sellAmount:     r.sell_amount,
      sellUsd:        r.sell_usd,
      buySymbol:      r.buy_token_symbol,
      buyAmount:      r.buy_amount,
      buyUsd:         r.buy_usd,
      volumeUsd:      r.volume_usd,
      appName:        r.zippo_app_name || null,
      timestamp:      r.timestamp,
      originAddress:  r.origin_address,
      refundStatus:   r.refund_status || null,
      refundSymbol:   r.refund_token_symbol || null,
      refundUsd:      r.refund_usd != null ? Number(r.refund_usd) : null,
      failureReason:  r.bridge_failure_reason || null,
    }));

    return new Response(JSON.stringify({ rows: mapped, total, limit, offset }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=120" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch failed transactions" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
