const DUNE_QUERY_ID = 6848249;
const DUNE_API_KEY  = process.env.DUNE_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!DUNE_API_KEY) return res.status(500).json({ error: "Dune API key not configured" });

  try {
    // Fetch latest cached results directly — no execution needed, returns instantly
    const dataRes = await fetch(
      `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results?limit=20`,
      { headers: { "X-Dune-API-Key": DUNE_API_KEY } }
    );
    const data = await dataRes.json();
    const rows = data.result?.rows || [];
    const executedAt = data.execution_started_at || null;

    return res.status(200).json({ rows, executedAt });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
}
