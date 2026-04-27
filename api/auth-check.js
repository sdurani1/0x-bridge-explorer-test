export default function handler(req, res) {
  const PASSWORD = process.env.SITE_PASSWORD || "";

  // If no password configured, always allow
  if (!PASSWORD) {
    return res.status(200).json({ ok: true });
  }

  // Check for auth cookie
  const cookies = req.headers.cookie || "";
  const authToken = cookies.split(";").map(c => c.trim()).find(c => c.startsWith("bridge_auth="));
  const token = authToken ? authToken.split("=")[1] : null;

  const expectedToken = Buffer.from(PASSWORD).toString("base64").replace(/[^a-zA-Z0-9]/g, "");

  if (token === expectedToken) {
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: false });
}
