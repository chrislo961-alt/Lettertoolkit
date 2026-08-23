const CACHE='lt-writer-v2.0.0';
const ASSETS=['./','index.html','style.css','app.js','db.js','docx.js','templates.js','manifest.webmanifest','assets/writer-icon.svg','assets/writer-icon-192.png','assets/writer-icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lt-writer-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>{const network=fetch(event.request).then(response=>{if(response.ok&&new URL(event.request.url).origin===location.origin)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>cached);return cached||network}))});
