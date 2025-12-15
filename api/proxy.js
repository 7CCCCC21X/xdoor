// api/proxy.jsapi/proxy.js

export default async function handler(req, res) {
  try {
    // 允许所有来源（关键：解决 CORS）
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // 处理浏览器的预检请求
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Missing url parameter"
      });
    }

    // 安全性：只允许代理 xdoor 接口（防滥用）
    if (!url.startsWith("https://api.xdoor.meme/")) {
      return res.status(403).json({
        success: false,
        message: "Forbidden target"
      });
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        // 模拟普通浏览器 UA，避免被挡
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
      }
    });

    const text = await response.text();

    // 原样返回（包括状态码）
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Proxy error"
    });
  }
}
