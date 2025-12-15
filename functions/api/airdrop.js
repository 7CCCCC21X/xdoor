
export async function onRequest(context) {
  const { request } = context;

  // 允许预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  try {
    const url = new URL(request.url);
    const address = url.searchParams.get("address") || "";

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return json(
        { success: false, message: "Invalid address" },
        400
      );
    }

    // 上游接口
    const upstream = `https://api.xdoor.meme/airdropAmount?address=${encodeURIComponent(address)}`;

    // 透传请求（可按需加 timeout / 重试，这里先保持简单稳定）
    const resp = await fetch(upstream, {
      method: "GET",
      headers: {
        "accept": "application/json",
        // 某些上游会看 UA，给一个常见值更稳
        "user-agent": "Mozilla/5.0 (XDoor Airdrop Proxy)",
      },
    });

    const text = await resp.text(); // 不要直接 resp.json()，避免上游返回非 JSON 时抛错
    return new Response(text, {
      status: resp.status,
      headers: {
        ...corsHeaders(),
        "content-type": resp.headers.get("content-type") || "application/json; charset=utf-8",
        // 可缓存：减少上游压力（你想实时就改短点）
        "cache-control": "public, max-age=30",
      },
    });
  } catch (err) {
    return json(
      { success: false, message: "Proxy error", detail: String(err?.message || err) },
      500
    );
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
    },
  });
}
