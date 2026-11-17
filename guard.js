/* guard.js — Duck_math_sitting
   ضعه في جذر مستودع duck_math بجانب index.html
   وأضف <script src="guard.js"><\/script> كأول عنصر داخل <head> */
(function(){
var CFG='config.json',root=document.documentElement,shown=false,tintCache={},lastSig='';
root.style.opacity='0';
var safety=setTimeout(show,1600);
function show(){if(shown)return;shown=true;clearTimeout(safety);root.style.opacity='';}
var MARK={"duck":"function(f,bg,e){return '<path d=\"M30 62V32C30 24 36 18 44 18C52 18 58 24 58 32C58 40 52 46 44 46V62Z\" fill=\"'+f+'\"/><path d=\"M56 28L64 33L56 38Z\" fill=\"'+f+'\"/><circle cx=\"49\" cy=\"29\" r=\"2.5\" fill=\"'+e+'\"/>'}","gear":"function(f,bg,e){var t='',i;for(i=0;i<8;i++)t+='<rect x=\"28\" y=\"3\" width=\"8\" height=\"13\" transform=\"rotate('+(i*45)+' 32 32)\" fill=\"'+f+'\"/>';\n    return t+'<circle cx=\"32\" cy=\"32\" r=\"20\" fill=\"'+f+'\"/><circle cx=\"32\" cy=\"32\" r=\"8\" fill=\"'+bg+'\"/>'}","book":"function(f,bg,e){return '<path d=\"M8 12h20a6 6 0 016 6v34a6 6 0 00-6-6H8z\" fill=\"'+f+'\"/><path d=\"M56 12H36a6 6 0 00-6 6v34a6 6 0 016-6h20z\" fill=\"'+f+'\" opacity=\".62\"/><rect x=\"30\" y=\"16\" width=\"4\" height=\"36\" fill=\"'+bg+'\"/>'}","pi":"function(f,bg,e){return '<rect x=\"8\" y=\"14\" width=\"48\" height=\"8\" fill=\"'+f+'\"/><rect x=\"18\" y=\"22\" width=\"8\" height=\"34\" fill=\"'+f+'\"/><rect x=\"38\" y=\"22\" width=\"8\" height=\"26\" fill=\"'+f+'\"/><path d=\"M38 48h14v8H38z\" fill=\"'+f+'\"/>'}","sigma":"function(f,bg,e){return '<path d=\"M12 10h40v9H26l14 13-14 13h26v9H12v-8l16-14-16-14z\" fill=\"'+f+'\"/>'}","compass":"function(f,bg,e){return '<circle cx=\"32\" cy=\"32\" r=\"24\" fill=\"none\" stroke=\"'+f+'\" stroke-width=\"5\"/><path d=\"M42 22L28 28l-6 14 14-6z\" fill=\"'+f+'\"/><circle cx=\"32\" cy=\"32\" r=\"3\" fill=\"'+bg+'\"/>'}"};
function mk(k,f,bg,e){try{return (new Function('f','bg','e','return ('+MARK[k]+')(f,bg,e)'))(f,bg,e);}catch(x){return '';}}
function builtIn(k,f,bg,e,s,solid){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 64 64">'+(solid?'<rect width="64" height="64" fill="'+bg+'"/>':'')+mk(k||'duck',f,bg,e)+'</svg>';}
function tint(data,color,cb){var k=color+'|'+data.length+'|'+data.slice(-32);
 if(tintCache[k]){cb(tintCache[k]);return;}var im=new Image();
 im.onload=function(){try{var c=document.createElement('canvas');c.width=im.naturalWidth||256;c.height=im.naturalHeight||256;
 var x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);
 tintCache[k]=c.toDataURL('image/png');cb(tintCache[k]);}catch(err){cb(data);}};im.onerror=function(){cb(data);};im.src=data;}
function iconHTML(ic,s){
 if(!ic)return builtIn('duck','#E3270E','#FBFBF8','#FBFBF8',s,false);
 if(ic.kind==='custom'&&ic.custom){var c=ic.custom,p=Math.round(s*(ic.pad||0)/100),inner=Math.max(1,s-p*2),
  rad=Math.round(s*(ic.radius||0)/100),bg=ic.solid?(ic.bg||'#FBFBF8'):'transparent',body;
  if(c.type==='image/svg+xml'){body='<span style="display:block;width:'+inner+'px;height:'+inner+'px">'+c.svg+'</span>';}
  else{var src=(ic.tint&&tintCache[(ic.tintColor||'#101010')+'|'+c.data.length+'|'+c.data.slice(-32)])||c.data;
   body='<img alt="" src="'+src+'" style="display:block;width:'+inner+'px;height:'+inner+'px;object-fit:'+(ic.fit||'contain')+'">';}
  return '<span style="display:inline-grid;place-items:center;width:'+s+'px;height:'+s+'px;background:'+bg+';border-radius:'+rad+'px;overflow:hidden;padding:'+p+'px;box-sizing:border-box">'+body+'</span>';}
 return builtIn(ic.kind,ic.fill,ic.bg,ic.eye,s,!!ic.solid);}
function iconURI(ic){if(ic&&ic.kind==='custom'&&ic.custom){var c=ic.custom;
  if(c.type==='image/svg+xml')return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(c.svg);
  return c.data;}return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(builtIn(ic&&ic.kind,ic&&ic.fill,ic&&ic.bg,ic&&ic.eye,64,true));}
function applyIcon(ic,size){
 var sig=JSON.stringify(ic)+'|'+size;if(sig===lastSig)return;lastSig=sig;
 var sel='[data-duck],[data-duck-big],.brand-mark,.about-mark';
 Array.prototype.forEach.call(document.querySelectorAll(sel),function(el){
  var s=el.hasAttribute('data-duck-big')||el.classList.contains('about-mark')?Math.max(size*2,64):size;
  el.innerHTML=iconHTML(ic,s);});
 var uri=iconURI(ic);
 var l=document.querySelector('link#favicon')||document.querySelector('link[rel~="icon"]');
 if(!l){l=document.createElement('link');l.rel='icon';l.id='favicon';document.head.appendChild(l);}
 l.href=uri;
 var ap=document.querySelector('link[rel="apple-touch-icon"]');
 if(!ap){ap=document.createElement('link');ap.rel='apple-touch-icon';document.head.appendChild(ap);}ap.href=uri;
 if(ic&&ic.kind==='custom'&&ic.custom&&ic.custom.type!=='image/svg+xml'&&ic.tint&&!tintCache[(ic.tintColor||'#101010')+'|'+ic.custom.data.length+'|'+ic.custom.data.slice(-32)])
  tint(ic.custom.data,ic.tintColor||'#101010',function(){lastSig='';applyIcon(ic,size);});}
function brand(c){var b=c.brand||{},ic=c.icon||{},r=root.style;
 if(ic.fill)r.setProperty('--duck',ic.fill);if(ic.bg)r.setProperty('--duck-bg',ic.bg);if(ic.eye)r.setProperty('--duck-eye',ic.eye);
 if(b.accent)r.setProperty('--red',b.accent);if(b.paper)r.setProperty('--paper',b.paper);if(b.ink)r.setProperty('--ink',b.ink);
 if(b.rule)r.setProperty('--rule',b.rule+'px solid '+(b.ink||'#101010'));
 if(b.shadow===false)r.setProperty('--hard','none');
 if(c.name){document.title=c.name+(c.tagline?' — '+c.tagline:'');
  Array.prototype.forEach.call(document.querySelectorAll('[data-sitename]'),function(e){e.textContent=c.name;});}
 if(b.wordmark===false)Array.prototype.forEach.call(document.querySelectorAll('.brand-t'),function(e){e.style.display='none';});
 if(b.tagline===false)Array.prototype.forEach.call(document.querySelectorAll('.brand-t small'),function(e){e.style.display='none';});
 if(b.grid===false)Array.prototype.forEach.call(document.querySelectorAll('.bg-grid,.bg'),function(e){e.style.display='none';});
 applyIcon(ic,b.mark||32);
 if(window.KH&&window.KH.paintDucks&&!window.KH.__dmPatched){window.KH.__dmPatched=true;
  var orig=window.KH.paintDucks;window.KH.paintDucks=function(){try{orig.apply(this,arguments);}catch(e){}lastSig='';applyIcon(ic,b.mark||32);};}
 if(c.developers&&window.KH&&window.KH.config){window.KH.config.developers=c.developers;
  var dl=document.getElementById('devList');
  if(dl){dl.innerHTML=c.developers.map(function(d){var p=String(d.name).trim().split(/\s+/);
   var ini=((p[0]||'')[0]||'')+((p[1]||'')[0]||'');
   return '<div class="dev-item"><span class="dev-av">'+ini+'</span><span class="dev-tx"><b>'+d.name+'</b>'+(d.role?'<span>'+d.role+'</span>':'')+'</span></div>';}).join('');}}}
function occ(s,from,to){var out=[],a=new Date(s.start),b=new Date(s.end),dur=b-a;
 if(!isFinite(a)||!isFinite(b)||dur<=0)return out;
 if(s.repeat==='once'){if(+b>from&&+a<to)out.push([+a,+b]);return out;}
 var d=new Date(from);d.setHours(0,0,0,0);d.setDate(d.getDate()-1);
 for(var i=0;i<420;i++){if(+d>to+86400000)break;
  var ok=s.repeat==='daily'||(s.days||[]).indexOf(d.getDay())>=0;
  if(ok){var x=new Date(d);x.setHours(a.getHours(),a.getMinutes(),0,0);var y=+x+dur;if(y>from&&+x<to)out.push([+x,y]);}
  d.setDate(d.getDate()+1);}return out;}
function state(c,now){var p=c.power||{};
 if(p.mode==='off'){if(p.resumeAt&&now>=p.resumeAt)return{live:true};
  return{live:false,until:p.resumeAt,title:p.title,msg:p.message,contact:p.contact};}
 var hit=null;(c.schedules||[]).forEach(function(s){if(!s.enabled)return;
  occ(s,now-1,now+1).forEach(function(o){if(o[0]<=now&&o[1]>now)hit=o;});});
 if(hit)return{live:false,until:hit[1],title:p.title,msg:p.message,contact:p.contact};
 return{live:true};}
function pad2(n){return (n<10?'0':'')+n;}
function left(ms){if(!ms)return'';var s=Math.max(0,Math.floor((ms-Date.now())/1000));
 var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
 return (d?d+' يوم و':'')+pad2(h)+':'+pad2(m)+':'+pad2(s%60);}
function block(c,st){var b=c.brand||{},ink=b.ink||'#101010',paper=b.paper||'#FBFBF8',ac=b.accent||'#E3270E';
 document.body.innerHTML='';
 document.body.style.cssText='margin:0;background:'+paper+';color:'+ink+';font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center';
 var w=document.createElement('div');
 w.style.cssText='max-width:520px;border:2px solid '+ink+';background:#fff;padding:34px 26px;box-shadow:8px 8px 0 '+ink;
 w.innerHTML='<div style="display:grid;place-items:center;margin-bottom:16px">'+iconHTML(c.icon,64)+'</div>'+
  '<h1 style="font-size:26px;margin:0 0 10px">'+(st.title||'الموقع متوقّف مؤقتًا')+'</h1>'+
  '<p style="font-size:15px;line-height:1.9;color:#4C4C48;margin:0 0 16px">'+(st.msg||'')+'</p>'+
  (st.until?'<div id="dmcd" style="display:inline-block;border:2px solid '+ink+';padding:8px 16px;font-family:monospace;font-weight:700">'+left(st.until)+'</div>':'')+
  (st.contact?'<div style="margin-top:16px"><a href="'+st.contact+'" style="color:'+ac+';font-weight:600">تواصل معنا</a></div>':'')+
  '<p style="margin-top:18px;font-family:monospace;font-size:11px;letter-spacing:.14em;color:#8B8B84">'+(c.name||'duck_math').toUpperCase()+'</p>';
 document.body.appendChild(w);
 if(st.until)setInterval(function(){var e=document.getElementById('dmcd');if(e)e.textContent=left(st.until);},1000);
 show();}
var CFGDATA=null;
function run(c){CFGDATA=c;try{brand(c);}catch(e){}
 var st=state(c,Date.now());
 if(!st.live){block(c,st);return;}
 show();}
function check(){fetch(CFG+'?t='+Date.now(),{cache:'no-store'})
 .then(function(r){return r.ok?r.json():null}).then(function(c){if(c)run(c);else show();})
 .catch(function(){show();});}
check();setInterval(check,60000);
setInterval(function(){if(CFGDATA&&shown){var st=state(CFGDATA,Date.now());if(!st.live)block(CFGDATA,st);}},15000);
var pend=false;
try{new MutationObserver(function(){if(pend||!CFGDATA)return;pend=true;
 requestAnimationFrame(function(){pend=false;try{applyIcon(CFGDATA.icon,(CFGDATA.brand||{}).mark||32);}catch(e){}});})
 .observe(document.documentElement,{childList:true,subtree:true});}catch(e){}
var tries=0,iv=setInterval(function(){tries++;if(CFGDATA){try{brand(CFGDATA);}catch(e){}}if(tries>30)clearInterval(iv);},400);
})();
