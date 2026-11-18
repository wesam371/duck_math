/* guard.js — Duck_math_sitting · يطبّق كل تعديلات اللوحة على duck_math */
(function(){
var CFG='config.json',R=document.documentElement,shown=false,tc={},C=null,sig='';
R.style.opacity='0';var safe=setTimeout(show,1600);
function show(){if(shown)return;shown=true;clearTimeout(safe);R.style.opacity='';}
function q(s){return document.querySelector(s)}function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function T(el,t){if(el&&el.textContent!==t)el.textContent=t==null?'':t}
function H(el,t){if(el&&el.innerHTML!==t)el.innerHTML=t==null?'':t}
function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var MARK={"duck":"function(f,b,e){return '<path d=\"M30 62V32C30 24 36 18 44 18C52 18 58 24 58 32C58 40 52 46 44 46V62Z\" fill=\"'+f+'\"/><path d=\"M56 28L64 33L56 38Z\" fill=\"'+f+'\"/><circle cx=\"49\" cy=\"29\" r=\"2.5\" fill=\"'+e+'\"/>'}","gear":"function(f,b){var t='',i;for(i=0;i<8;i++)t+='<rect x=\"28\" y=\"3\" width=\"8\" height=\"13\" transform=\"rotate('+(i*45)+' 32 32)\" fill=\"'+f+'\"/>';\n  return t+'<circle cx=\"32\" cy=\"32\" r=\"20\" fill=\"'+f+'\"/><circle cx=\"32\" cy=\"32\" r=\"8\" fill=\"'+b+'\"/>'}","book":"function(f,b){return '<path d=\"M8 12h20a6 6 0 016 6v34a6 6 0 00-6-6H8z\" fill=\"'+f+'\"/><path d=\"M56 12H36a6 6 0 00-6 6v34a6 6 0 016-6h20z\" fill=\"'+f+'\" opacity=\".62\"/><rect x=\"30\" y=\"16\" width=\"4\" height=\"36\" fill=\"'+b+'\"/>'}","pi":"function(f){return '<rect x=\"8\" y=\"14\" width=\"48\" height=\"8\" fill=\"'+f+'\"/><rect x=\"18\" y=\"22\" width=\"8\" height=\"34\" fill=\"'+f+'\"/><rect x=\"38\" y=\"22\" width=\"8\" height=\"26\" fill=\"'+f+'\"/><path d=\"M38 48h14v8H38z\" fill=\"'+f+'\"/>'}","sigma":"function(f){return '<path d=\"M12 10h40v9H26l14 13-14 13h26v9H12v-8l16-14-16-14z\" fill=\"'+f+'\"/>'}","compass":"function(f,b){return '<circle cx=\"32\" cy=\"32\" r=\"24\" fill=\"none\" stroke=\"'+f+'\" stroke-width=\"5\"/><path d=\"M42 22L28 28l-6 14 14-6z\" fill=\"'+f+'\"/><circle cx=\"32\" cy=\"32\" r=\"3\" fill=\"'+b+'\"/>'}"};
function mkf(k,f,b,e){try{return (new Function('f','b','e','return ('+MARK[k]+')(f,b,e)'))(f,b,e)}catch(x){return ''}}
function bi(k,f,b,e,s,bg){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 64 64">'+(bg?'<rect width="64" height="64" fill="'+b+'"/>':'')+mkf(k||'duck',f,b,e)+'</svg>'}
function tint(d,c,cb){var k=c+'|'+d.length+'|'+d.slice(-32);if(tc[k]){cb(tc[k]);return}var i=new Image();
i.onload=function(){try{var v=document.createElement('canvas');v.width=i.naturalWidth||256;v.height=i.naturalHeight||256;var x=v.getContext('2d');
x.drawImage(i,0,0,v.width,v.height);x.globalCompositeOperation='source-in';x.fillStyle=c;x.fillRect(0,0,v.width,v.height);tc[k]=v.toDataURL('image/png');cb(tc[k])}catch(e){cb(d)}};i.onerror=function(){cb(d)};i.src=d}
function ih(ic,s){if(!ic)return bi('duck','#E3270E','#FBFBF8','#FBFBF8',s,false);
if(ic.kind==='custom'&&ic.custom){var c=ic.custom,p=Math.round(s*(ic.pad||0)/100),n=Math.max(1,s-p*2),r=Math.round(s*(ic.radius||0)/100),
bg=ic.solid?(ic.bg||'#FBFBF8'):'transparent',b;if(c.type==='image/svg+xml')b='<span style="display:block;width:'+n+'px;height:'+n+'px">'+c.svg+'</span>';
else{var k=(ic.tintColor||'#101010')+'|'+c.data.length+'|'+c.data.slice(-32);var src=(ic.tint&&tc[k])||c.data;
b='<img alt="" src="'+src+'" style="display:block;width:'+n+'px;height:'+n+'px;object-fit:'+(ic.fit||'contain')+'">'}
return '<span style="display:inline-grid;place-items:center;width:'+s+'px;height:'+s+'px;background:'+bg+';border-radius:'+r+'px;overflow:hidden;padding:'+p+'px;box-sizing:border-box">'+b+'</span>'}
return bi(ic.kind,ic.fill,ic.bg,ic.eye,s,!!ic.solid)}
function iu(ic){if(ic&&ic.kind==='custom'&&ic.custom){var c=ic.custom;return c.type==='image/svg+xml'?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(c.svg):c.data}
return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(bi(ic&&ic.kind,ic&&ic.fill,ic&&ic.bg,ic&&ic.eye,64,true))}
function icon(ic,s){var sg=JSON.stringify(ic)+s;if(sg===sig)return;sig=sg;
qa('[data-duck],[data-duck-big],.brand-mark,.about-mark').forEach(function(el){
var z=(el.hasAttribute('data-duck-big')||el.classList.contains('about-mark'))?Math.max(s*2,64):s;el.innerHTML=ih(ic,z)});
var u=iu(ic),l=q('link#favicon')||q('link[rel~="icon"]');
if(!l){l=document.createElement('link');l.rel='icon';l.id='favicon';document.head.appendChild(l)}l.href=u;
var a=q('link[rel="apple-touch-icon"]');if(!a){a=document.createElement('link');a.rel='apple-touch-icon';document.head.appendChild(a)}a.href=u;
if(ic&&ic.kind==='custom'&&ic.custom&&ic.custom.type!=='image/svg+xml'&&ic.tint){var k=(ic.tintColor||'#101010')+'|'+ic.custom.data.length+'|'+ic.custom.data.slice(-32);
if(!tc[k])tint(ic.custom.data,ic.tintColor||'#101010',function(){sig='';icon(ic,s)})}}
function brand(c){var b=c.brand||{},s=R.style;T(document.head.querySelector('title'),(c.seo&&c.seo.title)||c.name);
function meta(n,v){if(!v)return;var m=q('meta[name="'+n+'"]');if(!m){m=document.createElement('meta');m.name=n;document.head.appendChild(m)}m.content=v}
meta('description',c.seo&&c.seo.description);meta('keywords',c.seo&&c.seo.keywords);meta('theme-color',c.seo&&c.seo.themeColor);
if(b.accent)s.setProperty('--red',b.accent);if(b.paper)s.setProperty('--paper',b.paper);if(b.ink)s.setProperty('--ink',b.ink);
if(b.rule)s.setProperty('--rule',b.rule+'px solid '+(b.ink||'#101010'));
s.setProperty('--hard',b.shadow===false?'none':'6px 6px 0 '+(b.ink||'#101010'));
if(b.radius)qa('.panel,.btn,.f,.tag,.chip,.specimen,.answer-box').forEach(function(e){e.style.borderRadius=b.radius+'px'});
if(b.fontScale)R.style.fontSize=(16*b.fontScale/100)+'px';
if(c.name)qa('[data-sitename]').forEach(function(e){T(e,c.name)});
T(q('.brand-t small'),c.badge);
qa('.brand-t').forEach(function(e){e.style.display=b.wordmark===false?'none':''});
qa('.brand-t small').forEach(function(e){e.style.display=b.tagline===false?'none':''});
qa('.bg-grid,.bg').forEach(function(e){e.style.display=b.grid===false?'none':''});
icon(c.icon||{},b.mark||32);
var st=q('#dm-css');if(!st){st=document.createElement('style');st.id='dm-css';document.head.appendChild(st)}st.textContent=c.customCSS||'';
var ban=q('#dm-ban');
if(c.banner&&c.banner.on){if(!ban){ban=document.createElement('div');ban.id='dm-ban';document.body.insertBefore(ban,document.body.firstChild)}
var col={info:'#1D3FCC',success:'#0E7A3C',warn:'#B26A00',danger:'#C81E1E'}[c.banner.tone]||'#1D3FCC';
ban.style.cssText='position:relative;z-index:80;background:'+col+';color:#fff;padding:9px 14px;font:600 13px/1.6 "IBM Plex Sans Arabic",Tahoma,sans-serif;text-align:center';
ban.innerHTML=E(c.banner.text)+(c.banner.link?' <a href="'+E(c.banner.link)+'" style="color:#fff;border-bottom:1px solid rgba(255,255,255,.7)">'+E(c.banner.linkLabel||'رابط')+'</a>':'');
var nv=q('.nav');if(nv)nv.style.top=ban.offsetHeight+'px'}else if(ban){ban.remove();var nv2=q('.nav');if(nv2)nv2.style.top=''}}
function content(c){var h=c.hero||{},hc=q('.hero-copy');
if(hc){T(hc.querySelector('.kicker'),h.kicker);
var h1=hc.querySelector('h1');if(h1)H(h1,E(h.line1)+'<br><span class="red">'+E(h.line2)+'</span>');
var ld=hc.querySelector('.lead');if(ld)H(ld,'<b data-sitename>'+E(c.name)+'</b> '+E(h.lead));
var ct=hc.querySelectorAll('.hero-cta a');if(ct[0])T(ct[0],h.cta1);if(ct[1])T(ct[1],h.cta2);
var ch=q('#heroChips');if(ch)ch.style.display=h.showChips===false?'none':'';
var st=hc.querySelectorAll('.hero-stats > div');(h.stats||[]).forEach(function(s,i){var d=st[i];if(!d)return;
d.style.display=s.on===false?'none':'';T(d.querySelector('span'),s.label);if(!s.dyn)T(d.querySelector('b'),s.value)});
for(var i=(h.stats||[]).length;i<st.length;i++)st[i].style.display='none'}
var sp=q('#specimen');if(sp){sp.style.display=(h.spec&&h.spec.on===false)?'none':'';T(q('#demoTag'),h.spec&&h.spec.tag);T(q('.spec-cap'),h.spec&&h.spec.caption)}
var nav=c.nav||{};T(q('.nav-cta'),nav.cta);var nc=q('.nav-cta');if(nc&&nav.ctaHref)nc.setAttribute('href',nav.ctaHref);
var sb=q('#soundBtn');if(sb)sb.style.display=nav.showSound===false?'none':'';
var links=(nav.links||[]).filter(function(l){return l.on!==false});
var nl=q('.nav-links');if(nl)H(nl,links.map(function(l,i){return '<a href="'+E(l.href)+'"><span class="n mono">'+('0'+(i+1)).slice(-2)+'</span>'+E(l.label)+'</a>'}).join(''));
var mn=q('#menu');if(mn){var keep=mn.querySelector('.btn');H(mn,links.map(function(l,i){return '<a href="'+E(l.href)+'"><span class="n mono">'+('0'+(i+1)).slice(-2)+'</span>'+E(l.label)+'</a>'}).join('')+(keep?keep.outerHTML:''))}
var secs=c.sections||[],main=q('#mainView');
secs.forEach(function(s){var el=document.getElementById(s.id);
if(!el&&main&&s.id!=='about'){el=document.createElement('section');el.className='sec';el.id=s.id;
el.innerHTML='<div class="sec-head reveal in"><span class="sec-num mono"></span><div><p class="kicker"></p><h2></h2><p class="sec-p"></p></div></div>';
main.appendChild(el)}
if(!el)return;el.style.display=s.on===false?'none':'';
T(el.querySelector('.sec-num'),s.num);T(el.querySelector('.kicker'),s.kicker);T(el.querySelector('h2'),s.title);T(el.querySelector('.sec-p'),s.desc);
if(main&&el.parentNode===main&&s.id!=='about')main.appendChild(el)});
var sv=c.solver||{},ip=q('#problemInput');if(ip&&sv.placeholder)ip.setAttribute('placeholder',sv.placeholder);
T(q('.input-panel .lbl span'),sv.label);T(q('#solveBtn'),sv.solveBtn);T(q('#clearBtn'),sv.clearBtn);T(q('.input-panel .hint'),sv.hint);
var lb=qa('.input-panel .lbl');if(lb[1])T(lb[1].querySelector('span'),sv.tplLabel);
var ms=qa('.mini-stats span');(sv.statLabels||[]).forEach(function(v,i){T(ms[i],v)});
var cu=c.curriculum||{};
if(window.KH){if(sv.keypad&&sv.keypad.length)window.KH.KEYS=sv.keypad;
if(sv.templates)window.KH.TEMPLATES=sv.templates.map(function(t){return{t:t.t,l:t.l}});
if(cu.units&&cu.units.length)window.KH.UNITS=cu.units.map(function(u){return{u:u.u,n:u.n}});
if(cu.lessons&&cu.lessons.length)window.KH.CURRICULUM=cu.lessons.map(function(l){return{u:l.u,t:l.t,d:l.d,ex:l.ex,topic:l.topic}});
if(cu.lessons&&window.KH.TOPICS)cu.lessons.forEach(function(l){if(l.topic&&!window.KH.TOPICS[l.topic])window.KH.TOPICS[l.topic]=l.topic});
var kp=q('#keypad');if(kp&&sv.keypad)H(kp,sv.keypad.map(function(k){return '<button class="key" data-k="'+E(k)+'">'+E(k)+'</button>'}).join(''));
var tp=q('#tplChips');if(tp&&window.KH.TEMPLATES)H(tp,window.KH.TEMPLATES.map(function(x){return '<button class="chip" data-t="'+E(x.t)+'">'+E(x.l)+'</button>'}).join(''));
var hp=q('#heroChips');if(hp&&window.KH.TEMPLATES)H(hp,window.KH.TEMPLATES.slice(0,6).map(function(x){return '<button class="chip" data-t="'+E(x.t)+'"><span class="mono">'+E(x.t.length>18?x.t.slice(0,18)+'…':x.t)+'</span></button>'}).join(''));
if(window.KH.Curriculum&&window.KH.Curriculum.refresh)try{window.KH.Curriculum.refresh()}catch(e){}
var ai=c.assistant||{};if(ai.chips&&ai.chips.length)window.KH.AI_CHIPS=ai.chips.map(function(x){return x.text});
if(ai.kb&&ai.kb.length&&window.KH.KB)ai.kb.forEach(function(a){var ks=String(a.keys||'').split(',').map(function(x){return x.trim()}).filter(Boolean);
if(!ks.length)return;var hit=null;window.KH.KB.forEach(function(k){if(k.k&&k.k.join(',')===ks.join(','))hit=k});
if(hit)hit.a=a.answer;else window.KH.KB.unshift({k:ks,a:a.answer})});
var ac=q('#aiChips');if(ac&&window.KH.AI_CHIPS)H(ac,window.KH.AI_CHIPS.map(function(x){return '<button class="chip">'+E(x)+'</button>'}).join(''));
if(window.KH.config)window.KH.config.developers=c.developers}
var cs=q('#currSearch');if(cs&&cu.search)cs.setAttribute('placeholder',cu.search);
var ns=q('#nbSearch');if(ns&&c.notebook)ns.setAttribute('placeholder',c.notebook.search||'');
T(q('#aiNote'),c.assistant&&c.assistant.note);
var ci=q('#chatInput');if(ci&&c.assistant)ci.setAttribute('placeholder',c.assistant.placeholder||'');
var fb=q('.chat-log .msg.bot');if(fb&&c.assistant&&c.assistant.welcome&&!fb.dataset.dmW){fb.dataset.dmW='1';
H(fb,'<div>'+E(c.assistant.welcome).replace(/\n/g,'</div><div>')+'</div><div class="msg-src">SIMPLE · جاهز</div>')}
qa('.seg [data-mode]').forEach(function(b){var m=b.dataset.mode;b.style.display=(c.assistant&&c.assistant.modes&&c.assistant.modes[m]===false)?'none':''});
T(q('#aboutDesc'),c.about&&c.about.description);T(q('#about .sec-head h2'),c.about&&c.about.title);
var dl2=q('#devList');if(dl2&&c.developers)H(dl2,c.developers.map(function(d){var p=String(d.name).trim().split(/\s+/);
var ii=((p[0]||'')[0]||'')+((p[1]||'')[0]||'');return '<div class="dev-item"><span class="dev-av">'+E(ii)+'</span><span class="dev-tx"><b>'+E(d.name)+'</b>'+(d.role?'<span>'+E(d.role)+'</span>':'')+'</span></div>'}).join(''));
var f=c.footer||{};T(q('.foot-in .foot-p'),f.note);T(q('.colophon'),f.colophon);
var fl=q('.foot-links');if(fl)H(fl,(f.links||[]).map(function(l){return '<a href="'+E(l.href)+'">'+E(l.label)+'</a>'}).join('')+(f.aboutLink===false?'':'<a href="#about" class="foot-about">'+E((c.about&&c.about.title)||'عن الموقع')+'</a>'));
var kb=qa('.foot-in > div')[2];if(kb){var pp=kb.querySelector('.foot-p');if(pp)pp.style.display=f.shortcuts===false?'none':''}}
function occ(s,f,t){var o=[],a=new Date(s.start),b=new Date(s.end),d=b-a;if(!isFinite(a)||!isFinite(b)||d<=0)return o;
if(s.repeat==='once'){if(+b>f&&+a<t)o.push([+a,+b]);return o}
var x=new Date(f);x.setHours(0,0,0,0);x.setDate(x.getDate()-1);
for(var i=0;i<420;i++){if(+x>t+86400000)break;if(s.repeat==='daily'||(s.days||[]).indexOf(x.getDay())>=0){
var y=new Date(x);y.setHours(a.getHours(),a.getMinutes(),0,0);var z=+y+d;if(z>f&&+y<t)o.push([+y,z])}x.setDate(x.getDate()+1)}return o}
function state(c,n){var p=c.power||{};if(p.mode==='off'){if(p.resumeAt&&n>=p.resumeAt)return{live:true};
return{live:false,until:p.resumeAt,title:p.title,msg:p.message,contact:p.contact}}
var h=null;(c.schedules||[]).forEach(function(s){if(!s.enabled)return;occ(s,n-1,n+1).forEach(function(o){if(o[0]<=n&&o[1]>n)h=o})});
if(h)return{live:false,until:h[1],title:p.title,msg:p.message,contact:p.contact};return{live:true}}
function p2(n){return (n<10?'0':'')+n}
function left(m){if(!m)return'';var s=Math.max(0,Math.floor((m-Date.now())/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),mm=Math.floor(s%3600/60);
return (d?d+' يوم و':'')+p2(h)+':'+p2(mm)+':'+p2(s%60)}
function block(c,st){var b=c.brand||{},ink=b.ink||'#101010',pp=b.paper||'#FBFBF8',ac=b.accent||'#E3270E';
document.body.innerHTML='';document.body.style.cssText='margin:0;background:'+pp+';color:'+ink+';font-family:"IBM Plex Sans Arabic",Tahoma,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center';
var w=document.createElement('div');w.style.cssText='max-width:520px;border:2px solid '+ink+';background:#fff;padding:32px 24px;box-shadow:8px 8px 0 '+ink;
w.innerHTML='<div style="display:grid;place-items:center;margin-bottom:15px">'+ih(c.icon,64)+'</div><h1 style="font-size:25px;margin:0 0 10px">'+E(st.title||'الموقع متوقّف مؤقتًا')+'</h1>'+
'<p style="font-size:15px;line-height:1.9;color:#4C4C48;margin:0 0 15px">'+E(st.msg||'')+'</p>'+
(st.until?'<div id="dmcd" style="display:inline-block;border:2px solid '+ink+';padding:8px 15px;font-family:monospace;font-weight:700">'+left(st.until)+'</div>':'')+
(st.contact?'<div style="margin-top:15px"><a href="'+E(st.contact)+'" style="color:'+ac+';font-weight:700">تواصل معنا</a></div>':'')+
'<p style="margin-top:17px;font-family:monospace;font-size:11px;letter-spacing:.14em;color:#8B8B84">'+E(c.name||'duck_math').toUpperCase()+'</p>';
document.body.appendChild(w);if(st.until)setInterval(function(){var e=document.getElementById('dmcd');if(e)e.textContent=left(st.until)},1000);show()}
function run(c){C=c;try{brand(c)}catch(e){}try{content(c)}catch(e){}
var st=state(c,Date.now());if(!st.live){block(c,st);return}show()}
function check(){fetch(CFG+'?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null})
.then(function(c){if(c)run(c);else show()}).catch(function(){show()})}
function boot(){check();setInterval(check,60000);
setInterval(function(){if(C&&shown){var st=state(C,Date.now());if(!st.live)block(C,st);else{sig='';try{brand(C);content(C)}catch(e){}}}},20000);
var pend=false;try{new MutationObserver(function(){if(pend||!C)return;pend=true;requestAnimationFrame(function(){pend=false;try{icon(C.icon||{},(C.brand||{}).mark||32)}catch(e){}})})
.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
var n=0,iv=setInterval(function(){n++;if(C){try{brand(C);content(C)}catch(e){}}if(n>25)clearInterval(iv)},400)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
