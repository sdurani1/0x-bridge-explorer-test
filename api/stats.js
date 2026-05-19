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

  try {
    const query = `
      SELECT
        sum(volume_usd) as total_volume,
        count() as total_trades,
        sumIf(volume_usd, timestamp >= now() - INTERVAL 24 HOUR) as volume_24h,
        countIf(timestamp >= now() - INTERVAL 24 HOUR) as trades_24h,
        sumIf(volume_usd, timestamp >= now() - INTERVAL 7 DAY) as volume_7d,
        countIf(timestamp >= now() - INTERVAL 7 DAY) as trades_7d
      FROM magic.trades_cross_chain
      WHERE settlement_status = 'bridge_filled'
    `;

    const authHeader = "Basic " + btoa(`${chUser}:${chPass || ""}`);
    const res = await fetch(`${chHost}/?default_format=JSONEachRow`, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
      body: query,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "ClickHouse query failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const text = await res.text();
    const line = text.trim().split("\n")[0];
    if (!line) {
      return new Response(JSON.stringify({ error: "No data" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const r = JSON.parse(line);

    return new Response(JSON.stringify({
      totalVolume: Number(r.total_volume) || 0,
      totalTrades: Number(r.total_trades) || 0,
      volume24h: Number(r.volume_24h) || 0,
      trades24h: Number(r.trades_24h) || 0,
      volume7d: Number(r.volume_7d) || 0,
      trades7d: Number(r.trades_7d) || 0,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=300" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch stats" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
