var C="hunter-v3";
self.addEventListener("install",function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(["./","index.html","style.css","data.js","figures.js","app.js","manifest.json","vendor/pdf.min.js","vendor/pdf.worker.min.js","scene.js"])}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",function(e){
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(C).then(function(x){x.put(e.request,c)});return r}).catch(function(){return caches.match(e.request)}));
});
