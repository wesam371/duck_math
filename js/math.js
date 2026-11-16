/* js/math.js — كسور مضبوطة + محلّل نحوي بأي مجهول + عارض رياضيات مدمج */
(function(){'use strict';
var KH=window.KH=window.KH||{};
function MError(m){this.message=m;this.name='MError';}
MError.prototype=Object.create(Error.prototype);
KH.MError=MError;

function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t;}return a||1;}
KH.gcd=gcd;
KH.lcm=function(a,b){return Math.abs(a*b)/gcd(a,b)};

function Fr(n,d){
  if(d===undefined)d=1;
  if(d===0)throw new MError('القسمة على صفر غير معرّفة.');
  if(!isFinite(n)||!isFinite(d))throw new MError('عدد غير صالح.');
  if(!Number.isInteger(n)||!Number.isInteger(d)){var k=1e6;n=Math.round(n*k);d=Math.round(d*k);}
  if(Math.abs(n)>1e12||Math.abs(d)>1e12)throw new MError('الأعداد كبيرة جدًا على هذا المحرّك.');
  if(d<0){n=-n;d=-d;}
  var g=gcd(n,d);this.n=n/g;this.d=d/g;
}
Fr.prototype.add=function(o){return new Fr(this.n*o.d+o.n*this.d,this.d*o.d)};
Fr.prototype.sub=function(o){return new Fr(this.n*o.d-o.n*this.d,this.d*o.d)};
Fr.prototype.mul=function(o){return new Fr(this.n*o.n,this.d*o.d)};
Fr.prototype.div=function(o){if(o.n===0)throw new MError('لا يمكن القسمة على صفر.');return new Fr(this.n*o.d,this.d*o.n)};
Fr.prototype.neg=function(){return new Fr(-this.n,this.d)};
Fr.prototype.abs=function(){return new Fr(Math.abs(this.n),this.d)};
Fr.prototype.pow=function(k){if(k<0)return new Fr(1).div(this.pow(-k));var r=new Fr(1);for(var i=0;i<k;i++)r=r.mul(this);return r};
Fr.prototype.isInt=function(){return this.d===1};
Fr.prototype.isZero=function(){return this.n===0};
Fr.prototype.val=function(){return this.n/this.d};
Fr.prototype.txt=function(){return this.d===1?String(this.n):this.n+'/'+this.d};
KH.Fr=Fr;
function F(n,d){return new Fr(n,d)}
KH.F=F;
var F0=F(0),F1=F(1);KH.F0=F0;KH.F1=F1;

/* ---------- العارض: HTML خالص، بلا أي مكتبة خارجية ---------- */
var esc=KH.esc;
var R={
  num:function(f){
    if(f.d===1)return '<span class="m-n">'+f.n+'</span>';
    var s=f.n<0?'<span class="m-op" style="padding:0 2px">−</span>':'';
    return s+'<span class="m-fr"><span>'+Math.abs(f.n)+'</span><span>'+f.d+'</span></span>';
  },
  raw:function(v){return '<span class="m-n">'+esc(v)+'</span>'},
  vr:function(n){return '<i class="m-vr">'+esc(n)+'</i>'},
  op:function(s){return '<span class="m-op">'+esc(s)+'</span>'},
  eq:function(s){return '<span class="m-eq">'+esc(s||'=')+'</span>'},
  par:function(inner){return '<span class="m-par">(</span>'+inner+'<span class="m-par">)</span>'},
  abs:function(inner){return '<span class="m-abs">'+inner+'</span>'},
  pow:function(base,exp){return base+'<sup class="m-sup">'+exp+'</sup>'},
  sqrt:function(inner){return '<span class="m-rt"><b>√</b><span>'+inner+'</span></span>'},
  frac:function(a,b){return '<span class="m-fr"><span>'+a+'</span><span>'+b+'</span></span>'},
  fn:function(name,arg){return '<span class="m-fn">'+esc(name)+'</span>'+R.par(arg)},
  txt:function(s){return '<span class="m-txt">'+esc(s)+'</span>'},
  sp:function(){return '<span class="m-spc"></span>'},
  lbl:function(s){return '<span class="m-lbl">'+esc(s)+'</span>'},
  join:function(){return Array.prototype.slice.call(arguments).join('')}
};
KH.R=R;
KH.mathBlock=function(html,cls){return '<div class="math '+(cls||'')+'">'+html+'</div>'};

/* ---------- تطبيع النص ---------- */
var AR='٠١٢٣٤٥٦٧٨٩',FA='۰۱۲۳۴۵۶۷۸۹';
KH.normDigits=function(s){
  return String(s==null?'':s)
    .replace(/[٠-٩۰-۹]/g,function(d){var i=AR.indexOf(d);return String(i>=0?i:FA.indexOf(d))})
    .replace(/٫/g,'.').replace(/٬/g,'').replace(/،/g,',')
    .replace(/[−–—]/g,'-').replace(/[×✕✖]/g,'*').replace(/÷/g,'/')
    .replace(/²/g,'^2').replace(/³/g,'^3')
    .replace(/<=/g,'≤').replace(/>=/g,'≥')
    .replace(/يساوي/g,'=').replace(/\s+/g,' ').trim();
};
var FUNCS={sin:1,cos:1,tan:1,sqrt:1,abs:1};
var LETTER=/[A-Za-z\u0621-\u064A\u0391-\u03C9]/;
KH.isLetter=function(ch){return LETTER.test(ch)};

/* ---------- المحلّل النحوي: أي حرف مجهول ---------- */
function tokenize(s){
  var t=[],i=0;
  while(i<s.length){
    var c=s[i];
    if(c===' '||c==='\t'){i++;continue}
    if(/[0-9.]/.test(c)){var j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;t.push({t:'num',v:s.slice(i,j)});i=j;continue}
    if(c==='√'){t.push({t:'fn',name:'sqrt'});i++;continue}
    if(LETTER.test(c)){
      var k=i;while(k<s.length&&LETTER.test(s[k]))k++;
      var run=s.slice(i,k),low=run.toLowerCase();
      if(FUNCS[low]){t.push({t:'fn',name:low});}
      else{for(var q=0;q<run.length;q++)t.push({t:'var',name:run[q]});}
      i=k;continue;
    }
    if('+-*/^()'.indexOf(c)>=0){t.push({t:c});i++;continue}
    throw new MError('رمز غير مفهوم في التعبير: «'+c+'»');
  }
  var out=[];
  for(var a=0;a<t.length;a++){
    var x=t[a],y=t[a+1];out.push(x);if(!y)continue;
    if(x.t==='fn')continue;
    var ae=(x.t==='num'||x.t==='var'||x.t===')');
    var bs=(y.t==='num'||y.t==='var'||y.t==='('||y.t==='fn');
    if(ae&&bs)out.push({t:'*'});
  }
  return out;
}
KH.parse=function(src){
  var ts=tokenize(src),p=0;
  function peek(){return ts[p]}
  function expr(){var n=term();while(peek()&&(peek().t==='+'||peek().t==='-')){var op=ts[p++].t;n={t:'bin',op:op,l:n,r:term()}}return n}
  function term(){var n=unary();while(peek()&&(peek().t==='*'||peek().t==='/')){var op=ts[p++].t;n={t:'bin',op:op,l:n,r:unary()}}return n}
  function unary(){if(peek()&&peek().t==='-'){p++;return{t:'neg',a:unary()}}if(peek()&&peek().t==='+'){p++;return unary()}return power()}
  function power(){var n=atom();if(peek()&&peek().t==='^'){p++;n={t:'bin',op:'^',l:n,r:unary()}}return n}
  function atom(){
    var tk=ts[p++];
    if(!tk)throw new MError('التعبير ناقص، تحقّق من نهايته.');
    if(tk.t==='num'){var v=Number(tk.v);if(!isFinite(v))throw new MError('عدد غير صالح: '+tk.v);return{t:'num',v:F(v)}}
    if(tk.t==='var')return{t:'var',name:tk.name};
    if(tk.t==='fn'){var arg=power();return{t:'fn',name:tk.name,a:arg}}
    if(tk.t==='('){var n=expr();if(!ts[p]||ts[p].t!==')')throw new MError('هناك قوس لم يُغلق.');p++;return{t:'par',a:n}}
    throw new MError('رمز غير متوقّع في التعبير.');
  }
  if(!ts.length)throw new MError('لا يوجد تعبير رياضي.');
  var root=expr();
  if(p<ts.length)throw new MError('لم أفهم بقية التعبير.');
  return root;
};
KH.varsOf=function(n,set){
  set=set||new Set();
  if(!n)return set;
  if(n.t==='var')set.add(n.name);
  if(n.a)KH.varsOf(n.a,set);
  if(n.l){KH.varsOf(n.l,set);KH.varsOf(n.r,set);}
  return set;
};
function prec(op){return op==='+'||op==='-'?1:op==='*'||op==='/'?2:3}
KH.prec=prec;
function wrap(n,pr,right){
  var need=false;
  if(n.t==='bin')need=prec(n.op)<pr||(right&&prec(n.op)===pr&&(n.op==='-'||n.op==='/'));
  if(n.t==='neg')need=pr>=2;
  var s=KH.astHTML(n);
  return need?R.par(s):s;
}
KH.astHTML=function(n){
  switch(n.t){
    case 'num':return R.num(n.v);
    case 'var':return R.vr(n.name);
    case 'par':return R.par(KH.astHTML(n.a));
    case 'neg':return R.op('−')+wrap(n.a,1,false);
    case 'fn':
      if(n.name==='sqrt')return R.sqrt(KH.astHTML(n.a));
      if(n.name==='abs')return R.abs(KH.astHTML(n.a));
      return R.fn(n.name,KH.astHTML(n.a));
    case 'bin':{
      if(n.op==='/')return R.frac(KH.astHTML(n.l),KH.astHTML(n.r));
      if(n.op==='^')return wrap(n.l,4,false)+'<sup class="m-sup">'+KH.astHTML(n.r)+'</sup>';
      var pr=prec(n.op),sym=n.op==='*'?'×':n.op==='-'?'−':n.op;
      return wrap(n.l,pr,false)+R.op(sym)+wrap(n.r,pr,true);
    }
  }
  return '';
};
KH.cloneAST=function(n){
  if(n.t==='num')return{t:'num',v:F(n.v.n,n.v.d)};
  if(n.t==='var')return{t:'var',name:n.name};
  if(n.t==='par')return{t:'par',a:KH.cloneAST(n.a)};
  if(n.t==='neg')return{t:'neg',a:KH.cloneAST(n.a)};
  if(n.t==='fn')return{t:'fn',name:n.name,a:KH.cloneAST(n.a)};
  return{t:'bin',op:n.op,l:KH.cloneAST(n.l),r:KH.cloneAST(n.r)};
};
KH.unwrapPars=function(n){
  if(n.t==='par')return n.a.t==='num'?n.a:{t:'par',a:KH.unwrapPars(n.a)};
  if(n.t==='neg')return{t:'neg',a:KH.unwrapPars(n.a)};
  if(n.t==='fn')return{t:'fn',name:n.name,a:KH.unwrapPars(n.a)};
  if(n.t==='bin')return{t:'bin',op:n.op,l:KH.unwrapPars(n.l),r:KH.unwrapPars(n.r)};
  return n;
};
/* تقييم عددي (الدوال بالدرجات) */
KH.evalNum=function(n,env){
  env=env||{};
  switch(n.t){
    case 'num':return n.v.val();
    case 'var':
      if(Object.prototype.hasOwnProperty.call(env,n.name))return env[n.name];
      throw new MError('قيمة المجهول «'+n.name+'» غير معروفة.');
    case 'par':return KH.evalNum(n.a,env);
    case 'neg':return -KH.evalNum(n.a,env);
    case 'fn':{
      var a=KH.evalNum(n.a,env);
      if(n.name==='sqrt'){if(a<0)throw new MError('جذر عدد سالب غير معرّف حقيقيًا.');return Math.sqrt(a)}
      if(n.name==='abs')return Math.abs(a);
      var rad=a*Math.PI/180;
      if(n.name==='sin')return Math.sin(rad);
      if(n.name==='cos')return Math.cos(rad);
      if(n.name==='tan'){if(Math.abs(Math.cos(rad))<1e-12)throw new MError('tan غير معرّفة عند هذه الزاوية.');return Math.tan(rad)}
      throw new MError('دالة غير مدعومة.');
    }
    case 'bin':{
      var L=KH.evalNum(n.l,env),Rr=KH.evalNum(n.r,env);
      if(n.op==='+')return L+Rr;
      if(n.op==='-')return L-Rr;
      if(n.op==='*')return L*Rr;
      if(n.op==='/'){if(Rr===0)throw new MError('قسمة على صفر.');return L/Rr}
      return Math.pow(L,Rr);
    }
  }
  throw new MError('تعذّر التقييم.');
};
/* ---------- كثيرات الحدود بمجهول واحد أيًّا كان حرفه ---------- */
function deg(p){var d=p.length-1;while(d>0&&p[d].isZero())d--;return d}
function get(p,i){return p[i]||F0}
KH.deg=deg;KH.get=get;
KH.padd=function(a,b){var r=[];for(var i=0;i<Math.max(a.length,b.length);i++)r.push(get(a,i).add(get(b,i)));return r};
KH.psub=function(a,b){var r=[];for(var i=0;i<Math.max(a.length,b.length);i++)r.push(get(a,i).sub(get(b,i)));return r};
KH.pmul=function(a,b){var r=[];for(var i=0;i<a.length+b.length-1;i++)r.push(F0);
  for(var x=0;x<a.length;x++)for(var y=0;y<b.length;y++)r[x+y]=r[x+y].add(a[x].mul(b[y]));return r};
KH.pscale=function(a,k){return a.map(function(c){return c.mul(k)})};
KH.pval=function(p,x){var r=F0;for(var i=p.length-1;i>=0;i--)r=r.mul(x).add(get(p,i));return r};
KH.toPoly=function(n,vname,maxDeg){
  maxDeg=maxDeg||2;
  switch(n.t){
    case 'num':return[n.v];
    case 'var':
      if(n.name!==vname)throw new MError('ظهر مجهول ثانٍ «'+n.name+'». لحل جملة معادلتين افصل المعادلتين بـ ؛');
      return[F0,F1];
    case 'par':return KH.toPoly(n.a,vname,maxDeg);
    case 'neg':return KH.toPoly(n.a,vname,maxDeg).map(function(c){return c.neg()});
    case 'fn':{
      var inner=KH.toPoly(n.a,vname,maxDeg);
      if(deg(inner)>0)throw new MError('الدوال المثلثية والجذرية على المجهول غير مدعومة في الحدوديات.');
      var v=inner[0].val();
      if(n.name==='abs')return[F(Math.abs(v))];
      if(n.name==='sqrt'){
        if(v<0)throw new MError('جذر عدد سالب.');
        var r=Math.round(Math.sqrt(v));
        if(r*r!==v)throw new MError('الجذر غير نسبي؛ استعمل درس تبسيط الجذور.');
        return[F(r)];
      }
      throw new MError('sin/cos/tan تُحسب في درس النسب المثلثية.');
    }
    case 'bin':{
      var L=KH.toPoly(n.l,vname,maxDeg),Rr=KH.toPoly(n.r,vname,maxDeg);
      if(n.op==='+')return KH.padd(L,Rr);
      if(n.op==='-')return KH.psub(L,Rr);
      if(n.op==='*'){if(deg(L)+deg(Rr)>maxDeg)throw new MError('درجة الحدودية تتجاوز '+maxDeg+'.');return KH.pmul(L,Rr)}
      if(n.op==='/'){if(deg(Rr)>0)throw new MError('القسمة على مقدار فيه مجهول غير مدعومة هنا.');return KH.pscale(L,F1.div(Rr[0]))}
      if(n.op==='^'){
        if(deg(Rr)>0||!Rr[0].isInt())throw new MError('الأس يجب أن يكون عددًا صحيحًا.');
        var k=Rr[0].n;if(k<0||k>4)throw new MError('الأس المدعوم من 0 إلى 4.');
        var acc=[F1];for(var i=0;i<k;i++){acc=KH.pmul(acc,L);if(deg(acc)>maxDeg)throw new MError('الناتج يتجاوز الدرجة '+maxDeg+'.')}
        return acc;
      }
    }
  }
  throw new MError('تعذّر تحليل التعبير.');
};
KH.terms=function(list,vname){
  var out='',first=true;
  for(var i=0;i<list.length;i++){
    var c=list[i].c,d=list[i].deg;
    if(c.isZero())continue;
    var neg=c.n<0,a=c.abs();
    var co=(d>0&&a.n===1&&a.d===1)?'':R.num(a);
    var v=d===0?'':(d===1?R.vr(vname):R.pow(R.vr(vname),d));
    out+=first?((neg?R.op('−'):'')+co+v):(R.op(neg?'−':'+')+co+v);
    first=false;
  }
  return out||R.raw('0');
};
KH.polyHTML=function(p,vname){
  var list=[];for(var i=p.length-1;i>=0;i--)list.push({c:get(p,i),deg:i});
  return KH.terms(list,vname);
};
KH.subHTML=function(p,vname,valHTML){
  var vt=R.par(valHTML),out='',first=true;
  for(var i=p.length-1;i>=0;i--){
    var c=get(p,i);if(c.isZero())continue;
    var neg=c.n<0,a=c.abs();
    var co=(i>0&&a.n===1&&a.d===1)?'':R.num(a);
    var v=i===0?'':(i===1?vt:R.pow(vt,i));
    out+=first?((neg?R.op('−'):'')+co+v):(R.op(neg?'−':'+')+co+v);
    first=false;
  }
  return out||R.raw('0');
};
KH.st=function(title,html,note){return{title:title,html:html,note:note||''}};
KH.simplifyRad=function(n){var k=1,m=n;for(var i=Math.floor(Math.sqrt(n));i>=2;i--){if(m%(i*i)===0){k*=i;m/=i*i}}return{k:k,m:m}};
KH.isPerfectSq=function(n){if(n<0)return null;var r=Math.round(Math.sqrt(n));return r*r===n?r:null};
KH.nums=function(t){var m=t.match(/-?\d+(?:\.\d+)?/g);return m?m.map(Number):[]};
KH.labeled=function(t,keys){
  for(var i=0;i<keys.length;i++){
    var m=t.match(new RegExp(keys[i]+'\\s*(?:=|:)?\\s*(-?\\d+(?:\\.\\d+)?)'));
    if(m)return Number(m[1]);
  }
  return null;
};
KH.longestRun=function(t,cls){
  var m=t.match(cls)||[];
  m.sort(function(a,b){return b.trim().length-a.trim().length});
  return (m[0]||'').trim();
};
})();