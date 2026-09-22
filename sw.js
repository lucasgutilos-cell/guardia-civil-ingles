const VERSION='gc-static-v1';
const SHELL=['./','index.html','manifest.webmanifest','assets/css/app.css','assets/js/app.js','assets/js/config.js','assets/js/core/html.js','assets/js/modules/english/explanations.js','assets/js/modules/academic/phrases.js','assets/js/services/scoring.js','assets/js/services/timer.js','assets/js/services/question-cycles.js','assets/js/services/storage.js','assets/js/services/stats.js','assets/js/services/supabase.js','assets/icons/icon.svg','assets/icons/icon-192.png','assets/icons/icon-512.png'];
const BANKS=['data/english/official.json','data/english/training.json','data/orthography/official.json','data/orthography/training.json','data/grammar/official.json','data/grammar/training.json','data/grammar/explanations.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL))));
// Never skipWaiting while a test is active. An old page keeps its coherent bank
// version until all its tabs close; the next launch activates the new worker.
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('gc-static-')&&name!==VERSION)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{
 if(event.data==='prepare-offline')event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(BANKS)).then(()=>event.source?.postMessage('offline-ready')).catch(()=>event.source?.postMessage('offline-failed')));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(![...SHELL,...BANKS].some(p=>new URL(p,self.registration.scope).pathname===url.pathname))return;
 event.respondWith((async()=>{
   const cache=await caches.open(VERSION);
   // Banks are network-first: changes are visible at the next module load.
   // No auth or Supabase response is ever stored in this cache.
   try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch(error){const cached=await cache.match(event.request);if(cached)return cached;throw error;}
 })());
});
