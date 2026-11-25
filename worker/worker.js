// Cloudflare Worker: защищённая публикация JSON и картинок в GitHub.
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "";
    const headers = {
      "Access-Control-Allow-Origin": allowed && origin === allowed ? origin : allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, {headers});
    const url = new URL(request.url);
    if (url.pathname !== "/publish" || request.method !== "POST")
      return Response.json({error:"Not found"}, {status:404, headers});
    if (!env.ADMIN_PASSWORD || request.headers.get("X-Admin-Password") !== env.ADMIN_PASSWORD)
      return Response.json({error:"Неверный пароль"}, {status:401, headers});
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO)
      return Response.json({error:"Worker не настроен: проверьте секреты и переменные"}, {status:500, headers});
    let body;
    try { body = await request.json(); } catch { return Response.json({error:"Некорректный JSON"}, {status:400,headers}); }
    if (!body || !Array.isArray(body.categories) || !Array.isArray(body.instructions))
      return Response.json({error:"Неверный формат данных"}, {status:400,headers});
    const branch = env.GITHUB_BRANCH || "main";
    const path = "data/instructions.json";
    const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
    const common = { "Authorization": `Bearer ${env.GITHUB_TOKEN}`, "Accept":"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"Pomoshnik-Publisher" };
    const current = await fetch(`${api}?ref=${branch}`, {headers:common});
    let sha;
    if (current.ok) sha = (await current.json()).sha;
    const payload = { message:"Обновление инструкций из панели администратора", content:btoa(unescape(encodeURIComponent(JSON.stringify(body,null,2)))), branch };
    if (sha) payload.sha = sha;
    const saved = await fetch(api, {method:"PUT", headers:{...common,"Content-Type":"application/json"}, body:JSON.stringify(payload)});
    if (!saved.ok) return Response.json({error:"GitHub не принял изменения", details:await saved.text()}, {status:502,headers});
    return Response.json({ok:true}, {headers});
  }
};
