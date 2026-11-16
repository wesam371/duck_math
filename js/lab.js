/* js/lab.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$,clamp=KH.clamp,R=KH.R;
var COLORS={red:'#E3270E',blue:'#1D3FCC',green:'#0E7A3C',ink:'#101010',amber:'#B26A00',magenta:'#C0157A'};
var lab={a:1,b:2,c:0,type:'affine',zoom:44,tZoom:44,thick:3,speed:1,color:'red',
  grid:true,axes:true,points:true,fill:false,animate:true,
  panX:0,panY:0,tPanX:0,tPanY:0,t:0,mouse:null,running:false,raf:0};
var canvas,ctx,W=0,H=0,dpr=1;
function fnOf(p){
  var a=p.a,b=p.b,c=p.c;
  switch(p.type){
    case 'linear':return function(x){return a*x};
    case 'affine':return function(x){return a*x+b};
    case 'quad':return function(x){return a*x*x+b*x+c};
    case 'recip':return function(x){return Math.abs(x-b)<1e-6?NaN:a/(x-b)+c};
    case 'abs':return function(x){return a*Math.abs(x-b)+c};
    case 'exp':return function(x){return a*Math.pow(2,b*x)+c};
    case 'sine':return function(x){return a*Math.sin((b*x+c)*Math.PI/180)};
  }
  return function(x){return x};
}
function eqHTML(){
  var A=Math.round(lab.a*10)/10,B=Math.round(lab.b*10)/10,C=Math.round(lab.c*10)/10;
  function sgn(v){return R.op(v>=0?'+':'−')+R.raw(Math.abs(Math.round(v*10)/10))}
  var y=R.raw('y')+R.eq();
  switch(lab.type){
    case 'linear':return y+R.raw(A)+R.vr('س');
    case 'affine':return y+R.raw(A)+R.vr('س')+sgn(B);
    case 'quad':return y+R.raw(A)+R.pow(R.vr('س'),2)+sgn(B)+R.vr('س')+sgn(C);
    case 'recip':return y+R.frac(R.raw(A),R.vr('س')+R.op(B>=0?'−':'+')+R.raw(Math.abs(B)))+sgn(C);
    case 'abs':return y+R.raw(A)+R.abs(R.vr('س')+R.op(B>=0?'−':'+')+R.raw(Math.abs(B)))+sgn(C);
    case 'exp':return y+R.raw(A)+R.op('×')+R.pow(R.raw(2),R.raw(B)+R.vr('س'))+sgn(C);
    case 'sine':return y+R.raw(A)+R.fn('sin',R.raw(B)+R.vr('س')+sgn(C)+R.raw('°'));
  }
  return y;
}
function info(){
  var f=fnOf(lab),out=[];
  var y0=f(0);out.push(['الترتيب إلى الأصل',isFinite(y0)?y0.toFixed(2):'—']);
  if(lab.type==='quad'&&Math.abs(lab.a)>1e-9){
    var vx=-lab.b/(2*lab.a),D=lab.b*lab.b-4*lab.a*lab.c;
    out.push(['الرأس','('+vx.toFixed(2)+', '+f(vx).toFixed(2)+')']);
    out.push(['المميّز',D.toFixed(2)]);
    out.push(['الجذور',D<0?'لا يوجد':(((-lab.b+Math.sqrt(D))/(2*lab.a)).toFixed(2)+' , '+((-lab.b-Math.sqrt(D))/(2*lab.a)).toFixed(2))]);
  }else if((lab.type==='linear'||lab.type==='affine')&&Math.abs(lab.a)>1e-9){
    out.push(['الميل',lab.a.toFixed(2)]);
    out.push(['الجذر',((lab.type==='linear'?0:-lab.b)/lab.a).toFixed(2)]);
  }else if(lab.type==='sine'){
    out.push(['السعة',Math.abs(lab.a).toFixed(2)]);
    out.push(['الدور',Math.abs(lab.b)>1e-9?(360/Math.abs(lab.b)).toFixed(2)+'°':'∞']);
  }else if(lab.type==='recip'){
    out.push(['مقارب شاقولي','س = '+lab.b.toFixed(2)]);
    out.push(['مقارب أفقي','ص = '+lab.c.toFixed(2)]);
  }else if(lab.type==='abs'){
    out.push(['الرأس','('+lab.b.toFixed(2)+', '+lab.c.toFixed(2)+')']);
  }else if(lab.type==='exp'){
    out.push(['مقارب أفقي','ص = '+lab.c.toFixed(2)]);
  }
  $('#labInfo').innerHTML=out.slice(0,6).map(function(r){
    return '<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
  $('#labEq').innerHTML=eqHTML();
}
function resize(){
  var r=canvas.getBoundingClientRect();
  dpr=Math.min(2,window.devicePixelRatio||1);
  W=Math.max(1,Math.round(r.width));H=Math.max(1,Math.round(r.height));
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function sx(x){return W/2+(x-lab.panX)*lab.zoom}
function sy(y){return H/2-(y-lab.panY)*lab.zoom}
function wx(p){return (p-W/2)/lab.zoom+lab.panX}
function wy(p){return (H/2-p)/lab.zoom+lab.panY}
function niceStep(){
  var t=70/lab.zoom,p=Math.pow(10,Math.floor(Math.log10(t)));
  var c=[1,2,5,10].filter(function(k){return k*p>=t})[0]||10;
  return c*p;
}
function trace(f){
  ctx.beginPath();var prev=null,started=false;
  for(var px=0;px<=W;px+=1.5){
    var y=f(wx(px));
    if(!isFinite(y)){started=false;prev=null;continue}
    var py=sy(y);
    if(prev!==null&&Math.abs(py-prev)>H*2.2)started=false;
    if(!started){ctx.moveTo(px,clamp(py,-4000,H+4000));started=true}
    else ctx.lineTo(px,clamp(py,-4000,H+4000));
    prev=py;
  }
}
function sq(x,y,s){ctx.fillRect(x-s/2,y-s/2,s,s)}
function draw(){
  if(!ctx)return;
  var curve=COLORS[lab.color],accent=lab.color==='red'?COLORS.blue:COLORS.red;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
  var st=niceStep(),x,y,p;
  if(lab.grid){
    ctx.lineWidth=1;ctx.strokeStyle='rgba(29,63,204,.13)';ctx.beginPath();
    for(x=Math.ceil(wx(0)/st)*st;x<=wx(W);x+=st){p=Math.round(sx(x))+.5;ctx.moveTo(p,0);ctx.lineTo(p,H)}
    for(y=Math.ceil(wy(H)/st)*st;y<=wy(0);y+=st){p=Math.round(sy(y))+.5;ctx.moveTo(0,p);ctx.lineTo(W,p)}
    ctx.stroke();
  }
  if(lab.axes){
    ctx.strokeStyle='#101010';ctx.lineWidth=1.6;ctx.beginPath();
    ctx.moveTo(0,Math.round(sy(0))+.5);ctx.lineTo(W,Math.round(sy(0))+.5);
    ctx.moveTo(Math.round(sx(0))+.5,0);ctx.lineTo(Math.round(sx(0))+.5,H);ctx.stroke();
    ctx.fillStyle='#4C4C48';ctx.font='500 10.5px "IBM Plex Mono",monospace';
    ctx.textAlign='center';ctx.textBaseline='top';
    var y0=clamp(sy(0),0,H-16);
    for(x=Math.ceil(wx(0)/st)*st;x<=wx(W);x+=st){
      if(Math.abs(x)<1e-9)continue;
      ctx.fillText(String(Math.round(x*1000)/1000),sx(x),y0+5);
    }
    ctx.textAlign='right';ctx.textBaseline='middle';
    var x0=clamp(sx(0),34,W-4);
    for(y=Math.ceil(wy(H)/st)*st;y<=wy(0);y+=st){
      if(Math.abs(y)<1e-9)continue;
      ctx.fillText(String(Math.round(y*1000)/1000),x0-6,sy(y));
    }
  }
  var f=fnOf(lab);
  if(lab.fill){
    ctx.save();ctx.fillStyle=curve+'1F';ctx.beginPath();var started=false;
    for(var px=0;px<=W;px+=2){
      var yy=f(wx(px));if(!isFinite(yy))continue;
      var py=clamp(sy(yy),-2000,H+2000);
      if(!started){ctx.moveTo(px,sy(0));started=true}
      ctx.lineTo(px,py);
    }
    if(started){ctx.lineTo(W,sy(0));ctx.closePath();ctx.fill()}
    ctx.restore();
  }
  ctx.strokeStyle=curve;ctx.lineWidth=lab.thick;ctx.lineJoin='round';ctx.lineCap='butt';
  trace(f);ctx.stroke();
  if(lab.points){
    var pts=[],yi=f(0);
    if(isFinite(yi))pts.push([0,yi]);
    if(lab.type==='quad'&&Math.abs(lab.a)>1e-9){
      var D=lab.b*lab.b-4*lab.a*lab.c;
      if(D>=0){pts.push([(-lab.b+Math.sqrt(D))/(2*lab.a),0]);pts.push([(-lab.b-Math.sqrt(D))/(2*lab.a),0])}
      var vx=-lab.b/(2*lab.a);pts.push([vx,f(vx)]);
    }
    if((lab.type==='linear'||lab.type==='affine')&&Math.abs(lab.a)>1e-9)
      pts.push([(lab.type==='linear'?0:-lab.b)/lab.a,0]);
    if(lab.type==='abs')pts.push([lab.b,lab.c]);
    ctx.font='500 10px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
    pts.forEach(function(pt){
      var X=sx(pt[0]),Y=sy(pt[1]);
      if(X<-20||X>W+20||Y<-20||Y>H+20)return;
      ctx.fillStyle=accent;sq(X,Y,8);
      ctx.fillStyle='#101010';
      ctx.fillText('('+pt[0].toFixed(1)+', '+pt[1].toFixed(1)+')',X,Y-8);
    });
  }
  if(lab.animate&&lab.speed>0){
    var ax=wx(0)+((lab.t*lab.speed*.35)%1)*(wx(W)-wx(0)),ay=f(ax);
    if(isFinite(ay)){
      var AX=sx(ax),AY=sy(ay);
      ctx.save();ctx.strokeStyle=accent+'88';ctx.setLineDash([3,4]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(AX,sy(0));ctx.lineTo(AX,AY);ctx.stroke();ctx.restore();
      ctx.fillStyle=accent;sq(AX,AY,10);
      ctx.fillStyle='#101010';ctx.font='600 10.5px "IBM Plex Mono",monospace';
      ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText('('+ax.toFixed(2)+', '+ay.toFixed(2)+')',AX,AY-10);
    }
  }
  if(lab.mouse){
    var mx=wx(lab.mouse.x),my=f(mx);
    ctx.save();ctx.strokeStyle='#8B8B84';ctx.setLineDash([4,4]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(lab.mouse.x,0);ctx.lineTo(lab.mouse.x,H);ctx.stroke();ctx.restore();
    if(isFinite(my)){ctx.fillStyle='#101010';sq(lab.mouse.x,sy(my),6)}
    $('#hudCoord').textContent='x: '+mx.toFixed(2)+' · y: '+(isFinite(my)?my.toFixed(2):'—');
  }
  $('#hudZoom').textContent=Math.round(lab.zoom)+' px/unit';
}
function loop(){
  if(!lab.running)return;
  lab.raf=requestAnimationFrame(loop);
  lab.panX+=(lab.tPanX-lab.panX)*.18;
  lab.panY+=(lab.tPanY-lab.panY)*.18;
  lab.zoom+=(lab.tZoom-lab.zoom)*.2;
  if(lab.animate)lab.t+=1/60;
  draw();
}
function start(){if(!lab.running){lab.running=true;lab.raf=requestAnimationFrame(loop)}}
function stop(){lab.running=false;cancelAnimationFrame(lab.raf)}
function syncUI(){
  function set(id,v,fmt){
    var el=$('#'+id);if(el)el.value=v;
    var o=$('#'+id+'-v');if(o)o.textContent=fmt?fmt(v):(+v).toFixed(1);
  }
  set('pa',lab.a);set('pb',lab.b);set('pc',lab.c);
  set('zoom',Math.round(lab.tZoom),function(v){return String(Math.round(v))});
  set('thick',lab.thick);set('speed',lab.speed);
  $('#fnType').value=lab.type;$('#curveColor').value=lab.color;
  $$('.tg').forEach(function(t){t.classList.toggle('on',lab[t.dataset.tg])});
  info();
}
KH.Lab={
  init:function(){
    canvas=$('#plot');if(!canvas)return;
    ctx=canvas.getContext('2d');
    resize();info();
    if(window.ResizeObserver)new ResizeObserver(function(){resize();draw()}).observe(canvas);
    else window.addEventListener('resize',function(){resize();draw()});
    function bind(id,key,fmt){
      var el=$('#'+id);if(!el)return;
      el.addEventListener('input',function(){
        var v=parseFloat(el.value);
        if(key==='zoom')lab.tZoom=v;else lab[key]=v;
        $('#'+id+'-v').textContent=fmt?fmt(v):v.toFixed(1);
        info();if(!lab.running)draw();
      });
    }
    bind('pa','a');bind('pb','b');bind('pc','c');
    bind('zoom','zoom',function(v){return String(Math.round(v))});
    bind('thick','thick');bind('speed','speed');
    $('#fnType').onchange=function(e){lab.type=e.target.value;info();KH.Sound.play('tap');if(!lab.running)draw()};
    $('#curveColor').onchange=function(e){lab.color=e.target.value;KH.Sound.play('tap');if(!lab.running)draw()};
    $$('.tg').forEach(function(t){
      t.onclick=function(){
        var k=t.dataset.tg;lab[k]=!lab[k];t.classList.toggle('on',lab[k]);
        KH.Sound.play('toggle');if(!lab.running)draw();
      };
    });
    $('#labReset').onclick=function(){
      lab.a=1;lab.b=2;lab.c=0;lab.type='affine';lab.tZoom=44;lab.tPanX=0;lab.tPanY=0;
      lab.thick=3;lab.speed=1;lab.color='red';
      lab.grid=true;lab.axes=true;lab.points=true;lab.fill=false;lab.animate=true;
      syncUI();KH.Sound.play('tap');KH.toast('أُعيد ضبط المختبر');if(!lab.running)draw();
    };
    $('#labRandom').onclick=function(){
      function r(){return Math.round((Math.random()*6-3)*10)/10}
      lab.a=r()||1;lab.b=r();lab.c=r();
      lab.type=KH.pick(['linear','affine','quad','recip','abs','exp','sine']);
      lab.color=KH.pick(Object.keys(COLORS));
      syncUI();KH.Sound.play('save');if(!lab.running)draw();
    };
    $('#labExport').onclick=function(){
      draw();
      var a=document.createElement('a');
      a.href=canvas.toDataURL('image/png');a.download='duck_math-graph.png';a.click();
      KH.toast('تم تصدير الصورة',{kind:'ok'});KH.Sound.play('save');
    };
    var drag=null,pinch=null;
    canvas.addEventListener('pointerdown',function(e){
      try{canvas.setPointerCapture(e.pointerId)}catch(x){}
      drag={x:e.clientX,y:e.clientY,px:lab.tPanX,py:lab.tPanY};
      canvas.style.cursor='grabbing';
    });
    canvas.addEventListener('pointermove',function(e){
      var r=canvas.getBoundingClientRect();
      lab.mouse={x:e.clientX-r.left,y:e.clientY-r.top};
      if(drag){
        lab.tPanX=drag.px-(e.clientX-drag.x)/lab.zoom;
        lab.tPanY=drag.py+(e.clientY-drag.y)/lab.zoom;
      }
      if(!lab.running)draw();
    });
    function end(){drag=null;canvas.style.cursor='crosshair'}
    canvas.addEventListener('pointerup',end);
    canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('pointerleave',function(){lab.mouse=null;end();if(!lab.running)draw()});
    canvas.addEventListener('wheel',function(e){
      e.preventDefault();
      lab.tZoom=clamp(lab.tZoom*(e.deltaY<0?1.12:.89),12,140);
      $('#zoom').value=Math.round(lab.tZoom);
      $('#zoom-v').textContent=Math.round(lab.tZoom);
      if(!lab.running)draw();
    },{passive:false});
    canvas.addEventListener('touchstart',function(e){
      if(e.touches.length===2){
        pinch={d:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),z:lab.tZoom};
        drag=null;
      }
    },{passive:true});
    canvas.addEventListener('touchmove',function(e){
      if(pinch&&e.touches.length===2){
        e.preventDefault();
        var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        lab.tZoom=clamp(pinch.z*d/pinch.d,12,140);
        $('#zoom').value=Math.round(lab.tZoom);
        $('#zoom-v').textContent=Math.round(lab.tZoom);
      }
    },{passive:false});
    canvas.addEventListener('touchend',function(){pinch=null});
    if(window.IntersectionObserver){
      new IntersectionObserver(function(en){
        en.forEach(function(x){if(x.isIntersecting&&!document.hidden)start();else stop()});
      },{threshold:.05}).observe(canvas);
    }else start();
    document.addEventListener('visibilitychange',function(){
      if(document.hidden)stop();
      else if(canvas.getBoundingClientRect().top<innerHeight)start();
    });
    draw();
  }
};
})();