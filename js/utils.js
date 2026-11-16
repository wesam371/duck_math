/* js/utils.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
KH.$=function(s,r){return (r||document).querySelector(s)};
KH.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
KH.clamp=function(v,a,b){return Math.min(b,Math.max(a,v))};
KH.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
KH.ri=function(a,b){return Math.floor(Math.random()*(b-a+1))+a};
KH.pick=function(a){return a[KH.ri(0,a.length-1)]};
KH.store={
  get:function(k,d){try{var v=localStorage.getItem('duckmath.'+k);return v?JSON.parse(v):d}catch(e){return d}},
  set:function(k,v){try{localStorage.setItem('duckmath.'+k,JSON.stringify(v))}catch(e){}}
};
KH.state={
  stats:KH.store.get('stats',{solved:0,correct:0,streak:0,best:0,byTopic:{}}),
  current:null,revealed:0,playing:null,practice:null,
  selection:new Set(),nbView:'all',nb:{q:'',filter:'all',sort:'manual'},
  views:KH.store.get('views',[]),unit:KH.store.get('unit',1)
};
KH.saveStats=function(){KH.store.set('stats',KH.state.stats);KH.updateStats()};
KH.updateStats=function(){
  var s=KH.state.stats;
  ['#statSolved','#heroSolved'].forEach(function(k){var e=KH.$(k);if(e)e.textContent=s.solved});
  ['#statStreak','#heroStreak'].forEach(function(k){var e=KH.$(k);if(e)e.textContent=s.streak});
  var n=KH.$('#statSaved');if(n&&KH.notebook)n.textContent=KH.notebook.length;
};
KH.fmtDate=function(ts){
  var d=(Date.now()-ts)/86400000;
  if(d<1)return 'اليوم';if(d<2)return 'أمس';if(d<7)return 'قبل '+Math.floor(d)+' أيام';
  try{return new Date(ts).toLocaleDateString('ar-SY',{day:'numeric',month:'short'})}catch(e){return new Date(ts).toLocaleDateString()}
};
/* صوت خفيف مرتبط بأحداث مرئية فقط */
KH.Sound={
  on:KH.store.get('sound',true),ctx:null,
  init:function(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
    if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  play:function(type,i){
    if(!this.on)return;this.init();if(!this.ctx)return;
    i=i||0;var c=this.ctx,t=c.currentTime;
    function mk(f,st,dur,vol,wave){
      var o=c.createOscillator(),g=c.createGain();
      o.type=wave||'sine';o.frequency.setValueAtTime(f,st);
      g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+.012);
      g.gain.exponentialRampToValueAtTime(.0001,st+dur);
      o.connect(g);g.connect(c.destination);o.start(st);o.stop(st+dur+.03);
    }
    if(type==='tap')mk(520,t,.07,.045,'triangle');
    else if(type==='step')mk(430+i*54,t,.15,.05,'triangle');
    else if(type==='ok')[523,659,784,1046].forEach(function(f,k){mk(f,t+k*.07,.26,.05)});
    else if(type==='no'){mk(190,t,.2,.055,'sawtooth');mk(150,t+.09,.22,.04,'sawtooth');}
    else if(type==='save'){mk(660,t,.09,.045);mk(880,t+.07,.14,.04);}
    else if(type==='toggle')mk(700,t,.06,.035,'square');
  }
};
KH.toast=function(msg,opt){
  opt=opt||{};
  var host=KH.$('#toasts');if(!host)return function(){};
  var el=document.createElement('div');el.className='toast '+(opt.kind||'');
  el.innerHTML='<i class="dot"></i><span>'+KH.esc(msg)+'</span>';
  var tm;
  function close(){clearTimeout(tm);el.classList.add('out');setTimeout(function(){el.remove()},260);}
  if(opt.action){var b=document.createElement('button');b.textContent=opt.action;
    b.onclick=function(){if(opt.onAction)opt.onAction();close()};el.appendChild(b);}
  host.appendChild(el);tm=setTimeout(close,opt.ms||4200);
  return close;
};
var fxRaf=0,parts=[];
KH.confetti=function(){
  var c=KH.$('#fx');if(!c)return;
  var g=c.getContext('2d'),d=Math.min(2,window.devicePixelRatio||1);
  c.width=innerWidth*d;c.height=innerHeight*d;g.setTransform(d,0,0,d,0,0);
  var cols=['#E3270E','#101010','#1D3FCC','#0E7A3C','#B26A00','#C0157A'];
  var host=KH.$('#stepsPanel');
  var box=host?host.getBoundingClientRect():{left:innerWidth/2,width:0,top:120,height:200};
  var ox=box.left+box.width/2,oy=box.top+Math.min(box.height*.35,220);
  for(var i=0;i<64;i++)parts.push({x:ox,y:oy,vx:(Math.random()-.5)*9,vy:-Math.random()*11-3,
    s:Math.random()*7+3,c:KH.pick(cols),r:Math.random()*6,vr:(Math.random()-.5)*.3,life:1});
  if(fxRaf)return;
  function tick(){
    g.clearRect(0,0,innerWidth,innerHeight);
    parts.forEach(function(p){p.vy+=.36;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life-=.012;
      g.save();g.globalAlpha=Math.max(0,p.life);g.translate(p.x,p.y);g.rotate(p.r);
      g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/2,p.s,p.s);g.restore();});
    parts=parts.filter(function(p){return p.life>0&&p.y<innerHeight+40});
    if(parts.length)fxRaf=requestAnimationFrame(tick);
    else{fxRaf=0;g.clearRect(0,0,innerWidth,innerHeight);}
  }
  fxRaf=requestAnimationFrame(tick);
};
/* شعار البطة: رأس ورقبة فقط، تنظر يمينًا */
KH.duckSVG=function(withBg){
  return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">'+
    (withBg?'<rect class="duck-bg" width="64" height="64"/>':'')+
    '<path class="duck-fill" d="M30 62V32C30 24 36 18 44 18C52 18 58 24 58 32C58 40 52 46 44 46V62Z"/>'+
    '<path class="duck-fill" d="M56 28L64 33L56 38Z"/>'+
    '<circle class="duck-eye" cx="49" cy="29" r="2.5"/></svg>';
};
KH.paintDucks=function(){
  KH.$$('[data-duck]').forEach(function(e){e.innerHTML=KH.duckSVG(false)});
  KH.$$('[data-duck-big]').forEach(function(e){e.innerHTML=KH.duckSVG(true)});
};
})();