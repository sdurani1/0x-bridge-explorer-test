// Wallet history via 0x internal ClickHouse
// Falls back to tx-history-beta if ClickHouse is unavailable
// Requires env vars: CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { user, limit: limitParam, cursor, status, chain, bridge, after, before } = req.query;
  if (!user) return res.status(400).json({ error: "user required" });

  const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 100);
  const offset = parseInt(cursor) || 0;

  const chHost = process.env.CLICKHOUSE_HOST;
  const chUser = process.env.CLICKHOUSE_USER;
  const chPass = process.env.CLICKHOUSE_PASSWORD;

  // Try ClickHouse first
  if (chHost && chUser) {
    try {
      // Sanitize wallet address — handle both EVM (0x-prefixed hex) and Solana (base58)
      const isEvm = user.startsWith("0x");
      const addr = isEvm
        ? user.toLowerCase().replace(/[^a-f0-9x]/g, "")
        : user.replace(/[^A-Za-z0-9]/g, "");

      // Build WHERE clause with filters
      // EVM addresses are case-insensitive; Solana addresses are case-sensitive
      let where = isEvm
        ? `(lower(origin_address) = '${addr}' OR lower(destination_address) = '${addr}')`
        : `(origin_address = '${addr}' OR destination_address = '${addr}')`;
      if (status) {
        const s = status.replace(/[^a-z_]/g, "");
        where += ` AND settlement_status = '${s}'`;
      }
      if (chain) {
        const c = chain.replace(/[^a-z0-9]/g, "");
        where += ` AND (origin_chain_id = '${c}' OR destination_chain_id = '${c}')`;
      }
      if (bridge) {
        const b = bridge.replace(/[^a-z0-9_]/g, "");
        where += ` AND bridge_provider = '${b}'`;
      }
      if (after) {
        const a = after.replace(/[^0-9\-T:Z]/g, "");
        where += ` AND timestamp >= '${a}'`;
      }
      if (before) {
        const b2 = before.replace(/[^0-9\-T:Z]/g, "");
        where += ` AND timestamp <= '${b2}'`;
      }

      // Count total + volume for pagination and stats
      const countQuery = `SELECT count() as cnt, sum(volume_usd) as total_volume FROM magic.trades_cross_chain WHERE ${where}`;

      const dataQuery = `
        SELECT
          origin_chain_id, destination_chain_id,
          origin_transaction_hash, destination_transaction_hash,
          origin_address, destination_address,
          bridge_provider, settlement_status,
          sell_token, sell_token_symbol, toString(sell_amount) as sell_amount, sell_usd,
          buy_token, buy_token_symbol, toString(buy_amount) as buy_amount, buy_usd,
          volume_usd, zippo_app_name, toString(timestamp) as timestamp
        FROM magic.trades_cross_chain
        WHERE ${where}
        ORDER BY timestamp DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const chUrl = `${chHost}/?default_format=JSONEachRow`;
      const authHeader = "Basic " + Buffer.from(`${chUser}:${chPass || ""}`).toString("base64");

      const [countRes, dataRes] = await Promise.all([
        fetch(chUrl, {
          method: "POST",
          headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
          body: countQuery,
          signal: AbortSignal.timeout(8000),
        }),
        fetch(chUrl, {
          method: "POST",
          headers: { "Authorization": authHeader, "Content-Type": "text/plain" },
          body: dataQuery,
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      if (!countRes.ok || !dataRes.ok) throw new Error("ClickHouse query failed");

      const countText = await countRes.text();
      const countLine = countText.trim().split("\n")[0];
      const countData = countLine ? JSON.parse(countLine) : {};
      const total = countData.cnt || 0;
      const totalVolume = Number(countData.total_volume) || 0;

      const dataText = await dataRes.text();
      const rows = dataText.trim().split("\n").filter(Boolean).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);

      // Map Solana chain IDs
      const parseChainId = (cid) => {
        if (!cid) return null;
        if (cid === "solana") return 999999999991;
        const n = Number(cid);
        return isNaN(n) ? null : n;
      };

      // Map to the same shape as tx-history-beta but with richer data
      const transactions = rows.map(r => ({
        originChain:      parseChainId(r.origin_chain_id),
        originTx:         r.origin_transaction_hash,
        destinationChain: parseChainId(r.destination_chain_id),
        destinationTx:    r.destination_transaction_hash || null,
        status:           r.settlement_status,
        bridge:           r.bridge_provider,
        // Extra fields from ClickHouse
        sellToken:        r.sell_token,
        sellTokenSymbol:  r.sell_token_symbol,
        sellAmount:       r.sell_amount,
        sellUsd:          r.sell_usd,
        buyToken:         r.buy_token,
        buyTokenSymbol:   r.buy_token_symbol,
        buyAmount:        r.buy_amount,
        buyUsd:           r.buy_usd,
        volumeUsd:        r.volume_usd,
        timestamp:        r.timestamp,
        originAddress:    r.origin_address,
        destinationAddress: r.destination_address,
        appName:          r.zippo_app_name || null,
      }));

      const nextOffset = offset + limit;
      const hasMore = nextOffset < total;

      return res.status(200).json({
        transactions,
        pagination: {
          limit,
          nextCursor: hasMore ? String(nextOffset) : null,
          hasMore,
          total,
        },
        totalVolume,
        source: "clickhouse",
      });
    } catch (err) {
      console.error("[wallet-ch] ClickHouse error:", err.message);
      // Fall through to tx-history-beta
    }
  }

  // Fallback to tx-history-beta
  const apiKey = process.env.ZERO_EX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "no api key" });

  const params = new URLSearchParams({ user, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);

  try {
    const upstreamRes = await fetch(
      `https://api.0x.org/cross-chain/tx-history-beta?${params}`,
      { headers: { "0x-api-key": apiKey }, signal: AbortSignal.timeout(10000) }
    );
    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json({ ...data, source: "tx-history-beta" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
