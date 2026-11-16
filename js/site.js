/* js/site.js — الإعدادات عن بُعد (بوت تلغرام) + صفحة «عن الموقع» المخفية */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$,esc=KH.esc;
var DEFAULTS={
  name:'duck_math',
  tagline:'رياضيات الثالث الإعدادي — خطوة بخطوة',
  icon:{fill:'#E3270E',bg:'#FBFBF8',eye:'#FBFBF8'},
  about:{description:'duck_math موقع تعليمي عربي مفتوح لرياضيات الصف الثالث الإعدادي وفق المنهاج السوري. يحلّ المسائل بمحرّك رياضي حتمي مكتوب بجافاسكربت، ويعرض كل خطوة مع سببها ثم يتحقّق من الناتج بالتعويض. لا يعتمد على نموذج لغوي في الحساب، لذلك لا يمكن أن يعطي نتيجة رقمية خاطئة. يعمل بالكامل داخل متصفحك: لا خادم، لا حساب، لا تتبّع، ويظل يعمل على الشبكات الضعيفة والأجهزة القديمة.'},
  developers:[{name:'فريق duck_math',role:'التطوير والتصميم'}],
  version:1,updatedAt:null
};
var HEX=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function safeColor(v,fb){return (typeof v==='string'&&HEX.test(v))?v:fb}
function normalize(c){
  c=c||{};
  var out={
    name:(typeof c.name==='string'&&c.name.trim())?c.name.trim().slice(0,40):DEFAULTS.name,
    tagline:typeof c.tagline==='string'?c.tagline.slice(0,120):DEFAULTS.tagline,
    icon:{
      fill:safeColor(c.icon&&c.icon.fill,DEFAULTS.icon.fill),
      bg:safeColor(c.icon&&c.icon.bg,DEFAULTS.icon.bg),
      eye:safeColor(c.icon&&c.icon.eye,DEFAULTS.icon.eye)
    },
    about:{description:(c.about&&typeof c.about.description==='string'&&c.about.description.trim())?c.about.description.trim():DEFAULTS.about.description},
    developers:Array.isArray(c.developers)?c.developers.filter(function(d){return d&&typeof d.name==='string'&&d.name.trim()})
      .slice(0,24).map(function(d){return{name:d.name.trim().slice(0,60),role:(typeof d.role==='string'?d.role.trim().slice(0,60):'')}}):DEFAULTS.developers,
    version:typeof c.version==='number'?c.version:1,
    updatedAt:typeof c.updatedAt==='string'?c.updatedAt:null
  };
  return out;
}
function initials(n){
  var parts=String(n).trim().split(/\s+/);
  var a=parts[0]?parts[0][0]:'';
  var b=parts[1]?parts[1][0]:'';
  return (a+b)||'؟';
}
function apply(cfg,source){
  KH.config=cfg;
  var root=document.documentElement;
  root.style.setProperty('--duck',cfg.icon.fill);
  root.style.setProperty('--duck-bg',cfg.icon.bg);
  root.style.setProperty('--duck-eye',cfg.icon.eye);
  $$('[data-sitename]').forEach(function(e){e.textContent=cfg.name});
  document.title=cfg.name+' — '+cfg.tagline;
  var meta=document.querySelector('meta[name="description"]');
  if(meta)meta.setAttribute('content',cfg.name+': '+cfg.tagline+'. '+cfg.about.description.slice(0,120));
  var fav=$('#favicon');
  if(fav){
    var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+
      '<rect width="64" height="64" fill="'+cfg.icon.bg+'"/>'+
      '<path d="M30 62V32C30 24 36 18 44 18C52 18 58 24 58 32C58 40 52 46 44 46V62Z" fill="'+cfg.icon.fill+'"/>'+
      '<path d="M56 28L64 33L56 38Z" fill="'+cfg.icon.fill+'"/>'+
      '<circle cx="49" cy="29" r="2.5" fill="'+cfg.icon.eye+'"/></svg>';
    fav.setAttribute('href','data:image/svg+xml,'+encodeURIComponent(svg));
  }
  var tm=document.querySelector('meta[name="theme-color"]');
  if(tm)tm.setAttribute('content',cfg.icon.bg);
  var d=$('#aboutDesc');if(d)d.textContent=cfg.about.description;
  var list=$('#devList');
  if(list){
    if(!cfg.developers.length){
      list.innerHTML='<div class="dev-empty">لم تُضف أسماء بعد. تُضاف الأسماء عبر بوت تلغرام بالأمر <span class="mono">/dev add</span>.</div>';
    }else{
      list.innerHTML=cfg.developers.map(function(p){
        return '<div class="dev-item"><span class="dev-av">'+esc(initials(p.name))+'</span>'+
          '<span class="dev-tx"><b>'+esc(p.name)+'</b>'+(p.role?'<span>'+esc(p.role)+'</span>':'')+'</span></div>';
      }).join('');
    }
  }
  var up=$('#cfgUpdated');
  if(up)up.textContent=cfg.updatedAt?String(cfg.updatedAt).slice(0,10):'محلي';
  var vr=$('#cfgVersion');if(vr)vr.textContent='v'+cfg.version;
  var sr=$('#cfgSource');if(sr)sr.textContent=source;
  KH.paintDucks();
}
function route(){
  var isAbout=location.hash==='#about';
  var main=$('#mainView'),about=$('#aboutView');
  if(main)main.hidden=isAbout;
  if(about)about.hidden=!isAbout;
  $$('.nav-links a').forEach(function(a){a.classList.toggle('active',false)});
  if(isAbout){window.scrollTo({top:0,behavior:'auto'});}
  document.body.classList.toggle('about-mode',isAbout);
}
KH.Site={
  init:function(){
    var cached=KH.store.get('config',null);
    apply(normalize(cached||DEFAULTS),cached?'ذاكرة محلية':'افتراضي');
    route();
    window.addEventListener('hashchange',route);
    fetch('config.json?v='+Date.now(),{cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('http');return r.json()})
      .then(function(j){
        var cfg=normalize(j);
        KH.store.set('config',cfg);
        apply(cfg,'config.json');
      })
      .catch(function(){
        apply(normalize(cached||DEFAULTS),cached?'ذاكرة محلية':'افتراضي');
      });
  },
  route:route
};
})();