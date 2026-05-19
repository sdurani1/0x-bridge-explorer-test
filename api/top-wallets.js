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
  const period = url.searchParams.get("period") || "30d"; // 7d, 30d, all
  const limit = Math.min(Number(url.searchParams.get("limit")) || 25, 50);

  let dateFilter = "";
  if (period === "7d") dateFilter = "AND timestamp >= now() - INTERVAL 7 DAY";
  else if (period === "30d") dateFilter = "AND timestamp >= now() - INTERVAL 30 DAY";
  else if (period === "90d") dateFilter = "AND timestamp >= now() - INTERVAL 90 DAY";
  // "all" = no date filter

  try {
    const query = `
      SELECT
        origin_address,
        sum(volume_usd) as total_volume,
        count() as trade_count,
        max(timestamp) as last_active,
        topK(1)(bridge_provider) as top_bridge,
        topK(1)(zippo_app_name) as top_app,
        uniqExact(destination_chain_id) as dest_chains_count,
        uniqExact(origin_chain_id) as src_chains_count
      FROM magic.trades_cross_chain
      WHERE settlement_status = 'bridge_filled'
        ${dateFilter}
      GROUP BY origin_address
      ORDER BY total_volume DESC
      LIMIT ${limit}
    `;

    const authHeader = "Basic " + btoa(`${chUser}:${chPass || ""}`);
    const res = await fetch(`${chHost}/?default_format=JSONEachRow`, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
      body: query,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "ClickHouse query failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const text = await res.text();
    const rows = text.trim().split("\n").filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const mapped = rows.map((r, i) => ({
      rank: i + 1,
      address: r.origin_address,
      totalVolume: Number(r.total_volume) || 0,
      tradeCount: Number(r.trade_count) || 0,
      lastActive: r.last_active,
      topBridge: r.top_bridge?.[0] || null,
      topApp: r.top_app?.[0] || null,
      destChainsCount: Number(r.dest_chains_count) || 0,
      srcChainsCount: Number(r.src_chains_count) || 0,
    }));

    return new Response(JSON.stringify({ wallets: mapped, period, total: mapped.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=300" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch top wallets" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
