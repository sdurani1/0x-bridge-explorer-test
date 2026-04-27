export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name")?.trim()?.toLowerCase();

  if (!name || !name.endsWith(".eth")) {
    return new Response(JSON.stringify({ error: "Invalid ENS name" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch("https://api.thegraph.com/subgraphs/name/ensdomains/ens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ domains(where: { name: "${name}" }) { resolvedAddress { id } } }`,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "ENS lookup failed" }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const address = data?.data?.domains?.[0]?.resolvedAddress?.id || null;

    if (!address) {
      return new Response(JSON.stringify({ error: "ENS name not found", name }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ name, address }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "ENS resolution failed" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
