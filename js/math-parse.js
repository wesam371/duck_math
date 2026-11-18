/* js/math-parse.js — تطبيع عربي كامل، محلّل نحوي بأسبقية صحيحة، تقييم مضبوط، حدوديات */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X,E=DM.E,q=DM.q,q0=DM.q0,q1=DM.q1;
var AR='٠١٢٣٤٥٦٧٨٩',FA='۰۱۲۳۴۵۶۷۸۹';
var FN={sin:1,cos:1,tan:1,asin:1,acos:1,atan:1,sqrt:1,cbrt:1,abs:1,ln:1,log:1,lg:1,exp:1,
 floor:1,ceil:1,round:1,gcd:1,lcm:1,min:1,max:1,fact:1,deg:1,rad:1};
var ALIAS={'جا':'sin','جتا':'cos','ظا':'tan','جذر':'sqrt','لو':'log','ln':'ln','π':'pi','باي':'pi','ط':'pi'};
DM.FN=FN;

DM.norm=function(s){
  var t=String(s==null?'':s);
  t=t.replace(/[٠-٩۰-۹]/g,function(d){var i=AR.indexOf(d);return String(i>=0?i:FA.indexOf(d))});
  t=t.replace(/٫/g,'.').replace(/٬/g,'').replace(/،/g,',').replace(/\u0640/g,'');
  t=t.replace(/[−–—]/g,'-').replace(/[×✕✖·]/g,'*').replace(/÷/g,'/');
  t=t.replace(/²/g,'^2').replace(/³/g,'^3').replace(/\*\*/g,'^');
  t=t.replace(/<=/g,'≤').replace(/>=/g,'≥').replace(/!=|<>/g,'≠');
  t=t.replace(/يساوي/g,'=').replace(/\bpi\b/gi,'π');
  Object.keys(ALIAS).forEach(function(k){t=t.split(k).join(ALIAS[k])});
  t=t.replace(/\|([^|]*)\|/g,'abs($1)');
  t=t.replace(/(\d)\s*°/g,'$1');
  return t.replace(/\s+/g,' ').trim();
};
var LET=/[A-Za-z\u0621-\u064A]/;
DM.isLet=function(c){return LET.test(c)};

/* ---------- الترميز ---------- */
function tokenize(s){
  var t=[],i=0,j,run,k;
  while(i<s.length){
    var c=s[i];
    if(c===' '||c==='\t'){i++;continue}
    if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(s[i+1]||''))){
      j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;
      if(s[j]==='('){var close=s.indexOf(')',j);if(close>j){t.push({t:'num',v:s.slice(i,close+1)});i=close+1;continue}}
      t.push({t:'num',v:s.slice(i,j)});i=j;continue}
    if(c==='√'){t.push({t:'fn',v:'sqrt'});i++;continue}
    if(c==='π'){t.push({t:'pi'});i++;continue}
    if(LET.test(c)){
      j=i;while(j<s.length&&LET.test(s[j]))j++;run=s.slice(i,j);
      var low=run.toLowerCase();
      if(FN[low])t.push({t:'fn',v:low});
      else if(low==='pi')t.push({t:'pi'});
      else for(k=i;k<j;k++)t.push({t:'var',v:s[k]});
      i=j;continue}
    if('+-*/^(),'.indexOf(c)>=0){t.push({t:c});i++;continue}
    if(c==='!'){t.push({t:'!'});i++;continue}
    if(c==='%'){t.push({t:'%'});i++;continue}
    throw new E('رمز غير مفهوم: «'+c+'»','token');
  }
  var out=[],a,b;
  for(a=0;a<t.length;a++){
    var x=t[a],y=t[a+1];out.push(x);if(!y)continue;
    if(x.t==='fn'&&y.t!=='(')continue;
    var ends=(x.t==='num'||x.t==='var'||x.t==='pi'||x.t===')'||x.t==='!'||x.t==='%');
    var starts=(y.t==='num'||y.t==='var'||y.t==='pi'||y.t==='('||y.t==='fn');
    if(ends&&starts)out.push({t:'*'});
  }
  return out;
}
/* ---------- المحلّل: تعبير ← جمع ← ضرب ← أحادي ← قوة ← ذرّة ---------- */
DM.parse=function(src){
  var ts=tokenize(String(src)),p=0;
  function pk(){return ts[p]}
  function eat(t){if(!pk()||pk().t!==t)throw new E('توقّعت «'+t+'» في التعبير.','parse');return ts[p++]}
  function expr(){var n=term();while(pk()&&(pk().t==='+'||pk().t==='-')){var o=ts[p++].t;n={t:'bin',op:o,l:n,r:term()}}return n}
  function term(){var n=unary();while(pk()&&(pk().t==='*'||pk().t==='/')){var o=ts[p++].t;n={t:'bin',op:o,l:n,r:unary()}}return n}
  function unary(){if(pk()&&pk().t==='-'){p++;return{t:'neg',a:unary()}}
    if(pk()&&pk().t==='+'){p++;return unary()}return power()}
  function power(){var n=post();if(pk()&&pk().t==='^'){p++;return{t:'bin',op:'^',l:n,r:unary()}}return n}
  function post(){var n=atom();
    while(pk()&&(pk().t==='!'||pk().t==='%')){var o=ts[p++].t;n={t:o==='!'?'fact':'pct',a:n}}
    return n}
  function atom(){
    var k=ts[p++];if(!k)throw new E('التعبير ناقص في نهايته.','parse');
    if(k.t==='num')return{t:'num',v:Q.parse(k.v)};
    if(k.t==='var')return{t:'var',v:k.v};
    if(k.t==='pi')return{t:'pi'};
    if(k.t==='fn'){
      var args=[];
      if(pk()&&pk().t==='('){p++;args.push(expr());
        while(pk()&&pk().t===','){p++;args.push(expr())}
        eat(')')}
      else args.push(power());
      return{t:'fn',v:k.v,a:args};
    }
    if(k.t==='('){var n=expr();eat(')');return{t:'par',a:n}}
    throw new E('رمز غير متوقّع في التعبير.','parse');
  }
  if(!ts.length)throw new E('لا يوجد تعبير رياضي.','parse');
  var root=expr();
  if(p<ts.length)throw new E('لم أفهم بقية التعبير بدءًا من الرمز '+(p+1)+'.','parse');
  return root;
};
DM.vars=function(n,out){out=out||[];if(!n)return out;
  if(n.t==='var'&&out.indexOf(n.v)<0)out.push(n.v);
  if(n.a){if(Array.isArray(n.a))n.a.forEach(function(x){DM.vars(x,out)});else DM.vars(n.a,out)}
  if(n.l){DM.vars(n.l,out);DM.vars(n.r,out)}return out};
DM.clone=function(n){
  if(n.t==='num')return{t:'num',v:new Q(n.v.n,n.v.d)};
  if(n.t==='var')return{t:'var',v:n.v};
  if(n.t==='pi')return{t:'pi'};
  if(n.t==='par'||n.t==='neg'||n.t==='pct'||n.t==='fact')return{t:n.t,a:DM.clone(n.a)};
  if(n.t==='fn')return{t:'fn',v:n.v,a:n.a.map(DM.clone)};
  return{t:'bin',op:n.op,l:DM.clone(n.l),r:DM.clone(n.r)};
};
DM.subst=function(n,name,val){
  if(n.t==='var')return n.v===name?{t:'num',v:val instanceof Q?val:Q.parse(val)}:n;
  if(n.t==='num'||n.t==='pi')return n;
  if(n.t==='fn')return{t:'fn',v:n.v,a:n.a.map(function(x){return DM.subst(x,name,val)})};
  if(n.a)return{t:n.t,a:DM.subst(n.a,name,val)};
  return{t:'bin',op:n.op,l:DM.subst(n.l,name,val),r:DM.subst(n.r,name,val)};
};
/* ---------- التقييم المضبوط ---------- */
DM.eval=function(n,env){
  env=env||{};
  switch(n.t){
    case 'num':return X.q(n.v);
    case 'pi':return X.pi();
    case 'var':
      if(Object.prototype.hasOwnProperty.call(env,n.v))return X.from(env[n.v]);
      throw new E('قيمة المجهول «'+n.v+'» غير معروفة.','env');
    case 'par':return DM.eval(n.a,env);
    case 'neg':return DM.eval(n.a,env).neg();
    case 'pct':return DM.eval(n.a,env).div(X.q(q(100n)));
    case 'fact':{var f=DM.eval(n.a,env).asQ();
      if(!f||!f.int())throw new E('المضروب يحتاج عددًا صحيحًا.','domain');
      return X.q(new Q(DM.num.fact(Number(f.n))));}
    case 'fn':return applyFn(n.v,n.a.map(function(x){return DM.eval(x,env)}));
    case 'bin':{
      var A=DM.eval(n.l,env),B=DM.eval(n.r,env);
      if(n.op==='+')return A.add(B);
      if(n.op==='-')return A.sub(B);
      if(n.op==='*')return A.mul(B);
      if(n.op==='/')return A.div(B);
      if(n.op==='^'){var bq=B.asQ();
        if(bq&&bq.int()&&Math.abs(Number(bq.n))<=64)return A.pow(Number(bq.n));
        return X.n(Math.pow(A.val(),B.val()));}
    }
  }
  throw new E('تعذّر تقييم التعبير.','eval');
};
function applyFn(name,a){
  var x=a[0],v=x.val(),i;
  switch(name){
    case 'sqrt':{var s=x.sqrt();if(!s)throw new E('جذر عدد سالب غير حقيقي.','domain');return s}
    case 'cbrt':return X.n(Math.cbrt(v));
    case 'abs':return x.abs();
    case 'sin':return DM.trig.val('sin',v);
    case 'cos':return DM.trig.val('cos',v);
    case 'tan':return DM.trig.val('tan',v);
    case 'asin':if(v<-1||v>1)throw new E('asin مجالها [−1,1].','domain');return X.n(Math.asin(v)*180/Math.PI);
    case 'acos':if(v<-1||v>1)throw new E('acos مجالها [−1,1].','domain');return X.n(Math.acos(v)*180/Math.PI);
    case 'atan':return X.n(Math.atan(v)*180/Math.PI);
    case 'ln':if(v<=0)throw new E('لوغاريتم عدد غير موجب غير معرّف.','domain');return X.n(Math.log(v));
    case 'log':case 'lg':{var base=a[1]?a[1].val():10;
      if(v<=0||base<=0||base===1)throw new E('شروط اللوغاريتم غير محقّقة.','domain');
      return X.n(Math.log(v)/Math.log(base));}
    case 'exp':return X.n(Math.exp(v));
    case 'floor':return X.q(q(BigInt(Math.floor(v))));
    case 'ceil':return X.q(q(BigInt(Math.ceil(v))));
    case 'round':return X.q(q(BigInt(Math.round(v))));
    case 'gcd':{var g=0n;for(i=0;i<a.length;i++){var t=a[i].asQ();if(!t||!t.int())throw new E('gcd يحتاج أعدادًا صحيحة.');g=DM.bgcd(g,t.n)}return X.q(new Q(g))}
    case 'lcm':{var l=1n;for(i=0;i<a.length;i++){var t2=a[i].asQ();if(!t2||!t2.int())throw new E('lcm يحتاج أعدادًا صحيحة.');l=DM.blcm(l,t2.n)}return X.q(new Q(l))}
    case 'min':return X.n(Math.min.apply(null,a.map(function(z){return z.val()})));
    case 'max':return X.n(Math.max.apply(null,a.map(function(z){return z.val()})));
    case 'fact':{var f=x.asQ();if(!f||!f.int())throw new E('المضروب يحتاج عددًا صحيحًا.');return X.q(new Q(DM.num.fact(Number(f.n))))}
    case 'deg':return X.n(v*180/Math.PI);
    case 'rad':return X.n(v*Math.PI/180);
  }
  throw new E('دالة غير مدعومة: '+name,'fn');
}
/* ---------- كثيرات الحدود بمعاملات نسبية مضبوطة ---------- */
var P={};
P.zero=function(){return[q0]};
P.trim=function(p){var r=p.slice();while(r.length>1&&r[r.length-1].zero())r.pop();return r};
P.deg=function(p){return P.trim(p).length-1};
P.get=function(p,i){return p[i]||q0};
P.add=function(a,b){var r=[],i;for(i=0;i<Math.max(a.length,b.length);i++)r.push(P.get(a,i).add(P.get(b,i)));return P.trim(r)};
P.sub=function(a,b){var r=[],i;for(i=0;i<Math.max(a.length,b.length);i++)r.push(P.get(a,i).sub(P.get(b,i)));return P.trim(r)};
P.mul=function(a,b){var r=[],i,j;for(i=0;i<a.length+b.length-1;i++)r.push(q0);
  for(i=0;i<a.length;i++)for(j=0;j<b.length;j++)r[i+j]=r[i+j].add(a[i].mul(b[j]));return P.trim(r)};
P.scale=function(a,c){return P.trim(a.map(function(x){return x.mul(c)}))};
P.neg=function(a){return a.map(function(x){return x.neg()})};
P.val=function(p,x){var r=q0,i;for(i=p.length-1;i>=0;i--)r=r.mul(x).add(P.get(p,i));return r};
P.valX=function(p,x){var r=X.q(q0),i;for(i=p.length-1;i>=0;i--)r=r.mul(x).add(X.q(P.get(p,i)));return r};
/* قسمة مطوّلة: خارج + باقٍ */
P.div=function(a,b){
  a=P.trim(a);b=P.trim(b);
  if(b.length===1&&b[0].zero())throw new E('القسمة على حدودية صفرية.','div0');
  var q=[],r=a.slice(),i;
  for(i=0;i<Math.max(0,a.length-b.length+1);i++)q.push(q0);
  while(P.deg(r)>=P.deg(b)&&!(r.length===1&&r[0].zero())){
    var d=P.deg(r)-P.deg(b),c=r[r.length-1].div(b[b.length-1]);
    q[d]=c;
    var sub=[],k;for(k=0;k<d;k++)sub.push(q0);
    for(k=0;k<b.length;k++)sub.push(b[k].mul(c));
    r=P.sub(r,sub);
    if(r.length===1&&r[0].zero())break;
  }
  return{q:P.trim(q),r:P.trim(r)};
};
P.toPoly=function(n,vn,maxDeg){
  maxDeg=maxDeg||6;
  switch(n.t){
    case 'num':return[n.v];
    case 'pi':throw new E('π لا يدخل في الحدوديات الجبرية هنا.','poly');
    case 'var':if(n.v!==vn)throw new E('ظهر مجهول ثانٍ «'+n.v+'». افصل معادلتَي الجملة بـ ؛','multi');return[q0,q1];
    case 'par':return P.toPoly(n.a,vn,maxDeg);
    case 'neg':return P.neg(P.toPoly(n.a,vn,maxDeg));
    case 'pct':return P.scale(P.toPoly(n.a,vn,maxDeg),q(1n,100n));
    case 'fn':{var inner=P.toPoly(n.a,vn,maxDeg);
      if(P.deg(inner)>0)throw new E('الدوال على المجهول ليست حدودية.','poly');
      var v=applyFn(n.v,[X.q(inner[0])]).asQ();
      if(!v)throw new E('قيمة الدالة غير نسبية؛ استعمل الحلّ العددي.','poly');
      return[v];}
    case 'fact':throw new E('المضروب لا يدخل في الحدوديات.','poly');
    case 'bin':{
      var A=P.toPoly(n.l,vn,maxDeg),B=P.toPoly(n.r,vn,maxDeg);
      if(n.op==='+')return P.add(A,B);
      if(n.op==='-')return P.sub(A,B);
      if(n.op==='*'){if(P.deg(A)+P.deg(B)>maxDeg)throw new E('درجة الحدودية تتجاوز '+maxDeg+'.','deg');return P.mul(A,B)}
      if(n.op==='/'){if(P.deg(B)>0)throw new E('القسمة على مقدار فيه مجهول ليست حدودية.','poly');
        return P.scale(A,q1.div(B[0]))}
      if(n.op==='^'){var e=B[0];if(P.deg(B)>0||!e.int())throw new E('الأس يجب أن يكون عددًا صحيحًا.','poly');
        var k=Number(e.n);if(k<0||k>maxDeg)throw new E('الأس المدعوم من 0 إلى '+maxDeg+'.','deg');
        var acc=[q1],i;for(i=0;i<k;i++){acc=P.mul(acc,A);if(P.deg(acc)>maxDeg)throw new E('الناتج يتجاوز الدرجة '+maxDeg+'.','deg')}
        return acc}
    }
  }
  throw new E('تعذّر تحويل التعبير إلى حدودية.','poly');
};
/* شكل خطّي عام: Σ coef·var + const */
P.form=function(n){
  switch(n.t){
    case 'num':return{c:n.v,v:{}};
    case 'pi':throw new E('π غير مدعوم في الجملة الخطية.','poly');
    case 'var':{var o={};o[n.v]=q1;return{c:q0,v:o}}
    case 'par':return P.form(n.a);
    case 'neg':return P.fscale(P.form(n.a),q(-1n));
    case 'pct':return P.fscale(P.form(n.a),q(1n,100n));
    case 'fn':{var f=P.form(n.a);if(Object.keys(f.v).length)throw new E('دالة على مجهول في جملة خطية.','poly');
      return{c:applyFn(n.v,[X.q(f.c)]).asQ()||q0,v:{}}}
    case 'fact':throw new E('المضروب غير مدعوم هنا.','poly');
    case 'bin':{
      var A=P.form(n.l),B=P.form(n.r);
      if(n.op==='+')return P.fadd(A,B);
      if(n.op==='-')return P.fadd(A,P.fscale(B,q(-1n)));
      if(n.op==='*'){
        if(!Object.keys(A.v).length)return P.fscale(B,A.c);
        if(!Object.keys(B.v).length)return P.fscale(A,B.c);
        throw new E('جداء مجهولين يجعل المعادلة غير خطية.','nonlinear')}
      if(n.op==='/'){if(Object.keys(B.v).length)throw new E('القسمة على مجهول غير خطية.','nonlinear');
        return P.fscale(A,q1.div(B.c))}
      if(n.op==='^'){var e=B.c;if(Object.keys(B.v).length||!e.int())throw new E('أس غير صحيح.','poly');
        var k=Number(e.n);
        if(!Object.keys(A.v).length)return{c:A.c.pow(k),v:{}};
        if(k===1)return A;if(k===0)return{c:q1,v:{}};
        throw new E('أس المجهول يجب أن يكون 1 في الجملة الخطية.','nonlinear')}
    }
  }
  throw new E('تعذّر تحليل الشكل الخطّي.','poly');
};
P.fadd=function(A,B){var v={},k;for(k in A.v)v[k]=A.v[k];
  for(k in B.v){v[k]=(v[k]||q0).add(B.v[k]);if(v[k].zero())delete v[k]}
  return{c:A.c.add(B.c),v:v}};
P.fscale=function(A,s){var v={},k;for(k in A.v)v[k]=A.v[k].mul(s);return{c:A.c.mul(s),v:v}};
DM.P=P;
/* ---------- استخراج العلاقات والجمل ---------- */
DM.relation=function(text){
  var t=DM.norm(text);
  var m=t.match(/(≤|≥|≠|≈|=|<|>)/);
  if(!m)return null;
  var i=t.indexOf(m[1]);
  return{op:m[1],left:t.slice(0,i).trim(),right:t.slice(i+m[1].length).trim(),raw:t};
};
DM.parts=function(text){
  return String(text).split(/[;؛\n]+/).map(function(s){return s.trim()}).filter(Boolean);
};
DM.toMath=function(s){return String(s).replace(/\s+/g,'')};
})();