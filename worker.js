// worker.js — ptaki.snufkin.workers.dev
// Static assets (Workers Builds, Git integration) + CARTO key injection.
// All requests reach this worker first (run_worker_first), the assets binding
// serves everything; only the report pages (/raport-obserwacji*) get the
// __CARTO_KEY__ placeholder replaced with the CARTO_API_KEY secret —
// HTML responses only, and only when the secret exists.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    const key = env.CARTO_API_KEY;
    if (!key) return res;
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/raport-obserwacji")) return res;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const body = await res.text();
    if (!body.includes("__CARTO_KEY__")) return res;
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    headers.delete("etag");
    headers.delete("last-modified");
    return new Response(body.replaceAll("__CARTO_KEY__", key), {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  },
};
