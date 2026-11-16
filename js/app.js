/* js/app.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$;
function safe(name,fn){
  try{fn()}catch(e){if(window.console)console.error('[duck_math] '+name,e)}
}
function paintSound(){
  var b=$('#soundBtn');if(!b)return;
  b.classList.toggle('off',!KH.Sound.on);
  b.setAttribute('aria-pressed',String(!KH.Sound.on));
  b.title=KH.Sound.on?'كتم الصوت':'تشغيل الصوت';
  b.innerHTML=KH.Sound.on
    ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7"/></svg>'
    :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
}
function forceReveal(){
  $$('.reveal').forEach(function(el){el.classList.add('in')});
  $$('.sec-head').forEach(function(el){el.classList.add('in')});
}
function initReveal(){
  if(!window.IntersectionObserver){forceReveal();return}
  var io=new IntersectionObserver(function(en){
    en.forEach(function(x){
      if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}
    });
  },{threshold:.06,rootMargin:'0px 0px -20px'});
  $$('.reveal').forEach(function(el){io.observe(el)});
  setTimeout(forceReveal,1600);
}
function initNav(){
  var nav=$('#nav'),menu=$('#navMenu'),toggle=$('#navToggle');
  function onScroll(){nav.classList.toggle('stuck',window.scrollY>10)}
  onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
  toggle.onclick=function(){
    var o=menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(o));KH.Sound.play('tap');
  };
  menu.addEventListener('click',function(e){
    if(e.target.closest('a')){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}
  });
  var links=$$('.nav-links a'),mlinks=$$('#navMenu a[href^="#"]');
  var ids=['home','solve','lab','curriculum','notebook','assistant'];
  if(window.IntersectionObserver){
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(!x.isIntersecting)return;
        var id=x.target.id;
        links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id)});
        mlinks.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id)});
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    ids.forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)});
  }
  $('#soundBtn').onclick=function(){
    KH.Sound.on=!KH.Sound.on;KH.store.set('sound',KH.Sound.on);
    paintSound();if(KH.Sound.on)KH.Sound.play('toggle');
    KH.toast(KH.Sound.on?'الصوت مفعّل':'تم كتم الصوت');
  };
  paintSound();
}
function initParallax(){
  var layers=$$('[data-par]'),ticking=false;
  window.addEventListener('scroll',function(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){
      var y=window.scrollY;
      layers.forEach(function(l){
        var f=parseFloat(l.dataset.par)||0;
        l.style.setProperty('--sy',(y*f)+'px');
        if(l.id==='specimen')l.style.transform='translateY('+(y*f)+'px)';
      });
      ticking=false;
    });
  },{passive:true});
}
function initHeroDemo(){
  var demos=['3س + 7 = 22','2س + 3ص = 12 ؛ س - ص = 1','sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5'];
  var sols=[];
  demos.forEach(function(d){try{sols.push(KH.solveProblem(d))}catch(e){}});
  if(!sols.length)return;
  var i=0,body=$('#heroDemo');
  function paint(){
    var s=sols[i];
    $('#demoTag').textContent=s.topicLabel;
    body.innerHTML='<div class="math start" style="margin-bottom:8px">'+s.problemHTML+'</div>'+
      s.steps.slice(0,3).map(function(st,k){
        return '<div class="demo-step"><b>'+String(k+1).padStart(2,'0')+'</b><div>'+
          '<div class="math">'+st.html+'</div><small>'+KH.esc(st.title)+'</small></div></div>'}).join('')+
      '<div class="demo-ans"><small>VERIFIED</small><div class="math">'+s.answerHTML+'</div></div>';
  }
  paint();
  function next(){
    body.classList.add('fade');
    setTimeout(function(){i=(i+1)%sols.length;paint();body.classList.remove('fade')},380);
  }
  var timer=setInterval(next,5200);
  var card=$('#specimen');
  card.addEventListener('pointerenter',function(){clearInterval(timer)});
  card.addEventListener('pointerleave',function(){clearInterval(timer);timer=setInterval(next,5200)});
}
function initKeys(){
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      KH.Notebook.close();
      $('#navMenu').classList.remove('open');
      $('#navToggle').setAttribute('aria-expanded','false');
    }
    if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){
      e.preventDefault();
      if(location.hash==='#about')location.hash='#solve';
      document.getElementById('solve').scrollIntoView({behavior:'smooth'});
      setTimeout(function(){$('#problemInput').focus()},420);
    }
  });
}
function initSW(){
  if('serviceWorker' in navigator&&
    (location.protocol==='https:'||['localhost','127.0.0.1'].indexOf(location.hostname)>=0)){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }
}
function init(){
  KH.paintDucks();
  safe('site',function(){KH.Site.init()});
  safe('solver',function(){KH.SolverUI.init()});
  safe('curriculum',function(){KH.Curriculum.init()});
  safe('lab',function(){KH.Lab.init()});
  safe('notebook',function(){KH.Notebook.init()});
  safe('assistant',function(){KH.Assistant.init()});
  safe('nav',initNav);
  safe('reveal',initReveal);
  safe('parallax',initParallax);
  safe('demo',initHeroDemo);
  safe('keys',initKeys);
  safe('sw',initSW);
  var yr=$('#year');if(yr)yr.textContent=new Date().getFullYear();
  var ht=$('#heroTopics');if(ht)ht.textContent=Object.keys(KH.TOPICS).length;
  safe('seed-solve',function(){KH.SolverUI.solveText('3س + 7 = 22',{quiet:true})});
  KH.updateStats();
  document.addEventListener('pointerdown',function(){KH.Sound.init()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();