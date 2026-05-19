export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PASSWORD = process.env.SITE_PASSWORD || "";
  if (!PASSWORD) {
    return res.status(200).json({ ok: true });
  }

  const { password } = req.body || {};
  if (password !== PASSWORD) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  // Set auth cookie (valid for 30 days)
  const token = Buffer.from(PASSWORD).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  res.setHeader("Set-Cookie", `bridge_auth=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
  return res.status(200).json({ ok: true });
}
