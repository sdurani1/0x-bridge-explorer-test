export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const user   = searchParams.get("user");
  const cursor = searchParams.get("cursor") || "";
  const limit  = searchParams.get("limit")  || "50";

  if (!user) return new Response(JSON.stringify({ error: "user required" }), { status: 400 });

  const apiKey = process.env.ZERO_EX_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "no api key" }), { status: 500 });

  const params = new URLSearchParams({ user, limit });
  if (cursor) params.set("cursor", cursor);

  try {
    const res = await fetch(
      `https://api.0x.org/cross-chain/tx-history-beta?${params}`,
      { headers: { "0x-api-key": apiKey }, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
