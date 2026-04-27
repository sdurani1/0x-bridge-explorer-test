export const config = { runtime: "edge" };

export default async function handler(req) {
  const chHost = process.env.CLICKHOUSE_HOST;
  const chUser = process.env.CLICKHOUSE_USER;
  const chPass = process.env.CLICKHOUSE_PASSWORD;

  if (!chHost || !chUser) {
    return new Response(JSON.stringify({ error: "ClickHouse not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const query = `
      SELECT
        toString(max(timestamp)) as latest_tx,
        toString(now()) as server_time,
        dateDiff('minute', max(timestamp), now()) as lag_minutes,
        dateDiff('second', max(timestamp), now()) as lag_seconds,
        count() as total_rows,
        countIf(timestamp >= now() - INTERVAL 1 HOUR) as rows_last_1h,
        countIf(timestamp >= now() - INTERVAL 24 HOUR) as rows_last_24h
      FROM magic.trades_cross_chain
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
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = await res.text();
    const line = text.trim().split("\n")[0];
    if (!line) {
      return new Response(JSON.stringify({ error: "No data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const r = JSON.parse(line);
    const lagMin = Number(r.lag_minutes);
    const lagHours = Math.floor(lagMin / 60);
    const lagRemMin = lagMin % 60;
    const lagStr = lagHours > 0
      ? `${lagHours}h ${lagRemMin}m`
      : `${lagMin}m`;

    return new Response(JSON.stringify({
      latestTransaction: r.latest_tx + " UTC",
      serverTime: r.server_time,
      lagMinutes: lagMin,
      lagSeconds: Number(r.lag_seconds),
      lagHuman: lagStr,
      totalRows: Number(r.total_rows),
      rowsLast1h: Number(r.rows_last_1h),
      rowsLast24h: Number(r.rows_last_24h),
      status: lagMin <= 15 ? "healthy" : lagMin <= 60 ? "delayed" : "stale",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to check freshness" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
