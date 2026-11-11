// worker.js — ptaki.snufkin.workers.dev
// Static assets (Workers Builds, Git integration) + CARTO key injection.
// All requests reach this worker first (run_worker_first); the ASSETS binding
// serves everything; only the report pages (/raport-obserwacji*) get the CARTO
// key injected — HTML responses only, and only when the secret exists.
// Injection targets the single assignment `var CARTO_KEY = "__CARTO_KEY__"`.
// The template also uses the placeholder inside a guard comparison
// (CARTO_KEY !== "__CARTO_KEY__") and a comment — those stay untouched, so the
// guard correctly detects "key was injected" and appends ?key= to tile URLs.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    const key = env.CARTO_API_KEY;
    if (!key) return res;
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/raport-obserwacji")) return res;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const TOKEN = 'var CARTO_KEY = "__CARTO_KEY__";';
    const body = await res.text();
    if (!body.includes(TOKEN)) return res;
    const injected = "var CARTO_KEY = " + JSON.stringify(key) + ";";
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    headers.delete("etag");
    headers.delete("last-modified");
    return new Response(body.replace(TOKEN, injected), {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
