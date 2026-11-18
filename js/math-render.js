/* js/math-render.js — عارض رياضيات HTML مضبوط: كسور، جذور، π، قوى، مجموعات، فترات */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
DM.esc=esc;
var M={};
M.n=function(v){return '<span class="m-n">'+esc(v)+'</span>'};
M.v=function(n){return '<i class="m-v">'+esc(n)+'</i>'};
M.op=function(s){return '<span class="m-op">'+esc(s)+'</span>'};
M.eq=function(s){return '<span class="m-eq">'+esc(s||'=')+'</span>'};
M.par=function(h){return '<span class="m-p">(</span>'+h+'<span class="m-p">)</span>'};
M.brk=function(h,l,r){return '<span class="m-p">'+(l||'[')+'</span>'+h+'<span class="m-p">'+(r||']')+'</span>'};
M.abs=function(h){return '<span class="m-abs">'+h+'</span>'};
M.sup=function(b,e){return b+'<sup class="m-sup">'+e+'</sup>'};
M.frac=function(a,b){return '<span class="m-fr"><span>'+a+'</span><span>'+b+'</span></span>'};
M.root=function(h,idx){return '<span class="m-rt">'+(idx?'<sup class="m-ri">'+idx+'</sup>':'')+'<b>√</b><span>'+h+'</span></span>'};
M.fn=function(n,a){return '<span class="m-fn">'+esc(n)+'</span>'+M.par(a)};
M.txt=function(s){return '<span class="m-tx">'+esc(s)+'</span>'};
M.sp=function(){return '<span class="m-sp"></span>'};
M.lbl=function(s){return '<span class="m-lb">'+esc(s)+'</span>'};
M.pi='<span class="m-pi">π</span>';
M.inf='<span class="m-n">∞</span>';
M.empty='<span class="m-n">∅</span>';
M.all='<span class="m-n">ℝ</span>';
/* كسر */
M.q=function(c){
  if(c.d===1n)return M.n(c.n.toString());
  return (c.n<0n?M.op('−'):'')+M.frac(M.n((-c.n<0n?-c.n:c.n).toString()),M.n(c.d.toString()));
};
/* مجموع جذري */
M.r=function(r){
  if(!r||!r.t.length)return M.n('0');
  var out='',first=true;
  r.t.forEach(function(t){
    var neg=t.c.sign()<0,a=t.c.abs();
    var co=(t.k!==1n&&a.one())?'':M.q(a);
    var rad=t.k===1n?'':M.root(M.n(t.k.toString()));
    var body=co+rad;
    if(!body)body=M.n('1');
    out+=first?((neg?M.op('−'):'')+body):(M.op(neg?'−':'+')+body);
    first=false;
  });
  return out;
};
/* قيمة مضبوطة = r + pπ */
M.x=function(x){
  if(x.approx)return M.op('≈')+M.n(DM.num.fmt(x.num,6));
  var hasR=!x.r.zero(),hasP=!x.p.zero();
  if(!hasR&&!hasP)return M.n('0');
  var out=hasR?M.r(x.r):'';
  if(hasP){
    var p=x.p;
    var negOnly=p.t.length===1&&p.t[0].c.sign()<0;
    if(hasR)out+=M.op(negOnly?'−':'+');
    else if(negOnly)out+=M.op('−');
    var pp=negOnly?new R([{c:p.t[0].c.abs(),k:p.t[0].k}]):p;
    var single=pp.t.length===1&&pp.t[0].c.one()&&pp.t[0].k===1n;
    out+=(single?'':M.r(pp))+M.pi;
  }
  return out;
};
M.xa=function(x){ /* القيمة المضبوطة + التقريب إن كان مفيدًا */
  var h=M.x(x);
  if(!x.approx&&(!x.r.rational()||!x.p.zero())){
    var v=x.val();
    if(Math.abs(v-Math.round(v))>1e-9)h+=M.sp()+M.op('≈')+M.n(DM.num.fmt(v,4));
  }
  return h;
};
/* شجرة التعبير */
function prec(o){return o==='+'||o==='-'?1:o==='*'||o==='/'?2:3}
function wrap(n,pr,right){
  var need=false;
  if(n.t==='bin')need=prec(n.op)<pr||(right&&prec(n.op)===pr&&(n.op==='-'||n.op==='/'));
  if(n.t==='neg')need=pr>=2;
  var h=M.ast(n);return need?M.par(h):h;
}
M.ast=function(n){
  if(!n)return '';
  switch(n.t){
    case 'num':return M.q(n.v);
    case 'pi':return M.pi;
    case 'var':return M.v(n.v);
    case 'par':return M.par(M.ast(n.a));
    case 'neg':return M.op('−')+wrap(n.a,1,false);
    case 'pct':return wrap(n.a,3,false)+M.n('%');
    case 'fact':return wrap(n.a,4,false)+M.n('!');
    case 'fn':
      if(n.v==='sqrt')return M.root(M.ast(n.a[0]));
      if(n.v==='cbrt')return M.root(M.ast(n.a[0]),'3');
      if(n.v==='abs')return M.abs(M.ast(n.a[0]));
      if(n.v==='log'&&n.a[1])return '<span class="m-fn">log</span><sub class="m-sup">'+M.ast(n.a[1])+'</sub>'+M.par(M.ast(n.a[0]));
      return M.fn(n.v,n.a.map(M.ast).join(M.op(',')));
    case 'bin':
      if(n.op==='/')return M.frac(M.ast(n.l),M.ast(n.r));
      if(n.op==='^')return wrap(n.l,4,false)+'<sup class="m-sup">'+M.ast(n.r)+'</sup>';
      var pr=prec(n.op),sym=n.op==='*'?'×':n.op==='-'?'−':n.op;
      return wrap(n.l,pr,false)+M.op(sym)+wrap(n.r,pr,true);
  }
  return '';
};
/* حدودية */
M.terms=function(list,vn){
  var out='',first=true;
  list.forEach(function(it){
    var c=it.c,d=it.d;if(c.zero())return;
    var neg=c.sign()<0,a=c.abs();
    var co=(d>0&&a.one())?'':M.q(a);
    var v=d===0?'':(d===1?M.v(vn):M.sup(M.v(vn),M.n(String(d))));
    var body=co+v;if(!body)body=M.n('1');
    out+=first?((neg?M.op('−'):'')+body):(M.op(neg?'−':'+')+body);
    first=false;
  });
  return out||M.n('0');
};
M.poly=function(p,vn){var l=[],i;for(i=p.length-1;i>=0;i--)l.push({c:DM.P.get(p,i),d:i});return M.terms(l,vn)};
M.sub=function(p,vn,valHTML){
  var vt=M.par(valHTML),out='',first=true,i;
  for(i=p.length-1;i>=0;i--){var c=DM.P.get(p,i);if(c.zero())continue;
    var neg=c.sign()<0,a=c.abs();
    var co=(i>0&&a.one())?'':M.q(a);
    var v=i===0?'':(i===1?vt:M.sup(vt,M.n(String(i))));
    out+=first?((neg?M.op('−'):'')+co+v):(M.op(neg?'−':'+')+co+v);first=false}
  return out||M.n('0');
};
M.set=function(items){if(!items.length)return M.empty;
  return '<span class="m-p">{</span>'+items.join(M.op(','))+'<span class="m-p">}</span>'};
M.interval=function(a,b,ca,cb){
  return '<span class="m-p">'+(ca?']':'[')+'</span>'+a+M.op(',')+b+'<span class="m-p">'+(cb?')':']')+'</span>'};
M.union=function(parts){return parts.join(M.sp()+M.txt('∪')+M.sp())};
M.block=function(h,cls){return '<div class="math '+(cls||'')+'">'+h+'</div>'};
M.row=function(){return Array.prototype.slice.call(arguments).join('')};
/* خطوة غنية: عنوان + رياضيات + سبب + قاعدة */
M.step=function(title,html,why,rule){return{title:title,html:html,why:why||'',rule:rule||''}};
DM.M=M;
DM.render={
  text:function(x){
    if(x.approx)return DM.num.fmt(x.num,6);
    var s='';
    function rtxt(r){var o='',f=true;
      r.t.forEach(function(t){var neg=t.c.sign()<0,a=t.c.abs();
        var co=(t.k!==1n&&a.one())?'':a.txt();
        var rad=t.k===1n?'':'√'+t.k.toString();
        o+=f?((neg?'-':'')+co+rad):((neg?' - ':' + ')+co+rad);f=false});
      return o||'0'}
    if(!x.r.zero())s+=rtxt(x.r);
    if(!x.p.zero()){var one=x.p.t.length===1&&x.p.t[0].c.one()&&x.p.t[0].k===1n;
      s+=(s?(x.p.t[0].c.sign()<0?' - ':' + '):(x.p.t[0].c.sign()<0?'-':''))+(one?'':rtxt(x.p.abs?x.p:x.p))+'π'}
    return s||'0';
  },
  plain:function(html){var d=document.createElement('div');d.innerHTML=html;return (d.textContent||'').replace(/\s+/g,' ').trim()}
};
})();