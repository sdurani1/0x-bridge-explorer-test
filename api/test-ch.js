// Simple ClickHouse connectivity test
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const host = process.env.CLICKHOUSE_HOST;
  const user = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;

  if (!host || !user) {
    return res.status(500).json({
      error: "Missing env vars",
      hasHost: !!host,
      hasUser: !!user,
      hasPassword: !!password,
    });
  }

  try {
    const url = `${host}/?default_format=JSONEachRow`;
    const authHeader = "Basic " + Buffer.from(`${user}:${password || ""}`).toString("base64");

    const chRes = await fetch(url, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
      body: "SELECT 1 as ok",
      signal: AbortSignal.timeout(5000),
    });

    const text = await chRes.text();

    return res.status(200).json({
      status: chRes.status,
      statusText: chRes.statusText,
      response: text.slice(0, 500),
      host: host.replace(/\/\/(.+?)[:@].*/, '//<redacted>'), // redact credentials in URL if any
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      type: err.constructor.name,
      host: host.replace(/\/\/(.+?)[:@].*/, '//<redacted>'),
    });
  }
}
