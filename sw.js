// Same-origin network-first cache. Never replace a missing script with HTML.
const CACHE='indygames-v3.6-20261020';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('indygames-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));}return res;}).catch(async()=>{const cached=await caches.match(req);if(cached)return cached;if(req.mode==='navigate')return new Response('<!doctype html><html lang="cs"><meta charset="utf-8"><title>IndyGames offline</title><body style="background:#0a0a0f;color:white;font-family:system-ui;padding:32px"><h1>Právě jsi offline</h1><p>Tato stránka ještě není uložená. Připoj se k internetu a zkus ji znovu.</p><a href="/index.html" style="color:#88aaff">Úvodní stránka</a></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});return new Response('',{status:503});}));
});
