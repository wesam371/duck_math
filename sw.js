/* sw.js */
var VERSION='duckmath-v5';
var SHELL=['./','./index.html','./config.json','./css/base.css','./css/layout.css','./css/components.css',
  './js/utils.js','./js/math.js','./js/solvers.js','./js/data.js','./js/site.js','./js/solver-ui.js',
  './js/curriculum.js','./js/lab.js','./js/notebook.js','./js/assistant.js','./js/app.js'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){
    return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k.indexOf('duckmath-')===0&&k!==VERSION})
      .map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===location.origin){
    if(url.pathname.indexOf('config.json')>=0){
      e.respondWith(fetch(req).then(function(res){
        if(res&&res.ok)caches.open(VERSION).then(function(c){c.put(req,res.clone())});
        return res;
      }).catch(function(){return caches.match(req)}));
      return;
    }
    e.respondWith(fetch(req).then(function(res){
      if(res&&res.ok)caches.open(VERSION).then(function(c){c.put(req,res.clone())});
      return res;
    }).catch(function(){return caches.match(req)}));
    return;
  }
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(function(cached){
      return cached||fetch(req).then(function(res){
        if(res&&(res.ok||res.type==='opaque'))caches.open(VERSION).then(function(c){c.put(req,res.clone())});
        return res;
      }).catch(function(){return cached});
    }));
  }
});
