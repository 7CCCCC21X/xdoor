export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const address = (req.query.address || "").toString();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ success: false, message: "Invalid address" });
    }

    const upstream = `https://api.xdoor.meme/airdropAmount?address=${encodeURIComponent(address)}`;

    const resp = await fetch(upstream, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (XDoor Airdrop Proxy)",
      },
    });

    const text = await resp.text();

    res.setHeader(
      "Content-Type",
      resp.headers.get("content-type") || "application/json; charset=utf-8"
    );
    // 缓存 30s（减少上游压力；想更实时可改小）
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

    return res.status(resp.status).send(text);
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Proxy error",
      detail: String(e?.message || e),
    });
  }
}
