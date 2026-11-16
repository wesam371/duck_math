/* js/solvers.js — محرّك المسائل: منهاج الثالث الإعدادي السوري، بأي مجهول
   إصلاح: استخراج التعبيرات لا يبتلع الكلام العربي، كل معادلة تُحلّ فعليًا،
   الحدود الثابتة (الجمع والطرح) لم تعد تُفقد في جمل المعادلات،
   وكل عملية جمع/طرح/ضرب/قسمة تظهر خطوةً مستقلة بأرقامها. */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var F=KH.F,F0=KH.F0,F1=KH.F1,R=KH.R,MError=KH.MError;
var parse=KH.parse,toPoly=KH.toPoly,deg=KH.deg,get=KH.get,polyHTML=KH.polyHTML,
    subHTML=KH.subHTML,astHTML=KH.astHTML,st=KH.st,terms=KH.terms,
    nums=KH.nums,labeled=KH.labeled,normDigits=KH.normDigits;

/* ==================================================================
   1) ماسح التعبيرات: يفصل الرياضيات عن الكلام العربي
   ================================================================== */
var FUNCS={sin:1,cos:1,tan:1,sqrt:1,abs:1};
var AR=/[\u0621-\u064A\u0671-\u06D3]/;
var LAT=/[A-Za-z]/;
var DIG=/[0-9]/;
var OPS='+-*/^()';
var REL='=<>≤≥';
var CONNECT={'و':1,'ف':1,'أو':1,'ثم':1,'لا':1,'يا':1,'إن':1,'اذ':1};

function scan(t){
  var toks=[],i=0,j,run;
  while(i<t.length){
    var c=t[i];
    if(/\s/.test(c)){toks.push({k:'sp',s:i,e:i+1});i++;continue}
    if(DIG.test(c)){
      j=i;while(j<t.length&&/[0-9.]/.test(t[j]))j++;
      toks.push({k:'num',s:i,e:j,v:t.slice(i,j)});i=j;continue;
    }
    if(LAT.test(c)){
      j=i;while(j<t.length&&LAT.test(t[j]))j++;
      run=t.slice(i,j);
      if(FUNCS[run.toLowerCase()]){toks.push({k:'fn',s:i,e:j,v:run.toLowerCase()})}
      else{for(var q=i;q<j;q++)toks.push({k:'var',s:q,e:q+1,v:t[q]})}
      i=j;continue;
    }
    if(c==='√'){toks.push({k:'fn',s:i,e:i+1,v:'sqrt'});i++;continue}
    if(AR.test(c)){
      j=i;while(j<t.length&&AR.test(t[j]))j++;
      run=t.slice(i,j);
      if(run.length===1&&!CONNECT[run])toks.push({k:'var',s:i,e:j,v:run});
      else toks.push({k:'word',s:i,e:j,v:run});
      i=j;continue;
    }
    if(REL.indexOf(c)>=0){toks.push({k:'rel',s:i,e:i+1,v:c});i++;continue}
    if(OPS.indexOf(c)>=0){toks.push({k:'op',s:i,e:i+1,v:c});i++;continue}
    if(c===';'||c==='؛'||c===','||c==='\n'){toks.push({k:'sep',s:i,e:i+1,v:c});i++;continue}
    if(c==='%'||c==='٪'){toks.push({k:'pct',s:i,e:i+1,v:c});i++;continue}
    toks.push({k:'word',s:i,e:i+1,v:c});i++;
  }
  return toks;
}
function mathRuns(t){
  var toks=scan(t),out=[],cur=null;
  for(var i=0;i<toks.length;i++){
    var tk=toks[i];
    if(tk.k==='word'||tk.k==='sep'||tk.k==='pct'){if(cur){out.push(cur);cur=null}continue}
    if(tk.k==='sp'){if(cur)cur.e=tk.e;continue}
    if(!cur)cur={s:tk.s,e:tk.e,toks:[]};
    cur.e=tk.e;cur.toks.push(tk);
  }
  if(cur)out.push(cur);
  return out.map(function(r){
    var text=t.slice(r.s,r.e).trim();
    var relTok=null,vars=[],ops=0,fns=0;
    r.toks.forEach(function(x){
      if(x.k==='rel'&&!relTok)relTok=x;
      if(x.k==='var'&&vars.indexOf(x.v)<0)vars.push(x.v);
      if(x.k==='op')ops++;
      if(x.k==='fn')fns++;
    });
    return{text:text,toks:r.toks,rel:relTok,vars:vars,ops:ops,fns:fns,
      score:r.toks.filter(function(x){return x.k!=='sp'}).length};
  }).filter(function(r){return r.text.length>0});
}
function bestRun(list,filter){
  var f=list.filter(filter);
  f.sort(function(a,b){return b.score-a.score});
  return f[0]||null;
}
function toMath(s){return String(s).replace(/\s+/g,'')}
function splitRelation(run){
  var idx=-1;
  for(var i=0;i<run.toks.length;i++){if(run.toks[i].k==='rel'){idx=run.toks[i];break}}
  if(!idx)throw new MError('لا توجد علامة مقارنة في التعبير.');
  var pos=run.text.indexOf(idx.v);
  var left=run.text.slice(0,pos).trim(),right=run.text.slice(pos+idx.v.length).trim();
  var more=right.match(/[=<>≤≥]/);
  if(more)throw new MError('اكتب علامة مقارنة واحدة فقط في كل معادلة.');
  if(!left||!right)throw new MError('الطرفان مطلوبان: اكتب مثل 3س + 7 = 22');
  return{op:idx.v,left:left,right:right};
}

/* ==================================================================
   2) أدوات عرض العمليات
   ================================================================== */
function mk(o){
  o.id='s'+Date.now()+Math.random().toString(36).slice(2,6);
  o.steps=o.steps||[];o.check=o.check||null;o.unit=o.unit||'';o.created=Date.now();
  o.answerHTML=o.answerHTML||R.txt(o.answerText||'');
  return o;
}
function coefTerm(c,vn){
  var a=c.abs();
  return (a.n===1&&a.d===1?'':R.num(a))+R.vr(vn);
}
/* العملية التي تُلغي حدًّا: نطرح الموجب ونضيف السالب */
function cancelOp(c){
  var neg=c.n<0;
  return{sym:neg?'+':'−',val:c.abs(),verb:neg?'نضيف':'نطرح',prep:neg?'إلى':'من',
    html:R.op(neg?'+':'−')+R.num(c.abs())};
}
function cancelOpTerm(c,vn){
  var neg=c.n<0;
  return{sym:neg?'+':'−',val:c.abs(),verb:neg?'نضيف':'نطرح',prep:neg?'إلى':'من',
    html:R.op(neg?'+':'−')+coefTerm(c,vn)};
}
function arithNote(a,sym,b,res){
  return R.num(a)+R.op(sym)+R.num(b)+R.eq()+R.num(res);
}
/* عرض التوزيع لعدد في قوس، إن كان الشكل بسيطًا وواضحًا */
function productsHTML(n){
  if(!n)return null;
  if(n.t==='par')return productsHTML(n.a);
  if(n.t==='bin'&&n.op==='*'){
    var k=null,other=null;
    if(n.l.t==='num'){k=n.l;other=n.r}
    else if(n.r.t==='num'){k=n.r;other=n.l}
    if(!k)return null;
    if(other.t==='par')other=other.a;
    if(other.t==='bin'&&(other.op==='+'||other.op==='-')){
      return R.num(k.v)+R.op('×')+astHTML(other.l)+
        R.op(other.op==='+'?'+':'−')+R.num(k.v)+R.op('×')+astHTML(other.r);
    }
  }
  return null;
}

/* ==================================================================
   3) معادلة الدرجة الأولى — كل عملية جمع وطرح ظاهرة بأرقامها
   ================================================================== */
function solveEquation(t){
  var run=bestRun(mathRuns(t),function(r){return r.rel&&r.rel.v==='='});
  if(!run)throw new MError('اكتب معادلة بعلامة = واحدة، مثل: 3س + 7 = 22');
  var parts=splitRelation(run);
  var la=parse(toMath(parts.left)),ra=parse(toMath(parts.right));
  var vs=run.vars;
  if(!vs.length)throw new MError('لا يوجد مجهول في المعادلة. اكتب مثل: 3س + 7 = 22');
  if(vs.length>1)throw new MError('ظهر أكثر من مجهول ('+vs.join('، ')+'). لحل جملة معادلتين افصل بينهما بـ ؛');
  var vn=vs[0];
  var L=toPoly(la,vn),Rr=toPoly(ra,vn),P=KH.psub(L,Rr);
  if(deg(P)===2)return solveQuadratic(t,L,Rr,P,la,ra,vn);

  var l1=get(L,1),l0=get(L,0),r1=get(Rr,1),r0=get(Rr,0);
  var steps=[st('نكتب المعادلة',astHTML(la)+R.eq()+astHTML(ra),
    'المعادلة ميزان: كل عملية نجريها على طرف نجريها على الطرف الآخر أيضًا.')];

  var hasPar=/\(/.test(run.text);
  if(hasPar){
    var pl=productsHTML(la),pr=productsHTML(ra);
    if(pl||pr){
      steps.push(st('نوزّع العدد على حدود القوس',
        (pl||astHTML(la))+R.eq()+(pr||astHTML(ra)),
        'نضرب العدد خارج القوس في كل حدّ داخله: أ(ب + ج) = أ×ب + أ×ج.'));
    }
    steps.push(st('نفكّ الأقواس ونرتّب الحدود',polyHTML(L,vn)+R.eq()+polyHTML(Rr,vn),
      'نجمع الحدود المتشابهة في كل طرف على حدة.'));
  }

  var curL=L.slice(),curR=Rr.slice();

  /* --- عملية الجمع/الطرح على الحد الثابت --- */
  if(!l0.isZero()){
    var o=cancelOp(l0);
    steps.push(st(o.verb+' '+o.val.txt()+' '+o.prep+' الطرفين',
      polyHTML(curL,vn)+o.html+R.eq()+polyHTML(curR,vn)+o.html,
      'نُلغي العدد '+l0.txt()+' من الطرف الأيسر، ونجري العملية نفسها على الطرف الأيمن حفاظًا على التساوي.'));
    var newR0=r0.sub(l0);
    curL=[F0,l1];curR=[newR0,r1];
    steps.push(st('نبسّط الطرفين',polyHTML(curL,vn)+R.eq()+polyHTML(curR,vn)),
      '');
    steps[steps.length-1].note='في الأيسر: '+l0.txt()+' '+o.sym+' '+o.val.txt()+' = 0. وفي الأيمن: '+
      r0.txt()+' '+o.sym+' '+o.val.txt()+' = '+newR0.txt()+'.';
    steps[steps.length-1].noteHTML=arithNote(r0,o.sym,o.val,newR0);
  }

  /* --- عملية الجمع/الطرح على حدّ المجهول --- */
  if(!r1.isZero()){
    var o2=cancelOpTerm(r1,vn);
    steps.push(st(o2.verb+' '+coefTerm(r1,vn).replace(/<[^>]*>/g,'')+vn+' '+o2.prep+' الطرفين',
      polyHTML(curL,vn)+o2.html+R.eq()+polyHTML(curR,vn)+o2.html,
      'نجمع حدود المجهول في طرف واحد ونُبقي الأعداد في الطرف الآخر.'));
    var newL1=l1.sub(r1);
    curL=[F0,newL1];curR=[curR[0]||F0];
    steps.push(st('نجمع الحدود المتشابهة',polyHTML(curL,vn)+R.eq()+polyHTML(curR,vn),
      'معامل '+vn+' أصبح '+l1.txt()+' '+o2.sym+' '+r1.abs().txt()+' = '+newL1.txt()+'.'));
    steps[steps.length-1].noteHTML=arithNote(l1,o2.sym,r1.abs(),newL1);
    l1=newL1;
  }

  var a=l1,b=(curR[0]||F0);
  if(a.isZero()){
    var inf=b.isZero();
    steps.push(st(inf?'متطابقة':'مستحيلة',R.raw('0')+R.eq()+R.num(b),
      inf?'الطرفان متطابقان مهما كانت قيمة المجهول: كل عدد حقيقي حلّ للمعادلة.'
         :'وصلنا إلى عبارة خاطئة: لا يوجد حلّ للمعادلة.'));
    return mk({topic:'equation',topicLabel:'معادلة · الدرجة الأولى',problemText:t,
      problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
      answerText:inf?'كل عدد حقيقي':'لا يوجد حل',answerHTML:R.txt(inf?'ℝ':'∅'),practice:'linear'});
  }

  var x=b.div(a);
  if(!(a.n===1&&a.d===1)){
    steps.push(st('نقسم الطرفين على معامل المجهول',
      R.frac(R.num(a)+R.vr(vn),R.num(a))+R.eq()+R.frac(R.num(b),R.num(a)),
      a.isInt()?'نقسم على '+a.txt()+' ليبقى المجهول وحده.'
             :'القسمة على كسر تعني الضرب في مقلوبه.'));
    steps.push(st('نحسب القسمة',R.vr(vn)+R.eq()+R.num(b)+R.op('÷')+R.num(a)+R.eq()+R.num(x)));
  }
  steps.push(st('قيمة المجهول',R.vr(vn)+R.eq()+R.num(x)));

  var lv=KH.pval(L,x),rv=KH.pval(Rr,x);
  return mk({topic:'equation',topicLabel:'معادلة · الدرجة الأولى',problemText:t,
    problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
    answerText:vn+' = '+x.txt(),answerHTML:R.vr(vn)+R.eq()+R.num(x),answerValue:x.val(),
    check:{html:subHTML(L,vn,R.num(x))+R.eq()+R.num(lv)+R.sp()+subHTML(Rr,vn,R.num(x))+R.eq()+R.num(rv),
      note:'عوّضنا عن «'+vn+'» بالقيمة في الطرفين فتساويا ✔ الحل صحيح.'},
    practice:'linear'});
}

/* ==================================================================
   4) معادلة الدرجة الثانية
   ================================================================== */
function solveQuadratic(t,L,Rr,P,la,ra,vn){
  var a=get(P,2),b=get(P,1),c=get(P,0);
  var steps=[st('نكتب المعادلة',astHTML(la)+R.eq()+astHTML(ra)),
    st('نرتّبها على الشكل أ'+vn+'² + ب'+vn+' + ج = 0',polyHTML(P,vn)+R.eq()+R.raw('0'),
      'ننقل كل الحدود إلى طرف واحد بالجمع والطرح من الطرفين.'),
    st('نحدّد المعاملات',R.lbl('أ')+R.num(a)+R.sp()+R.lbl('ب')+R.num(b)+R.sp()+R.lbl('ج')+R.num(c))];
  var b2=b.mul(b),fourac=F(4).mul(a).mul(c),D=b2.sub(fourac);
  steps.push(st('نحسب المميّز Δ',
    R.raw('Δ')+R.eq()+R.pow(R.vr('ب'),2)+R.op('−')+R.raw('4')+R.op('×')+R.vr('أ')+R.op('×')+R.vr('ج')+
    R.eq()+R.num(b2)+R.op('−')+R.par(R.num(fourac))+R.eq()+R.num(D),
    'إشارة Δ تحدّد عدد الحلول.'));
  if(D.n<0){
    steps.push(st('لا حل حقيقي',R.raw('Δ < 0'),'المميّز سالب: لا حلول في ℝ.'));
    return mk({topic:'quadratic',topicLabel:'معادلة · الدرجة الثانية',problemText:t,
      problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
      answerText:'لا يوجد حل حقيقي',answerHTML:R.txt('∅'),practice:'quad'});
  }
  var sq=D.isInt()?KH.isPerfectSq(D.n):null,x1,x2;
  if(sq!==null){
    var s=F(sq);
    x1=b.neg().add(s).div(F(2).mul(a));x2=b.neg().sub(s).div(F(2).mul(a));
    steps.push(st('جذر المميّز',R.sqrt(R.num(D))+R.eq()+R.num(s),'Δ مربع كامل، إذن الحلّان نسبيان.'));
    if(a.n===1&&a.d===1&&b.isInt()&&c.isInt()){
      var p=x1.neg(),q=x2.neg();
      steps.push(st('نحلّل الحدودية',
        R.par(R.vr(vn)+R.op(p.n>=0?'+':'−')+R.num(p.abs()))+R.par(R.vr(vn)+R.op(q.n>=0?'+':'−')+R.num(q.abs()))+R.eq()+R.raw('0'),
        'عددان مجموعهما '+b.txt()+' وحاصل ضربهما '+c.txt()+'.'));
    }
    steps.push(st('القانون العام',
      R.vr(vn)+R.eq()+R.frac(R.op('−')+R.vr('ب')+R.op('±')+R.sqrt(R.raw('Δ')),R.raw('2')+R.vr('أ'))+
      R.eq()+R.frac(R.num(b.neg())+R.op('±')+R.num(s),R.num(F(2).mul(a)))));
    steps.push(st('نحسب الحلّين بالجمع والطرح',
      R.vr(vn)+R.raw('₁')+R.eq()+R.frac(R.num(b.neg())+R.op('+')+R.num(s),R.num(F(2).mul(a)))+R.eq()+R.num(x1)+R.sp()+
      R.vr(vn)+R.raw('₂')+R.eq()+R.frac(R.num(b.neg())+R.op('−')+R.num(s),R.num(F(2).mul(a)))+R.eq()+R.num(x2)));
  }else{
    var dv=D.val();
    x1=F((-b.val()+Math.sqrt(dv))/(2*a.val()));x2=F((-b.val()-Math.sqrt(dv))/(2*a.val()));
    steps.push(st('القانون العام',R.vr(vn)+R.eq()+R.frac(R.op('−')+R.vr('ب')+R.op('±')+R.sqrt(R.raw('Δ')),R.raw('2')+R.vr('أ')),
      'Δ ليس مربعًا كاملًا: نقرّب عشريًا.'));
    steps.push(st('التقريب',R.vr(vn)+R.raw('₁')+R.op('≈')+R.raw(x1.val().toFixed(3))+R.sp()+
      R.vr(vn)+R.raw('₂')+R.op('≈')+R.raw(x2.val().toFixed(3))));
  }
  steps.push(st('الحلّان',R.vr(vn)+R.raw('₁')+R.eq()+R.num(x1)+R.sp()+R.vr(vn)+R.raw('₂')+R.eq()+R.num(x2)));
  return mk({topic:'quadratic',topicLabel:'معادلة · الدرجة الثانية',problemText:t,
    problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
    answerText:vn+' = '+x1.txt()+' أو '+x2.txt(),
    answerHTML:R.vr(vn)+R.raw('₁')+R.eq()+R.num(x1)+R.sp()+R.vr(vn)+R.raw('₂')+R.eq()+R.num(x2),
    answerValue:x1.val(),
    check:{html:R.vr(vn)+R.raw('₁')+R.op('+')+R.vr(vn)+R.raw('₂')+R.eq()+R.num(x1.add(x2))+R.sp()+
      R.vr(vn)+R.raw('₁')+R.op('×')+R.vr(vn)+R.raw('₂')+R.eq()+R.num(x1.mul(x2)),
      note:'المجموع = −ب/أ والجداء = ج/أ ✔'},
    practice:'quad'});
}

/* ==================================================================
   5) جملة معادلتين — الحدود الثابتة تُحسب صحيحةً (جمع وطرح)
   ================================================================== */
function emptyForm(){return{k:F0,v:{}}}
function hasVars(f){return Object.keys(f.v).length>0}
function addForm(A,B){
  var v={},k;
  for(k in A.v)v[k]=A.v[k];
  for(k in B.v)v[k]=(v[k]||F0).add(B.v[k]);
  for(k in v)if(v[k].isZero())delete v[k];
  return{k:A.k.add(B.k),v:v};
}
function scaleForm(A,s){
  var v={};for(var k in A.v)v[k]=A.v[k].mul(s);
  return{k:A.k.mul(s),v:v};
}
function formOf(n){
  switch(n.t){
    case 'num':return{k:n.v,v:{}};
    case 'var':{var o={};o[n.name]=F1;return{k:F0,v:o}}
    case 'par':return formOf(n.a);
    case 'neg':return scaleForm(formOf(n.a),F(-1));
    case 'fn':{
      var f=formOf(n.a);
      if(hasVars(f))throw new MError('الدوال على المجهول غير مدعومة في الجملة الخطية.');
      var val=f.k.val();
      if(n.name==='abs')return{k:F(Math.abs(val)),v:{}};
      if(n.name==='sqrt'){
        var pf=KH.isPerfectSq(val);
        if(val<0||pf===null)throw new MError('الجذر هنا يجب أن يكون لعدد مربع كامل.');
        return{k:F(pf),v:{}};
      }
      throw new MError('sin/cos/tan تُحسب في درس النسب المثلثية.');
    }
    case 'bin':{
      var A=formOf(n.l),B=formOf(n.r);
      if(n.op==='+')return addForm(A,B);
      if(n.op==='-')return addForm(A,scaleForm(B,F(-1)));
      if(n.op==='*'){
        if(!hasVars(A))return scaleForm(B,A.k);
        if(!hasVars(B))return scaleForm(A,B.k);
        throw new MError('جداء مجهولين يجعل الجملة غير خطية.');
      }
      if(n.op==='/'){
        if(hasVars(B))throw new MError('القسمة على مجهول غير مدعومة في الجملة الخطية.');
        if(B.k.isZero())throw new MError('لا يمكن القسمة على صفر.');
        return scaleForm(A,F1.div(B.k));
      }
      if(n.op==='^'){
        if(hasVars(B)||!B.k.isInt())throw new MError('الأس يجب أن يكون عددًا صحيحًا.');
        var e=B.k.n;
        if(!hasVars(A))return{k:A.k.pow(e),v:{}};
        if(e===1)return A;
        if(e===0)return{k:F1,v:{}};
        throw new MError('أس المجهول يجب أن يكون 1 في الجملة الخطية.');
      }
    }
  }
  throw new MError('تعذّر تحليل التعبير.');
}
function eqCoeffs(left,right,X,Y){
  var f=addForm(formOf(left),scaleForm(formOf(right),F(-1)));
  return{a:f.v[X]||F0,b:f.v[Y]||F0,c:f.k.neg()};
}
function eqHTML(e,X,Y){
  var list=[{c:e.a,deg:1}];
  var out=terms(list,X);
  if(!e.b.isZero())out+=R.op(e.b.n<0?'−':'+')+coefTerm(e.b,Y);
  if(e.a.isZero()&&e.b.isZero())out=R.raw('0');
  return out+R.eq()+R.num(e.c);
}
function solveSystem(t){
  var chunks=t.split(/[;؛\n]+/).map(function(s){return s.trim()})
    .filter(function(s){return s.indexOf('=')>=0});
  if(chunks.length!==2)throw new MError('اكتب معادلتين مفصولتين بـ ؛ مثل: 2س + 3ص = 12 ؛ س - ص = 1');
  var parsed=chunks.map(function(c){
    var run=bestRun(mathRuns(c),function(r){return r.rel&&r.rel.v==='='});
    if(!run)throw new MError('كل معادلة يجب أن تحوي علامة = واحدة.');
    var p=splitRelation(run);
    return{la:parse(toMath(p.left)),ra:parse(toMath(p.right)),vars:run.vars};
  });
  var vs=[];
  parsed.forEach(function(p){p.vars.forEach(function(v){if(vs.indexOf(v)<0)vs.push(v)})});
  if(vs.length!==2)throw new MError('الجملة تحتاج مجهولين مختلفين. وجدنا: '+(vs.join('، ')||'لا شيء'));
  var X=vs[0],Y=vs[1];
  var e1=eqCoeffs(parsed[0].la,parsed[0].ra,X,Y);
  var e2=eqCoeffs(parsed[1].la,parsed[1].ra,X,Y);

  var steps=[st('نرتّب الجملة على الشكل أ'+X+' + ب'+Y+' = ج',
    R.lbl('(1)')+eqHTML(e1,X,Y)+R.sp()+R.lbl('(2)')+eqHTML(e2,X,Y),
    'نقلنا كل الحدود bằng الجمع والطرح من الطرفين حتى صارت الأعداد في طرف وحدها.')];

  var D=e1.a.mul(e2.b).sub(e2.a.mul(e1.b));
  if(D.isZero()){
    var consistent=e1.c.mul(e2.b).sub(e2.c.mul(e1.b)).isZero();
    steps.push(st('نحسب المحدّد',
      R.raw('Δ')+R.eq()+R.num(e1.a)+R.op('×')+R.num(e2.b)+R.op('−')+R.num(e2.a)+R.op('×')+R.num(e1.b)+R.eq()+R.raw('0'),
      consistent?'المعادلتان متكافئتان: المستقيمان منطبقان وعدد الحلول لا نهائي.'
                :'المستقيمان متوازيان ومتمايزان: لا حلّ للجملة.'));
    return mk({topic:'system',topicLabel:'جملة معادلتين',problemText:t,
      problemHTML:R.lbl('(1)')+eqHTML(e1,X,Y)+R.sp()+R.lbl('(2)')+eqHTML(e2,X,Y),
      steps:steps,answerText:consistent?'عدد لا نهائي من الحلول':'لا يوجد حل',
      answerHTML:R.txt(consistent?'∞':'∅'),practice:'system'});
  }

  var xv,yv;
  if(e1.b.isZero()){
    xv=e1.c.div(e1.a);
    steps.push(st('المعادلة (1) تحوي '+X+' فقط',R.vr(X)+R.eq()+R.num(e1.c)+R.op('÷')+R.num(e1.a)+R.eq()+R.num(xv),
      'لا حاجة للحذف: نقسم مباشرة على المعامل.'));
    yv=e2.c.sub(e2.a.mul(xv)).div(e2.b);
    steps.push(st('نعوّض في (2) لإيجاد '+Y,
      R.num(e2.a)+R.op('×')+R.par(R.num(xv))+R.op('+')+R.num(e2.b)+R.vr(Y)+R.eq()+R.num(e2.c)));
    steps.push(st('نطرح ثم نقسم',R.num(e2.b)+R.vr(Y)+R.eq()+R.num(e2.c)+R.op('−')+R.num(e2.a.mul(xv))+R.eq()+R.num(e2.c.sub(e2.a.mul(xv))),
      'طرحنا '+e2.a.mul(xv).txt()+' من الطرفين.'));
    steps.push(st('نقسم على المعامل',R.vr(Y)+R.eq()+R.num(e2.c.sub(e2.a.mul(xv)))+R.op('÷')+R.num(e2.b)+R.eq()+R.num(yv)));
  }else if(e2.b.isZero()){
    xv=e2.c.div(e2.a);
    steps.push(st('المعادلة (2) تحوي '+X+' فقط',R.vr(X)+R.eq()+R.num(e2.c)+R.op('÷')+R.num(e2.a)+R.eq()+R.num(xv)));
    yv=e1.c.sub(e1.a.mul(xv)).div(e1.b);
    steps.push(st('نعوّض في (1) لإيجاد '+Y,R.vr(Y)+R.eq()+R.num(e1.c.sub(e1.a.mul(xv)))+R.op('÷')+R.num(e1.b)+R.eq()+R.num(yv)));
  }else{
    var m1=e2.b.abs(),m2=e1.b.abs();
    steps.push(st('نوحّد معامل '+Y+' في المعادلتين',
      R.lbl('(1)×'+m1.txt())+eqHTML({a:e1.a.mul(m1),b:e1.b.mul(m1),c:e1.c.mul(m1)},X,Y)+R.sp()+
      R.lbl('(2)×'+m2.txt())+eqHTML({a:e2.a.mul(m2),b:e2.b.mul(m2),c:e2.c.mul(m2)},X,Y),
      'ضربنا كل معادلة في عدد يجعل معاملي '+Y+' متساويين في القيمة المطلقة.'));
    var A1=e1.a.mul(m1),A2=e2.a.mul(m2),C1=e1.c.mul(m1),C2=e2.c.mul(m2);
    var B1=e1.b.mul(m1),B2=e2.b.mul(m2);
    var same=(B1.n>0)===(B2.n>0);
    var aD=same?A1.sub(A2):A1.add(A2),cD=same?C1.sub(C2):C1.add(C2);
    var sym=same?'−':'+';
    steps.push(st(same?'نطرح (2) من (1)':'نجمع (1) و(2)',
      R.par(R.num(A1)+R.op(sym)+R.num(A2))+R.vr(X)+R.eq()+R.num(C1)+R.op(sym)+R.num(C2),
      same?'معامل '+Y+' متساوٍ بالإشارة، فالطرح يحذفه.'
          :'معامل '+Y+' متعاكس بالإشارة، فالجمع يحذفه.'));
    steps.push(st('نحسب الجمع والطرح',terms([{c:aD,deg:1}],X)+R.eq()+R.num(cD),
      'معامل '+X+': '+A1.txt()+' '+sym+' '+A2.txt()+' = '+aD.txt()+
      '، والطرف الأيمن: '+C1.txt()+' '+sym+' '+C2.txt()+' = '+cD.txt()+'.'));
    if(aD.isZero())throw new MError('تعذّر الحذف؛ تحقّق من كتابة الجملة.');
    xv=cD.div(aD);
    steps.push(st('نقسم على معامل '+X,R.vr(X)+R.eq()+R.num(cD)+R.op('÷')+R.num(aD)+R.eq()+R.num(xv)));
    var rhs=e1.c.sub(e1.a.mul(xv));
    steps.push(st('نعوّض قيمة '+X+' في (1)',
      R.num(e1.a)+R.op('×')+R.par(R.num(xv))+R.op('+')+R.num(e1.b)+R.vr(Y)+R.eq()+R.num(e1.c)));
    steps.push(st('نطرح من الطرفين',R.num(e1.b)+R.vr(Y)+R.eq()+R.num(e1.c)+R.op('−')+R.num(e1.a.mul(xv))+R.eq()+R.num(rhs),
      'طرحنا '+e1.a.mul(xv).txt()+' من الطرفين لعزل حدّ '+Y+'.'));
    yv=rhs.div(e1.b);
    steps.push(st('نقسم على معامل '+Y,R.vr(Y)+R.eq()+R.num(rhs)+R.op('÷')+R.num(e1.b)+R.eq()+R.num(yv)));
  }
  steps.push(st('حلّ الجملة',R.vr(X)+R.eq()+R.num(xv)+R.sp()+R.vr(Y)+R.eq()+R.num(yv)));
  var v1=e1.a.mul(xv).add(e1.b.mul(yv)),v2=e2.a.mul(xv).add(e2.b.mul(yv));
  return mk({topic:'system',topicLabel:'جملة معادلتين',problemText:t,
    problemHTML:R.lbl('(1)')+eqHTML(e1,X,Y)+R.sp()+R.lbl('(2)')+eqHTML(e2,X,Y),
    steps:steps,answerText:X+' = '+xv.txt()+' ، '+Y+' = '+yv.txt(),
    answerHTML:R.vr(X)+R.eq()+R.num(xv)+R.sp()+R.vr(Y)+R.eq()+R.num(yv),answerValue:xv.val(),
    check:{html:R.lbl('(1)')+R.num(v1)+R.eq()+R.num(e1.c)+R.sp()+R.lbl('(2)')+R.num(v2)+R.eq()+R.num(e2.c),
      note:'الزوج ('+xv.txt()+' , '+yv.txt()+') يحقّق المعادلتين معًا ✔'},
    practice:'system'});
}

/* ==================================================================
   6) المتراجحة
   ================================================================== */
function solveInequality(t){
  var run=bestRun(mathRuns(t),function(r){return r.rel&&r.rel.v!=='='});
  if(!run)throw new MError('اكتب متراجحة مثل: 2س + 3 > 11');
  var parts=splitRelation(run);
  var sign=parts.op;
  if(!run.vars.length)throw new MError('المتراجحة يجب أن تحوي مجهولًا.');
  if(run.vars.length>1)throw new MError('المتراجحة مدعومة بمجهول واحد.');
  var vn=run.vars[0];
  var la=parse(toMath(parts.left)),ra=parse(toMath(parts.right));
  var L=toPoly(la,vn,1),Rr=toPoly(ra,vn,1);
  var l1=get(L,1),l0=get(L,0),r1=get(Rr,1),r0=get(Rr,0);
  var steps=[st('نكتب المتراجحة',polyHTML(L,vn)+R.op(sign)+polyHTML(Rr,vn),
    'نجمع ونطرح من الطرفين كما في المعادلة تمامًا.')];
  var curR0=r0,curL1=l1;
  if(!l0.isZero()){
    var o=cancelOp(l0);
    steps.push(st(o.verb+' '+o.val.txt()+' '+o.prep+' الطرفين',
      polyHTML(L,vn)+o.html+R.op(sign)+polyHTML(Rr,vn)+o.html));
    curR0=r0.sub(l0);
    steps.push(st('نبسّط',terms([{c:l1,deg:1}],vn)+R.op(sign)+R.num(curR0),
      'الطرف الأيمن: '+r0.txt()+' '+o.sym+' '+o.val.txt()+' = '+curR0.txt()+'.'));
  }
  if(!r1.isZero()){
    var o2=cancelOpTerm(r1,vn);
    steps.push(st(o2.verb+' حدّ المجهول '+o2.prep+' الطرفين',
      terms([{c:l1,deg:1}],vn)+o2.html+R.op(sign)+
      polyHTML([curR0,r1],vn)+o2.html));
    curL1=l1.sub(r1);
    steps.push(st('نجمع الحدود المتشابهة',terms([{c:curL1,deg:1}],vn)+R.op(sign)+R.num(curR0),
      'معامل المجهول: '+l1.txt()+' '+o2.sym+' '+r1.abs().txt()+' = '+curL1.txt()+'.'));
  }
  if(curL1.isZero())throw new MError('لا يوجد حدّ في المجهول بعد التجميع.');
  var fin=sign,note='نقسم الطرفين على '+curL1.txt()+'.';
  if(curL1.n<0){
    fin={'<':'>','>':'<','≤':'≥','≥':'≤'}[sign];
    note='نقسم على عدد سالب ('+curL1.txt()+')، لذلك نعكس اتجاه المتراجحة — القاعدة الأهم هنا.';
  }
  var x=F(curR0.val()/curL1.val());
  steps.push(st('نقسم على معامل المجهول',R.vr(vn)+R.op(fin)+R.num(x),note));
  return mk({topic:'inequality',topicLabel:'متراجحة · الدرجة الأولى',problemText:t,
    problemHTML:polyHTML(L,vn)+R.op(sign)+polyHTML(Rr,vn),steps:steps,
    answerText:vn+' '+fin+' '+x.txt(),answerHTML:R.vr(vn)+R.op(fin)+R.num(x),
    answerValue:x.val(),practice:'linear'});
}

/* ==================================================================
   7) النشر والتحليل
   ================================================================== */
function solveExpand(t){
  var run=bestRun(mathRuns(t.replace(/انشر|فك|وسّع|وسع|المتطابقة|الشهيرة/g,' ')),
    function(r){return !r.rel&&r.vars.length>0});
  if(!run)throw new MError('اكتب المقدار بعد «انشر»، مثل: انشر (س+3)(س+2)');
  var a=parse(toMath(run.text));
  if(run.vars.length!==1)throw new MError('النشر مدعوم بمجهول واحد.');
  var vn=run.vars[0];
  var P=toPoly(a,vn,4);
  var ident=null;
  if(a.t==='bin'&&a.op==='^'&&a.r.t==='num'&&a.r.v.n===2&&a.l.t==='par'&&a.l.a.t==='bin'){
    ident=a.l.a.op==='+'?'(أ + ب)² = أ² + 2أب + ب²':'(أ − ب)² = أ² − 2أب + ب²';
  }
  var steps=[st('نكتب المقدار',astHTML(a))];
  if(ident)steps.push(st('نستعمل المتطابقة الشهيرة',R.txt(ident),'متطابقة شهيرة من متطابقات الدرجة الثانية.'));
  else{
    var pr=productsHTML(a);
    if(pr)steps.push(st('نوزّع الضرب على الجمع',pr,'نضرب العدد خارج القوس في كل حدّ داخله.'));
    else steps.push(st('نوزّع الضرب على الجمع',astHTML(a),'كل حدّ في القوس الأول يُضرب في كل حدّ من القوس الثاني.'));
  }
  steps.push(st('نجمع الحدود المتشابهة',polyHTML(P,vn),'نرتّب الحدود بحسب أسس المجهول تنازلًا.'));
  return mk({topic:'expand',topicLabel:'نشر حدودية',problemText:t,problemHTML:astHTML(a),steps:steps,
    answerText:'الصورة المنشورة',answerHTML:polyHTML(P,vn),practice:'expand'});
}
function solveFactor(t){
  var run=bestRun(mathRuns(t.replace(/حلل|تحليل/g,' ')),function(r){return !r.rel&&r.vars.length>0});
  if(!run)throw new MError('اكتب المقدار بعد «حلل»، مثل: حلل س^2 + 5س + 6');
  var a=parse(toMath(run.text));
  if(run.vars.length!==1)throw new MError('التحليل مدعوم بمجهول واحد.');
  var vn=run.vars[0];
  var P=toPoly(a,vn,3),d=deg(P);
  if(d<1)throw new MError('لا يوجد مقدار جبري للتحليل.');
  var steps=[st('نكتب الحدودية',polyHTML(P,vn))];
  var allInt=P.every(function(c){return c.isInt()});
  var g=0,minP=99;
  P.forEach(function(c,i){if(!c.isZero()){g=KH.gcd(g,Math.abs(c.n));minP=Math.min(minP,i)}});
  var Q=P,gtx='';
  if(allInt&&(g>1||minP>0)){
    Q=P.map(function(c){return F(c.n/g)});if(minP>0)Q=Q.slice(minP);
    gtx=(g>1?R.raw(g):'')+(minP>0?(minP===1?R.vr(vn):R.pow(R.vr(vn),minP)):'');
    steps.push(st('نستخرج العامل المشترك',polyHTML(P,vn)+R.eq()+gtx+R.par(polyHTML(Q,vn)),
      'أكبر عامل مشترك بين المعاملات هو '+g+(minP>0?'، وأصغر أس للمجهول هو '+minP:'')+'.'));
  }
  var ans=gtx?gtx+R.par(polyHTML(Q,vn)):polyHTML(P,vn),done=false;
  if(deg(Q)===2&&get(Q,2).n===1&&get(Q,2).d===1&&get(Q,1).isInt()&&get(Q,0).isInt()){
    var b=get(Q,1).n,c=get(Q,0).n,p=null,q=null;
    if(c===0){p=0;q=b}
    else for(var i=-Math.abs(c)-2;i<=Math.abs(c)+2;i++){if(i!==0&&c%i===0&&i+c/i===b){p=i;q=c/i;break}}
    if(p!==null){
      steps.push(st('نبحث عن عددين',R.raw('م + ن = '+b)+R.sp()+R.raw('م × ن = '+c),
        'مجموعهما معامل المجهول وجداؤهما الحد الثابت.'));
      if(p===-q&&c<0)steps.push(st('فرق مربعين',R.txt('أ² − ب² = (أ − ب)(أ + ب)')));
      if(p===q)steps.push(st('مربع كامل',R.txt('أ² ± 2أب + ب² = (أ ± ب)²')));
      var f=R.par(R.vr(vn)+R.op(p>=0?'+':'−')+R.raw(Math.abs(p)))+
            R.par(R.vr(vn)+R.op(q>=0?'+':'−')+R.raw(Math.abs(q)));
      steps.push(st('نكتب التحليل',polyHTML(Q,vn)+R.eq()+f));
      ans=gtx+f;done=true;
      steps.push(st('نتحقّق بالنشر',f+R.eq()+polyHTML(Q,vn),'نشر الجداء يعيد الحدودية الأصلية ✔'));
    }
  }
  if(!done&&deg(Q)>=1)steps.push(st('لا يتحلّل بمعاملات صحيحة',polyHTML(Q,vn),'نكتفي بالعامل المشترك المستخرج.'));
  return mk({topic:'factor',topicLabel:'تحليل حدودية',problemText:t,problemHTML:polyHTML(P,vn),steps:steps,
    answerText:'الصورة المحلّلة',answerHTML:ans,practice:'factor'});
}

/* ==================================================================
   8) الجذور
   ================================================================== */
function solveRadical(t){
  var m=t.match(/(?:√|جذر)\s*(?:التربيعي\s*)?(?:لـ|ل|:)?\s*(\d+)/);
  if(!m)throw new MError('اكتب الجذر هكذا: √72 أو «الجذر التربيعي لـ 50».');
  var n=Number(m[1]),pf=KH.isPerfectSq(n);
  var steps=[st('نكتب المطلوب',R.sqrt(R.raw(n)))];
  if(pf!==null){
    steps.push(st('مربع كامل',R.raw(n)+R.eq()+R.pow(R.raw(pf),2)),st('النتيجة',R.sqrt(R.raw(n))+R.eq()+R.raw(pf)));
    return mk({topic:'radical',topicLabel:'الأعداد الحقيقية · جذور',problemText:t,problemHTML:R.sqrt(R.raw(n)),
      steps:steps,answerText:String(pf),answerHTML:R.raw(pf),answerValue:pf,practice:'radical'});
  }
  var r=KH.simplifyRad(n);
  if(r.k===1){
    steps.push(st('لا عامل مربّع',R.sqrt(R.raw(n)),'لا يقبل القسمة على مربع كامل غير 1: هو في أبسط صورة.'));
    return mk({topic:'radical',topicLabel:'الأعداد الحقيقية · جذور',problemText:t,problemHTML:R.sqrt(R.raw(n)),
      steps:steps,answerText:'√'+n,answerHTML:R.sqrt(R.raw(n)),answerValue:Math.sqrt(n),practice:'radical'});
  }
  steps.push(st('نبحث عن أكبر مربع كامل يقسم العدد',R.raw(n)+R.eq()+R.raw(r.k*r.k)+R.op('×')+R.raw(r.m),
    'المربع الكامل هو '+(r.k*r.k)+' لأن '+r.k+'×'+r.k+' = '+(r.k*r.k)+'.'));
  steps.push(st('نفصل الجذر',R.sqrt(R.raw(n))+R.eq()+R.sqrt(R.raw(r.k*r.k))+R.op('×')+R.sqrt(R.raw(r.m)),
    '√(أ×ب) = √أ × √ب.'));
  steps.push(st('نبسّط',R.sqrt(R.raw(n))+R.eq()+R.raw(r.k)+R.sqrt(R.raw(r.m))));
  return mk({topic:'radical',topicLabel:'الأعداد الحقيقية · جذور',problemText:t,problemHTML:R.sqrt(R.raw(n)),steps:steps,
    answerText:r.k+'√'+r.m,answerHTML:R.raw(r.k)+R.sqrt(R.raw(r.m)),answerValue:Math.sqrt(n),
    check:{html:R.pow(R.par(R.raw(r.k)+R.sqrt(R.raw(r.m))),2)+R.eq()+R.raw(r.k*r.k)+R.op('×')+R.raw(r.m)+R.eq()+R.raw(n),
      note:'بتربيع الناتج نعود إلى العدد الأصلي ✔'},practice:'radical'});
}

/* ==================================================================
   9) العمليات الحسابية — الجمع والطرح خطوة خطوة
   ================================================================== */
function collectReady(n,path,depth,out,par){
  if(n.t==='bin'){
    collectReady(n.l,path.concat('l'),depth+1,out,par);
    collectReady(n.r,path.concat('r'),depth+1,out,par);
    if(n.l.t==='num'&&n.r.t==='num')out.push({path:path,depth:depth,pr:KH.prec(n.op),i:out.length,node:n,par:par});
  }else if(n.t==='par'){collectReady(n.a,path.concat('a'),depth+1,out,true)}
  else if(n.t==='neg'){
    collectReady(n.a,path.concat('a'),depth+1,out,par);
    if(n.a.t==='num')out.push({path:path,depth:depth,pr:5,i:out.length,node:n,par:par});
  }else if(n.t==='fn'){
    collectReady(n.a,path.concat('a'),depth+1,out,par);
    if(n.a.t==='num')out.push({path:path,depth:depth,pr:6,i:out.length,node:n,par:par});
  }
}
function solveArithmetic(t){
  var run=bestRun(mathRuns(t),function(r){return !r.rel&&!r.vars.length&&(r.ops>0||r.fns>0)});
  if(!run)throw new MError('لم أجد عملية حسابية. جرّب مثل: 12 + 5 × 3 - 4');
  var ast=parse(toMath(run.text));
  if(KH.varsOf(ast).size)throw new MError('هذا التعبير يحوي مجهولًا؛ استعمل درس المعادلات.');
  var original=astHTML(ast),steps=[],guard=0;
  while(guard++<80){
    var out=[];collectReady(ast,[],0,out,false);
    if(!out.length){ast=KH.unwrapPars(ast);if(ast.t==='num')break;continue}
    out.sort(function(x,y){return y.depth-x.depth||y.pr-x.pr||x.i-y.i});
    var pk=out[0],node=pk.node,before=astHTML(ast),val,note='',extra='',title='';
    if(node.t==='neg'){val=node.a.v.neg();title='نعالج الإشارة';note='سالب العدد هو معاكسه على خط الأعداد.'}
    else if(node.t==='fn'){
      var av=node.a.v.val();
      if(node.name==='sqrt'){
        var pf=KH.isPerfectSq(av);
        if(av<0)throw new MError('جذر عدد سالب غير معرّف حقيقيًا.');
        if(pf===null)throw new MError('الجذر غير نسبي؛ استعمل درس تبسيط الجذور.');
        val=F(pf);title='نحسب الجذر';note='الجذر التربيعي للعدد المربع.';
      }else if(node.name==='abs'){val=F(Math.abs(av));title='القيمة المطلقة';note='البعد عن الصفر، وهي موجبة دائمًا.'}
      else throw new MError('sin/cos/tan تُحسب في درس النسب المثلثية.');
    }else{
      var A=node.l.v,B=node.r.v,op=node.op;
      var base={'+':'نجمع','-':'نطرح','*':'نضرب','/':'نقسم','^':'نحسب القوة'}[op];
      title=(pk.par?'داخل الأقواس — ':'')+base;
      if(op==='+'){
        val=A.add(B);note='نجمع.';
        if(A.d>1||B.d>1){
          var L=KH.lcm(A.d,B.d);
          extra=R.frac(R.raw(A.n*(L/A.d)),R.raw(L))+R.op('+')+R.frac(R.raw(B.n*(L/B.d)),R.raw(L))+R.eq();
          note='نوحّد المقامات على المقام المشترك الأصغر '+L+' ثم نجمع البسوط.';
        }else if(A.n<0||B.n<0)note='عند جمع مختلفي الإشارة نطرح القيمتين ونأخذ إشارة الأكبر قيمة.';
      }
      else if(op==='-'){
        val=A.sub(B);note='طرح عدد سالب = جمع معاكسه.';
        if(A.d>1||B.d>1){
          var L2=KH.lcm(A.d,B.d);
          extra=R.frac(R.raw(A.n*(L2/A.d)),R.raw(L2))+R.op('−')+R.frac(R.raw(B.n*(L2/B.d)),R.raw(L2))+R.eq();
          note='نوحّد المقامات على '+L2+' ثم نطرح البسوط.';
        }
      }
      else if(op==='*'){val=A.mul(B);note=(A.d>1||B.d>1)?'بسط×بسط ومقام×مقام ثم نختصر.':'الضرب يُنفَّذ قبل الجمع والطرح.'}
      else if(op==='/'){val=A.div(B);note='القسمة على عدد = الضرب في مقلوبه.'}
      else{
        if(!B.isInt()||Math.abs(B.n)>12)throw new MError('الأس كبير أو غير صحيح.');
        val=A.pow(B.n);note='القوة تعني تكرار ضرب الأساس في نفسه '+B.n+' مرة.';
      }
    }
    var next=KH.cloneAST(ast);
    if(pk.path.length===0){Object.keys(next).forEach(function(k){delete next[k]});next.t='num';next.v=val}
    else{var p=next;for(var k=0;k<pk.path.length-1;k++)p=p[pk.path[k]];
      p[pk.path[pk.path.length-1]]={t:'num',v:val}}
    ast=KH.unwrapPars(next);
    steps.push(st(title,before+R.eq()+extra+astHTML(ast),note));
    if(ast.t==='num')break;
  }
  if(ast.t!=='num')throw new MError('تعذّر إكمال الحساب.');
  var res=ast.v;
  if(!steps.length)steps.push(st('القيمة',original+R.eq()+R.num(res)));
  return mk({topic:'arithmetic',topicLabel:'الأعداد · عمليات',problemText:t,problemHTML:original,steps:steps,
    answerText:res.txt(),answerHTML:R.num(res),answerValue:res.val(),
    check:{html:R.num(res)+(res.d>1?R.op('≈')+R.raw(res.val().toFixed(4)):''),
      note:'رتّبنا العمليات: الأقواس ← القوى والجذور ← الضرب والقسمة ← الجمع والطرح.'},practice:'arith'});
}

/* ==================================================================
   10) النسبة المئوية
   ================================================================== */
function solvePercent(t){
  var m=t.match(/(\d+(?:\.\d+)?)\s*(?:%|٪)\s*(?:من|of)\s*(\d+(?:\.\d+)?)/);
  if(m){
    var p=F(+m[1]),n=F(+m[2]),r=p.div(F(100)).mul(n);
    return mk({topic:'percent',topicLabel:'نسبة مئوية',problemText:t,
      problemHTML:R.raw(p.txt()+'%')+R.op('×')+R.num(n),
      steps:[st('نفهم المطلوب',R.txt('نسبة من عدد = ضرب العدد في النسبة')),
        st('نحوّل النسبة إلى كسر',R.raw(p.txt()+'%')+R.eq()+R.frac(R.raw(p.n),R.raw(100)),'النسبة المئوية معناها «من كل مائة».'),
        st('نضرب في العدد',R.frac(R.raw(p.n),R.raw(100))+R.op('×')+R.num(n)+R.eq()+R.num(r)),
        st('النتيجة',R.num(r)+(r.isInt()?'':R.op('≈')+R.raw(r.val().toFixed(2))))],
      answerText:r.txt(),answerHTML:R.num(r),answerValue:r.val(),practice:'percent'});
  }
  m=t.match(/(زيادة|خصم|تخفيض)\s*(\d+(?:\.\d+)?)\s*(?:%|٪)\s*(?:من|على)\s*(\d+(?:\.\d+)?)/);
  if(m){
    var up=m[1]==='زيادة',p2=F(+m[2]),n2=F(+m[3]),d=p2.div(F(100)).mul(n2),fin=up?n2.add(d):n2.sub(d);
    return mk({topic:'percent',topicLabel:up?'زيادة':'خصم',problemText:t,
      problemHTML:R.num(n2)+R.op(up?'+':'−')+R.raw(p2.txt()+'%'),
      steps:[st('نحسب قيمة النسبة',R.frac(R.raw(p2.n),R.raw(100))+R.op('×')+R.num(n2)+R.eq()+R.num(d)),
        st(up?'نضيف الزيادة':'نطرح الخصم',R.num(n2)+R.op(up?'+':'−')+R.num(d)+R.eq()+R.num(fin)),
        st('النتيجة',R.num(fin))],
      answerText:fin.txt(),answerHTML:R.num(fin),answerValue:fin.val(),practice:'percent'});
  }
  throw new MError('اكتب النسبة هكذا: 15% من 80، أو: خصم 20% من 350.');
}

/* ==================================================================
   11) طاليس
   ================================================================== */
function solveThales(t){
  var AM=labeled(t,['AM']),AB=labeled(t,['AB']),AN=labeled(t,['AN']),
      AC=labeled(t,['AC']),MN=labeled(t,['MN']),BC=labeled(t,['BC']);
  var pairs=[[AM,AB,'AM','AB'],[AN,AC,'AN','AC'],[MN,BC,'MN','BC']];
  var known=pairs.filter(function(p){return p[0]!==null&&p[1]!==null});
  var missing=pairs.filter(function(p){return p[0]!==null&&p[1]===null});
  if(!known.length||!missing.length)
    throw new MError('اكتب ثلاث قيم معروفة ومجهولًا واحدًا، مثل: طاليس AM=3 AB=9 AN=4 (لإيجاد AC).');
  var k=known[0],ms=missing[0],ratio=F(k[0]).div(F(k[1])),val=ratio.mul(F(ms[0]));
  var steps=[st('نكتب نظرية طاليس',
    R.frac(R.raw('AM'),R.raw('AB'))+R.eq()+R.frac(R.raw('AN'),R.raw('AC'))+R.eq()+R.frac(R.raw('MN'),R.raw('BC')),
    'في المثلث ABC، إذا كان M على [AB] و N على [AC] و (MN) يوازي (BC) تتساوى هذه النسب الثلاث.'),
    st('نحسب النسبة المعلومة',R.frac(R.raw(k[2]),R.raw(k[3]))+R.eq()+R.frac(R.raw(k[0]),R.raw(k[1]))+R.eq()+R.num(ratio)),
    st('نساوي النسبة المجهولة بها',R.frac(R.raw(ms[2]),R.raw(ms[3]))+R.eq()+R.num(ratio)),
    st('نضرب تبادليًا ثم نقسم',R.raw(ms[3])+R.eq()+R.num(F(ms[0]))+R.op('÷')+R.num(ratio)+R.eq()+R.num(val))];
  return mk({topic:'thales',topicLabel:'نظرية طاليس',problemText:t,
    problemHTML:R.frac(R.raw('AM'),R.raw('AB'))+R.eq()+R.frac(R.raw('AN'),R.raw('AC'))+R.eq()+R.frac(R.raw('MN'),R.raw('BC')),
    steps:steps,answerText:ms[3]+' = '+val.txt(),answerHTML:R.raw(ms[3])+R.eq()+R.num(val),
    answerValue:val.val(),unit:'سم',
    check:{html:R.frac(R.raw(ms[2]),R.num(val))+R.eq()+R.num(ratio),note:'النسبة تساوي النسبة المعلومة ✔'},
    practice:'thales'});
}

/* ==================================================================
   12) فيثاغورس
   ================================================================== */
function solvePyth(t){
  var ns=nums(t);
  if(ns.length<2)throw new MError('اكتب ضلعين، مثل: مثلث قائم ضلعاه 6 و 8.');
  var hyp=labeled(t,['ال?وتر(?:ه)?','BC']);
  var steps=[st('نكتب نظرية فيثاغورس',R.pow(R.raw('أ'),2)+R.op('+')+R.pow(R.raw('ب'),2)+R.eq()+R.pow(R.raw('ج'),2),
    'في المثلث القائم: مجموع مربّعي الضلعين القائمين يساوي مربّع الوتر.')];
  var ans,val;
  if(hyp!==null){
    var other=ns.filter(function(v){return v!==hyp})[0];
    if(other===undefined)other=ns[0];
    var c=F(hyp),a=F(other),b2=c.mul(c).sub(a.mul(a));
    if(b2.n<0)throw new MError('الوتر يجب أن يكون أطول ضلع.');
    var r=KH.isPerfectSq(b2.n),bv=r!==null?F(r):F(Math.sqrt(b2.val()));
    steps.push(st('نعوّض',R.pow(R.num(a),2)+R.op('+')+R.pow(R.raw('ب'),2)+R.eq()+R.pow(R.num(c),2)),
      st('نحسب المربّعات',R.num(a.mul(a))+R.op('+')+R.pow(R.raw('ب'),2)+R.eq()+R.num(c.mul(c))),
      st('نطرح من الطرفين',R.pow(R.raw('ب'),2)+R.eq()+R.num(c.mul(c))+R.op('−')+R.num(a.mul(a))+R.eq()+R.num(b2)),
      st('نأخذ الجذر',R.raw('ب')+R.eq()+R.num(bv)+(r!==null?'':R.op('≈')+R.raw(bv.val().toFixed(2)))));
    ans=R.raw('ب')+R.eq()+R.num(bv);val=bv.val();
  }else{
    var a2=F(ns[0]),b=F(ns[1]),c2=a2.mul(a2).add(b.mul(b));
    var r2=KH.isPerfectSq(c2.n),cv=r2!==null?F(r2):F(Math.sqrt(c2.val()));
    steps.push(st('نعوّض',R.pow(R.num(a2),2)+R.op('+')+R.pow(R.num(b),2)+R.eq()+R.pow(R.raw('ج'),2)),
      st('نحسب المربّعات',R.num(a2.mul(a2))+R.op('+')+R.num(b.mul(b))+R.eq()+R.pow(R.raw('ج'),2)),
      st('نجمع',R.pow(R.raw('ج'),2)+R.eq()+R.num(c2)),
      st('نأخذ الجذر',R.raw('ج')+R.eq()+R.num(cv)+(r2!==null?'':R.op('≈')+R.raw(cv.val().toFixed(2))),
        'الطول موجب دائمًا.'));
    ans=R.raw('ج')+R.eq()+R.num(cv);val=cv.val();
  }
  return mk({topic:'pythagoras',topicLabel:'نظرية فيثاغورس',problemText:t,
    problemHTML:R.pow(R.raw('أ'),2)+R.op('+')+R.pow(R.raw('ب'),2)+R.eq()+R.pow(R.raw('ج'),2),
    steps:steps,answerText:'الطول = '+(Math.round(val*100)/100),answerHTML:ans,answerValue:val,unit:'سم',practice:'pyth'});
}

/* ==================================================================
   13) sin_cos_tan
   ================================================================== */
var SPECIAL={0:{sin:'0',cos:'1',tan:'0'},30:{sin:'1/2',cos:'√3/2',tan:'√3/3'},
  45:{sin:'√2/2',cos:'√2/2',tan:'1'},60:{sin:'√3/2',cos:'1/2',tan:'√3'},90:{sin:'1',cos:'0',tan:'غير معرّفة'}};
function specialHTML(v){
  if(v==='غير معرّفة')return R.txt('غير معرّفة');
  if(v.charAt(0)==='√'){
    var parts=v.split('/'),rad=parts[0].slice(1);
    return parts[1]?R.frac(R.sqrt(R.raw(rad)),R.raw(parts[1])):R.sqrt(R.raw(rad));
  }
  if(v.indexOf('/')>0){var p=v.split('/');return R.frac(R.raw(p[0]),R.raw(p[1]))}
  return R.raw(v);
}
function solveTrig(t){
  var ang=t.match(/\b(sin|cos|tan)\s*\(?\s*(0|30|45|60|90)\s*\)?/i);
  if(ang){
    var fn=ang[1].toLowerCase(),dg=Number(ang[2]),v=SPECIAL[dg][fn];
    return mk({topic:'sin_cos_tan',topicLabel:'sin_cos_tan · زوايا خاصة',problemText:t,
      problemHTML:R.fn(fn,R.raw(dg)),
      steps:[st('نكتب المطلوب',R.fn(fn,R.raw(dg)),'الزاوية بالدرجات، وهذه من الزوايا الخاصة.'),
        st('نستعمل جدول الزوايا الخاصة',
          R.lbl(dg+'°')+R.lbl('sin')+specialHTML(SPECIAL[dg].sin)+R.sp()+
          R.lbl('cos')+specialHTML(SPECIAL[dg].cos)+R.sp()+R.lbl('tan')+specialHTML(SPECIAL[dg].tan)),
        st('النتيجة',R.fn(fn,R.raw(dg))+R.eq()+specialHTML(v))],
      answerText:fn+' '+dg+'° = '+v,answerHTML:specialHTML(v),practice:'trigAngle'});
  }
  var AB=labeled(t,['AB']),AC=labeled(t,['AC']),BC=labeled(t,['BC']);
  var angle=(t.match(/(?:الزاوية|زاوية)\s*([A-Za-z])/)||[])[1]||'B';
  if(AB===null||AC===null){
    var ns=nums(t);
    if(ns.length>=2){AB=ns[0];AC=ns[1];BC=ns[2]!==undefined?ns[2]:null}
  }
  if(AB===null||AC===null)
    throw new MError('اكتب ضلعي القائمة، مثل: sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5');
  var steps=[st('نحدّد المثلث القائم',R.txt('المثلث ABC قائم في A، والوتر هو [BC]'),
    'الوتر هو الضلع المقابل للزاوية القائمة.')];
  var bc;
  if(BC===null){
    var s=AB*AB+AC*AC,pf=KH.isPerfectSq(s);
    bc=pf!==null?F(pf):F(Math.sqrt(s));
    steps.push(st('نحسب الوتر بفيثاغورس',R.pow(R.raw('BC'),2)+R.eq()+R.pow(R.raw(AB),2)+R.op('+')+R.pow(R.raw(AC),2)+R.eq()+R.raw(s)),
      st('نأخذ الجذر',R.raw('BC')+R.eq()+R.num(bc)+(pf!==null?'':R.op('≈')+R.raw(bc.val().toFixed(3)))));
  }else bc=F(BC);
  var opp,adj;
  if(angle.toUpperCase()==='C'){opp=F(AB);adj=F(AC)}else{opp=F(AC);adj=F(AB)}
  steps.push(st('نعيّن المقابل والمجاور للزاوية '+angle,
    R.lbl('المقابل')+R.num(opp)+R.sp()+R.lbl('المجاور')+R.num(adj)+R.sp()+R.lbl('الوتر')+R.num(bc)));
  var sv=opp.div(bc),cv=adj.div(bc),tv=opp.div(adj);
  steps.push(st('sin = المقابل ÷ الوتر',R.fn('sin',R.vr(angle))+R.eq()+R.frac(R.num(opp),R.num(bc))+R.eq()+R.num(sv)));
  steps.push(st('cos = المجاور ÷ الوتر',R.fn('cos',R.vr(angle))+R.eq()+R.frac(R.num(adj),R.num(bc))+R.eq()+R.num(cv)));
  steps.push(st('tan = المقابل ÷ المجاور',R.fn('tan',R.vr(angle))+R.eq()+R.frac(R.num(opp),R.num(adj))+R.eq()+R.num(tv)));
  var one=sv.mul(sv).add(cv.mul(cv));
  return mk({topic:'sin_cos_tan',topicLabel:'sin_cos_tan · مثلث قائم',problemText:t,
    problemHTML:R.fn('sin',R.vr(angle))+R.sp()+R.fn('cos',R.vr(angle))+R.sp()+R.fn('tan',R.vr(angle)),
    steps:steps,answerText:'sin='+sv.txt()+' ، cos='+cv.txt()+' ، tan='+tv.txt(),
    answerHTML:R.lbl('sin')+R.num(sv)+R.sp()+R.lbl('cos')+R.num(cv)+R.sp()+R.lbl('tan')+R.num(tv),
    answerValue:sv.val(),
    check:{html:R.pow(R.fn('sin',R.vr(angle)),2)+R.op('+')+R.pow(R.fn('cos',R.vr(angle)),2)+R.eq()+R.num(one),
      note:'sin² + cos² = 1 ✔ وهذه العلاقة تتحقّق دائمًا.'},practice:'trigTri'});
}

/* ==================================================================
   14) الأشعة والمعالم
   ================================================================== */
function solveVector(t){
  var re=/([A-Za-z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,;،]\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  var pts=[],m;
  while((m=re.exec(t))!==null)pts.push({n:m[1],x:F(+m[2]),y:F(+m[3])});
  if(pts.length<2)throw new MError('اكتب نقطتين بإحداثياتهما، مثل: شعاع A(1,2) B(4,6)');
  var A=pts[0],B=pts[1],dx=B.x.sub(A.x),dy=B.y.sub(A.y);
  var mode=/منتصف/.test(t)?'mid':/مسافة|طول/.test(t)?'dist':'vec';
  var base=st('نكتب إحداثيات النقطتين',
    R.raw(A.n)+R.par(R.num(A.x)+R.op(',')+R.num(A.y))+R.sp()+
    R.raw(B.n)+R.par(R.num(B.x)+R.op(',')+R.num(B.y)),'في معلم متعامد ممنظم.');
  if(mode==='vec'){
    return mk({topic:'vector',topicLabel:'أشعة · إحداثيات شعاع',problemText:t,
      problemHTML:R.raw(A.n)+R.par(R.num(A.x)+R.op(',')+R.num(A.y))+R.sp()+R.raw(B.n)+R.par(R.num(B.x)+R.op(',')+R.num(B.y)),
      steps:[base,
        st('نطبّق القاعدة',R.lbl('إحداثيا الشعاع')+R.par(R.raw('x_B − x_A')+R.op(',')+R.raw('y_B − y_A')),
          'إحداثيا الشعاع = إحداثيات النهاية − إحداثيات البداية.'),
        st('نطرح الإحداثيات',R.par(R.num(B.x)+R.op('−')+R.par(R.num(A.x))+R.op(',')+R.num(B.y)+R.op('−')+R.par(R.num(A.y)))),
        st('النتيجة',R.lbl('شعاع '+A.n+B.n)+R.par(R.num(dx)+R.op(',')+R.num(dy)))],
      answerText:'('+dx.txt()+' , '+dy.txt()+')',answerHTML:R.par(R.num(dx)+R.op(',')+R.num(dy)),practice:'vector'});
  }
  if(mode==='mid'){
    var mx=A.x.add(B.x).div(F(2)),my=A.y.add(B.y).div(F(2));
    return mk({topic:'vector',topicLabel:'أشعة · منتصف قطعة',problemText:t,
      problemHTML:R.txt('منتصف ['+A.n+B.n+']'),
      steps:[base,
        st('قاعدة المنتصف',R.par(R.frac(R.raw('x_A + x_B'),R.raw(2))+R.op(',')+R.frac(R.raw('y_A + y_B'),R.raw(2))),
          'منتصف قطعة مستقيم = متوسط الإحداثيات.'),
        st('نجمع ثم نقسم',R.par(R.frac(R.num(A.x)+R.op('+')+R.num(B.x),R.raw(2))+R.op(',')+R.frac(R.num(A.y)+R.op('+')+R.num(B.y),R.raw(2)))),
        st('النتيجة',R.lbl('المنتصف I')+R.par(R.num(mx)+R.op(',')+R.num(my)))],
      answerText:'('+mx.txt()+' , '+my.txt()+')',answerHTML:R.par(R.num(mx)+R.op(',')+R.num(my)),practice:'midpoint'});
  }
  var s=dx.mul(dx).add(dy.mul(dy)),pf=KH.isPerfectSq(s.n);
  var dv=pf!==null?F(pf):F(Math.sqrt(s.val()));
  return mk({topic:'vector',topicLabel:'أشعة · مسافة',problemText:t,problemHTML:R.txt('المسافة '+A.n+B.n),
    steps:[base,
      st('قاعدة المسافة',R.raw(A.n+B.n)+R.eq()+R.sqrt(R.pow(R.par(R.raw('x_B − x_A')),2)+R.op('+')+R.pow(R.par(R.raw('y_B − y_A')),2)),
        'في معلم متعامد ممنظم تُطبَّق فيثاغورس.'),
      st('نعوّض',R.sqrt(R.pow(R.par(R.num(dx)),2)+R.op('+')+R.pow(R.par(R.num(dy)),2))),
      st('نربّع ثم نجمع',R.sqrt(R.num(dx.mul(dx))+R.op('+')+R.num(dy.mul(dy)))+R.eq()+R.sqrt(R.num(s))),
      st('النتيجة',R.raw(A.n+B.n)+R.eq()+(pf!==null?R.num(dv):R.sqrt(R.num(s)))+(pf!==null?'':R.op('≈')+R.raw(dv.val().toFixed(3))))],
    answerText:pf!==null?dv.txt():'√'+s.n,answerHTML:pf!==null?R.num(dv):R.sqrt(R.num(s)),
    answerValue:dv.val(),practice:'distance'});
}

/* ==================================================================
   15) الدوال: صورة وسابقة
   ================================================================== */
function solveFunction(t){
  var def=t.match(/([A-Za-z])\s*\(\s*([A-Za-z\u0621-\u064A])\s*\)\s*=\s*([^،;\n]+?)(?=\s+(?:احسب|أوجد|اوجد|جد|سابقة|صورة)|$)/);
  if(!def)throw new MError('اكتب الدالة هكذا: f(س)=2س+3 احسب f(4)');
  var fname=def[1],vn=def[2],body=def[3].trim();
  var ast=parse(toMath(body)),vs=KH.varsOf(ast);
  if(vs.size>1||(vs.size===1&&!vs.has(vn)))
    throw new MError('عبارة الدالة يجب أن تحوي المجهول «'+vn+'» فقط.');
  var pre=t.match(/سابقة\s*(?:العدد\s*)?(-?\d+(?:\.\d+)?)/);
  var img=t.match(new RegExp(fname+'\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)'));
  if(pre){
    var target=F(+pre[1]),P=toPoly(ast,vn,2),eqP=KH.psub(P,[target]);
    var steps=[st('نكتب الدالة',R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast)),
      st('نفهم المطلوب',R.txt('السابقة: نبحث عن قيمة المجهول التي صورتها '+target.txt()))];
    if(deg(eqP)!==1)throw new MError('السابقة لدالة غير خطية تحتاج معادلة من الدرجة الثانية؛ استعمل درس المعادلات.');
    var a=get(eqP,1),b=get(eqP,0);
    if(a.isZero())throw new MError('الدالة ثابتة: لا سابقة وحيدة.');
    var x=b.neg().div(a);
    steps.push(st('نضع العبارة مساوية للعدد',astHTML(ast)+R.eq()+R.num(target)),
      st('نطرح من الطرفين',terms([{c:a,deg:1}],vn)+R.eq()+R.num(target)+R.op('−')+R.num(get(P,0))+R.eq()+R.num(b.neg()),
        'نقلنا الحد الثابت إلى الطرف الآخر بعكس إشارته.'),
      st('نقسم على المعامل',R.vr(vn)+R.eq()+R.num(b.neg())+R.op('÷')+R.num(a)+R.eq()+R.num(x)));
    return mk({topic:'function',topicLabel:'دوال · سابقة',problemText:t,
      problemHTML:R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast),steps:steps,
      answerText:'سابقة '+target.txt()+' هي '+x.txt(),answerHTML:R.vr(vn)+R.eq()+R.num(x),answerValue:x.val(),
      check:{html:R.raw(fname)+R.par(R.num(x))+R.eq()+R.num(KH.pval(P,x)),note:'صورة الناتج تساوي العدد المطلوب ✔'},
      practice:'funcImg'});
  }
  if(!img)throw new MError('اكتب الصورة المطلوبة مثل: f(4)، أو «سابقة 11».');
  var xv=F(+img[1]),P2=toPoly(ast,vn,2),res=KH.pval(P2,xv);
  return mk({topic:'function',topicLabel:'دوال · صورة',problemText:t,
    problemHTML:R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast),
    steps:[st('نكتب الدالة',R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast)),
      st('نعوّض المجهول بالعدد',R.raw(fname)+R.par(R.num(xv))+R.eq()+subHTML(P2,vn,R.num(xv)),
        'الصورة = قيمة العبارة عند العدد المعطى.'),
      st('نضرب ثم نجمع',R.raw(fname)+R.par(R.num(xv))+R.eq()+R.num(res))],
    answerText:fname+'('+xv.txt()+') = '+res.txt(),
    answerHTML:R.raw(fname)+R.par(R.num(xv))+R.eq()+R.num(res),answerValue:res.val(),practice:'funcImg'});
}

/* ==================================================================
   16) الأشكال المستوية
   ================================================================== */
function solveGeometry(t){
  var want=/محيط/.test(t)?'per':'area';
  var unit=/متر/.test(t)?'م':'سم';
  var shapes=[{re:/شبه\s*منحرف/,n:'شبه منحرف'},{re:/متوازي\s*أضلاع|متوازي\s*اضلاع/,n:'متوازي أضلاع'},
    {re:/مستطيل/,n:'مستطيل'},{re:/مربع/,n:'مربع'},{re:/دائرة|دائره|قرص/,n:'دائرة'},{re:/مثلث/,n:'مثلث'}];
  var sh=null;for(var i=0;i<shapes.length;i++){if(shapes[i].re.test(t)){sh=shapes[i];break}}
  if(!sh)throw new MError('حدّد الشكل: مربع، مستطيل، مثلث، دائرة، متوازي أضلاع، شبه منحرف.');
  var ns=nums(t);if(!ns.length)throw new MError('اكتب الأبعاد، مثل: مساحة مستطيل طوله 8 وعرضه 5.');
  var L=labeled(t,['ال?طول(?:ه)?']),W=labeled(t,['ال?عرض(?:ه)?']),H=labeled(t,['ال?ارتفاع(?:ه)?']),
    Rr=labeled(t,['نصف\\s*ال?قطر(?:ها|ه)?']),D=labeled(t,['ال?قطر(?:ها|ه)?']),
    B=labeled(t,['ال?قاعدة']),S1=labeled(t,['ال?ضلع(?:ه)?']);
  var steps=[],val,u=unit,formula;
  function push(f,s,c,n){steps.push(st('نكتب القانون',f,n||''));steps.push(st('نعوّض',s));steps.push(st('نحسب',c))}
  function piFor(r){var u22=(r%7===0);return{pi:u22?F(22,7):F(157,50),
    t:u22?R.frac(R.raw(22),R.raw(7)):R.raw('3.14'),
    note:u22?'نأخذ π ≈ 22/7 لأن نصف القطر من مضاعفات 7.':'نأخذ π ≈ 3.14.'}}
  if(sh.n==='مربع'){
    var a=F(S1!==null?S1:ns[0]);
    if(want==='per'){formula=R.raw('P')+R.eq()+R.raw('4أ');val=a.mul(F(4));
      push(formula,R.raw('P')+R.eq()+R.raw('4')+R.op('×')+R.num(a),R.raw('P')+R.eq()+R.num(val))}
    else{formula=R.raw('A')+R.eq()+R.pow(R.raw('أ'),2);val=a.mul(a);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.pow(R.num(a),2),R.raw('A')+R.eq()+R.num(val))}
  }else if(sh.n==='مستطيل'){
    var l=F(L!==null?L:ns[0]),w=F(W!==null?W:(ns[1]!==undefined?ns[1]:ns[0]));
    if(want==='per'){formula=R.raw('P')+R.eq()+R.raw('2(ل + ع)');val=l.add(w).mul(F(2));
      push(formula,R.raw('P')+R.eq()+R.raw('2')+R.par(R.num(l)+R.op('+')+R.num(w)),
        R.raw('P')+R.eq()+R.raw('2')+R.op('×')+R.num(l.add(w))+R.eq()+R.num(val))}
    else{formula=R.raw('A')+R.eq()+R.raw('ل × ع');val=l.mul(w);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.num(l)+R.op('×')+R.num(w),R.raw('A')+R.eq()+R.num(val))}
  }else if(sh.n==='مثلث'){
    if(want==='per'&&ns.length>=3){
      val=F(ns[0]).add(F(ns[1])).add(F(ns[2]));
      push(R.raw('P')+R.eq()+R.raw('أ + ب + ج'),
        R.raw('P')+R.eq()+R.raw(ns[0])+R.op('+')+R.raw(ns[1])+R.op('+')+R.raw(ns[2]),R.raw('P')+R.eq()+R.num(val));
    }else{
      var b=F(B!==null?B:ns[0]),h=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0]));
      val=b.mul(h).div(F(2));u=unit+'²';
      push(R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.op('×')+R.raw('القاعدة')+R.op('×')+R.raw('الارتفاع'),
        R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.op('×')+R.num(b)+R.op('×')+R.num(h),
        R.raw('A')+R.eq()+R.frac(R.num(b.mul(h)),R.raw(2))+R.eq()+R.num(val),
        'الارتفاع عمودي على القاعدة وليس الضلع المائل.');
    }
  }else if(sh.n==='دائرة'){
    var r=Rr!==null?F(Rr):(D!==null?F(D).div(F(2)):F(ns[0]));
    if(D!==null&&Rr===null)steps.push(st('نوجد نصف القطر',R.raw('r')+R.eq()+R.frac(R.raw('d'),R.raw(2))+R.eq()+R.num(r)));
    var P=piFor(r.val());
    if(want==='per'){formula=R.raw('C')+R.eq()+R.raw('2πr');val=F(2).mul(P.pi).mul(r);
      push(formula,R.raw('C')+R.eq()+R.raw('2')+R.op('×')+P.t+R.op('×')+R.num(r),R.raw('C')+R.eq()+R.num(val),P.note)}
    else{formula=R.raw('A')+R.eq()+R.raw('πr²');val=P.pi.mul(r).mul(r);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+P.t+R.op('×')+R.pow(R.num(r),2),R.raw('A')+R.eq()+R.num(val),P.note)}
  }else if(sh.n==='متوازي أضلاع'){
    var b2=F(B!==null?B:ns[0]),h2=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0]));
    if(want==='per'){val=b2.add(h2).mul(F(2));
      push(R.raw('P')+R.eq()+R.raw('2(أ + ب)'),R.raw('P')+R.eq()+R.raw('2')+R.par(R.num(b2)+R.op('+')+R.num(h2)),R.raw('P')+R.eq()+R.num(val))}
    else{val=b2.mul(h2);u=unit+'²';
      push(R.raw('A')+R.eq()+R.raw('القاعدة × الارتفاع'),R.raw('A')+R.eq()+R.num(b2)+R.op('×')+R.num(h2),R.raw('A')+R.eq()+R.num(val))}
  }else{
    var b1=F(ns[0]),bb2=F(ns[1]!==undefined?ns[1]:ns[0]),hh=F(H!==null?H:(ns[2]!==undefined?ns[2]:ns[0]));
    val=b1.add(bb2).mul(hh).div(F(2));u=unit+'²';
    push(R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.par(R.raw('ب₁ + ب₂'))+R.raw('هـ'),
      R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.par(R.num(b1)+R.op('+')+R.num(bb2))+R.op('×')+R.num(hh),
      R.raw('A')+R.eq()+R.num(val));
  }
  steps.push(st(want==='per'?'المحيط':'المساحة',R.num(val),'الوحدة: '+u));
  return mk({topic:'geometry',topicLabel:'مستويات · '+sh.n,problemText:t,problemHTML:formula,steps:steps,
    answerText:val.txt()+' '+u,answerHTML:R.num(val),answerValue:val.val(),unit:u,practice:'geom'});
}

/* ==================================================================
   17) المجسمات
   ================================================================== */
function solveSolid(t){
  var want=/مساحة/.test(t)?'area':'vol';
  var unit=/متر/.test(t)?'م':'سم';
  var ns=nums(t);if(!ns.length)throw new MError('اكتب الأبعاد، مثل: حجم مخروط نصف قطره 3 وارتفاعه 4.');
  var Rr=labeled(t,['نصف\\s*ال?قطر(?:ها|ه)?']),H=labeled(t,['ال?ارتفاع(?:ه)?']),
    B=labeled(t,['مساحة\\s*ال?قاعدة','ال?قاعدة']),S1=labeled(t,['ال?ضلع(?:ه)?']),
    L=labeled(t,['ال?طول(?:ه)?']),W=labeled(t,['ال?عرض(?:ه)?']);
  function piFor(r){var u22=(r%7===0);return{pi:u22?F(22,7):F(157,50),
    t:u22?R.frac(R.raw(22),R.raw(7)):R.raw('3.14'),note:u22?'نأخذ π ≈ 22/7.':'نأخذ π ≈ 3.14.'}}
  var steps=[],val,u,formula,name;
  function push(f,s,c,n){steps.push(st('نكتب القانون',f,n||''));steps.push(st('نعوّض',s));steps.push(st('نحسب',c))}
  if(/كرة|كره/.test(t)){
    name='كرة';var r=F(Rr!==null?Rr:ns[0]),P=piFor(r.val());
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('4πr²');val=F(4).mul(P.pi).mul(r).mul(r);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('4')+R.op('×')+P.t+R.op('×')+R.pow(R.num(r),2),R.raw('A')+R.eq()+R.num(val),P.note)}
    else{formula=R.raw('V')+R.eq()+R.frac(R.raw('4'),R.raw(3))+R.raw('πr³');
      val=F(4).div(F(3)).mul(P.pi).mul(r).mul(r).mul(r);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+R.frac(R.raw('4'),R.raw(3))+R.op('×')+P.t+R.op('×')+R.pow(R.num(r),3),R.raw('V')+R.eq()+R.num(val),P.note)}
  }else if(/مخروط/.test(t)){
    name='مخروط دوراني';
    var r2=F(Rr!==null?Rr:ns[0]),h2=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0])),P2=piFor(r2.val());
    formula=R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.raw('πr²هـ');
    val=F(1).div(F(3)).mul(P2.pi).mul(r2).mul(r2).mul(h2);u=unit+'³';
    push(formula,R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.op('×')+P2.t+R.op('×')+R.pow(R.num(r2),2)+R.op('×')+R.num(h2),
      R.raw('V')+R.eq()+R.num(val),'حجم المخروط ثلث حجم الأسطوانة التي لها القاعدة والارتفاع نفسه.');
  }else if(/هرم/.test(t)){
    name='هرم';var bb=F(B!==null?B:ns[0]),hh=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0]));
    formula=R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.raw('مساحة القاعدة × الارتفاع');
    val=bb.mul(hh).div(F(3));u=unit+'³';
    push(formula,R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.op('×')+R.num(bb)+R.op('×')+R.num(hh),
      R.raw('V')+R.eq()+R.num(val),'مساحة القاعدة معطاة مباشرة.');
  }else if(/أسطوانة|اسطوانة/.test(t)){
    name='أسطوانة دورانية';
    var r3=F(Rr!==null?Rr:ns[0]),h3=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0])),P3=piFor(r3.val());
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('2πr(ر + هـ)');
      val=F(2).mul(P3.pi).mul(r3).mul(r3.add(h3));u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('2')+R.op('×')+P3.t+R.op('×')+R.num(r3)+R.par(R.num(r3)+R.op('+')+R.num(h3)),
        R.raw('A')+R.eq()+R.num(val),P3.note)}
    else{formula=R.raw('V')+R.eq()+R.raw('πr²هـ');val=P3.pi.mul(r3).mul(r3).mul(h3);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+P3.t+R.op('×')+R.pow(R.num(r3),2)+R.op('×')+R.num(h3),R.raw('V')+R.eq()+R.num(val),P3.note)}
  }else if(/مكعب/.test(t)){
    name='مكعب';var a=F(S1!==null?S1:ns[0]);
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('6أ²');val=a.mul(a).mul(F(6));u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('6')+R.op('×')+R.pow(R.num(a),2),R.raw('A')+R.eq()+R.num(val))}
    else{formula=R.raw('V')+R.eq()+R.raw('أ³');val=a.pow(3);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+R.pow(R.num(a),3),R.raw('V')+R.eq()+R.num(val))}
  }else{
    name='متوازي مستطيلات';
    var l=F(L!==null?L:ns[0]),w=F(W!==null?W:(ns[1]!==undefined?ns[1]:ns[0])),h=F(H!==null?H:(ns[2]!==undefined?ns[2]:ns[0]));
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('2(لع + لهـ + عهـ)');
      val=l.mul(w).add(l.mul(h)).add(w.mul(h)).mul(F(2));u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('2')+R.par(R.num(l.mul(w))+R.op('+')+R.num(l.mul(h))+R.op('+')+R.num(w.mul(h))),
        R.raw('A')+R.eq()+R.num(val))}
    else{formula=R.raw('V')+R.eq()+R.raw('ل × ع × هـ');val=l.mul(w).mul(h);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+R.num(l)+R.op('×')+R.num(w)+R.op('×')+R.num(h),R.raw('V')+R.eq()+R.num(val))}
  }
  steps.push(st(want==='area'?'المساحة الكلية':'الحجم',R.num(val),'الوحدة: '+u));
  return mk({topic:'solid',topicLabel:'مجسمات · '+name,problemText:t,problemHTML:formula,steps:steps,
    answerText:val.txt()+' '+u,answerHTML:R.num(val),answerValue:val.val(),unit:u,practice:'solid'});
}

/* ==================================================================
   18) الإحصاء
   ================================================================== */
function solveStats(t){
  var ns=nums(t);
  if(ns.length<2)throw new MError('اكتب سلسلة أعداد، مثل: المتوسط الحسابي لـ 4، 8، 6، 10.');
  var list=ns.map(function(v){return F(v)});
  var sorted=list.slice().sort(function(a,b){return a.val()-b.val()});
  var sum=list.reduce(function(a,b){return a.add(b)},F0),mean=sum.div(F(list.length));
  var mid=Math.floor(sorted.length/2);
  var median=sorted.length%2?sorted[mid]:sorted[mid-1].add(sorted[mid]).div(F(2));
  var freq={};list.forEach(function(v){freq[v.txt()]=(freq[v.txt()]||0)+1});
  var maxF=Math.max.apply(null,Object.keys(freq).map(function(k){return freq[k]}));
  var modes=Object.keys(freq).filter(function(k){return freq[k]===maxF});
  var modeTxt=maxF===1?'لا يوجد منوال':modes.join(' ، ');
  var modeHTML=modes.map(function(m){var p=m.split('/');return p[1]?R.frac(R.raw(p[0]),R.raw(p[1])):R.raw(p[0])}).join(R.op(','));
  var range=sorted[sorted.length-1].sub(sorted[0]);
  var steps=[st('نرتّب السلسلة تصاعديًا',sorted.map(function(v){return R.num(v)}).join(R.op(',')),'الترتيب ضروري للوسيط والمدى.'),
    st('نجمع القيم',list.map(function(v){return R.num(v)}).join(R.op('+'))+R.eq()+R.num(sum)),
    st('المتوسط الحسابي',R.raw('x̄')+R.eq()+R.frac(R.num(sum),R.raw(list.length))+R.eq()+R.num(mean),'المجموع ÷ عدد القيم.'),
    st('الوسيط',R.num(median),sorted.length%2?'عدد القيم فردي: الوسيط هو القيمة الوسطى.':'عدد القيم زوجي: الوسيط متوسط القيمتين الوسطيتين.'),
    st('المنوال',maxF===1?R.txt('لا يوجد'):modeHTML,maxF===1?'كل قيمة تكرّرت مرة واحدة.':'القيمة الأكثر تكرارًا ('+maxF+' مرة).'),
    st('المدى',R.num(sorted[sorted.length-1])+R.op('−')+R.num(sorted[0])+R.eq()+R.num(range),'أكبر قيمة − أصغر قيمة.')];
  var want=/وسيط/.test(t)?median:/منوال/.test(t)?(maxF===1?null:F(Number(modes[0]))):/مدى/.test(t)?range:mean;
  var wl=/وسيط/.test(t)?'الوسيط':/منوال/.test(t)?'المنوال':/مدى/.test(t)?'المدى':'المتوسط الحسابي';
  return mk({topic:'stats',topicLabel:'إحصاء',problemText:t,problemHTML:R.raw('x̄')+R.eq()+R.frac(R.raw('Σx'),R.raw('n')),
    steps:steps,answerText:wl+': '+(want?want.txt():modeTxt),answerHTML:want?R.num(want):R.txt(modeTxt),
    answerValue:want?want.val():null,practice:'stats'});
}

/* ==================================================================
   19) الموجّه — لا يمرّر علامة = إلى المحلّل النحوي إطلاقًا
   ================================================================== */
KH.solveProblem=function(text){
  var raw=String(text==null?'':text);
  var t=normDigits(raw).replace(/\u0640/g,'');
  if(!t)throw new MError('اكتب مسألة أولًا، أو اختر قالبًا جاهزًا.');
  try{
    var eqCount=(t.match(/=/g)||[]).length;
    if(eqCount>=2&&/[;؛\n]/.test(raw))return solveSystem(t);
    if(/طاليس|thales/i.test(t))return solveThales(t);
    if(/\b(sin|cos|tan)\b|نسب مثلثية|مثلثية/i.test(t))return solveTrig(t);
    if(/منتصف|مسافة|شعاع|إحداثي|احداثي/.test(t)&&/\(\s*-?\d/.test(t))return solveVector(t);
    if(/سابقة|صورة/.test(t)||/[A-Za-z]\s*\(\s*[A-Za-z\u0621-\u064A]\s*\)\s*=/.test(t))return solveFunction(t);
    if(/حلل|تحليل/.test(t))return solveFactor(t);
    if(/انشر|وسّع|وسع|متطابقة/.test(t))return solveExpand(t);

    var runs=mathRuns(t);
    var ineq=bestRun(runs,function(r){return r.rel&&r.rel.v!=='='&&r.vars.length>0});
    if(ineq)return solveInequality(t);
    var eq=bestRun(runs,function(r){return r.rel&&r.rel.v==='='&&r.vars.length>0});
    if(eq)return solveEquation(t);

    if(/حجم|مساحة\s*(?:السطح|الكلية)|كرة|مخروط|هرم|أسطوانة|اسطوانة|مكعب|متوازي مستطيلات/.test(t))return solveSolid(t);
    if(/مساحة|محيط/.test(t))return solveGeometry(t);
    if(/فيثاغورس|قائم|الوتر/.test(t))return solvePyth(t);
    if(/%|٪|مئوية|المائة/.test(t))return solvePercent(t);
    if(/متوسط|وسيط|منوال|مدى|إحصاء|احصاء/.test(t))return solveStats(t);
    if(/√|جذر/.test(t)&&!bestRun(runs,function(r){return r.vars.length>0}))return solveRadical(t);

    var poly=bestRun(runs,function(r){return !r.rel&&r.vars.length>0});
    if(poly)return solveExpand(t);
    return solveArithmetic(t);
  }catch(e){
    if(e&&e.name==='MError')throw e;
    throw new MError('تعذّر تحليل المسألة: '+(e&&e.message?e.message:'صيغة غير مفهومة'));
  }
};

/* ==================================================================
   20) مولّدات التمارين
   ================================================================== */
var ri=KH.ri,pick=KH.pick;
KH.gen={
  linear:function(){
    var a=ri(2,9),x=ri(-6,12),b=ri(-12,12),r=a*x+b,v=pick(['س','ص','ع','n','y']);
    return{text:a+v+' '+(b>=0?'+':'-')+' '+Math.abs(b)+' = '+r,value:x,ask:'ما قيمة '+v+'؟'}},
  quad:function(){
    var p=ri(-6,6),q=ri(-6,6),b=-(p+q),c=p*q;
    return{text:'س^2 '+(b>=0?'+':'-')+' '+Math.abs(b)+'س '+(c>=0?'+':'-')+' '+Math.abs(c)+' = 0',
      value:p,ask:'اكتب أحد جذري المعادلة.'}},
  system:function(){
    var x=ri(-4,6),y=ri(-4,6),a1=ri(1,5),b1=ri(1,5),a2=ri(1,5),b2=ri(1,5);
    if(a1*b2===a2*b1)b2+=1;
    return{text:a1+'س + '+b1+'ص = '+(a1*x+b1*y)+' ؛ '+a2+'س - '+b2+'ص = '+(a2*x-b2*y),
      value:x,ask:'ما قيمة س؟'}},
  expand:function(){var a=ri(1,6),b=ri(1,6);
    return{text:'انشر (س+'+a+')(س+'+b+')',value:a*b,ask:'ما الحد الثابت بعد النشر؟'}},
  factor:function(){var p=ri(1,6),q=ri(1,6);
    return{text:'حلل س^2 + '+(p+q)+'س + '+(p*q),value:p,ask:'اكتب أحد العددين في التحليل.'}},
  radical:function(){var k=ri(2,6),m=pick([2,3,5,6,7]);
    return{text:'√'+(k*k*m),value:Math.sqrt(k*k*m),coeff:k,ask:'ما العدد الخارج خارج الجذر؟'}},
  arith:function(){var a=ri(2,12),b=ri(2,9),c=ri(2,9);
    return{text:a+' + '+b+' × '+c+' - '+ri(1,9),value:0,ask:'كم الناتج؟ (انتبه لترتيب العمليات)',
      fix:function(){this.value=Number(this.text.split('-')[1].trim());
        this.value=(a+b*c)-this.value;return this}}.fix()},
  percent:function(){var p=pick([5,10,15,20,25,40,50,75]),n=ri(2,12)*20;
    return{text:p+'% من '+n,value:p*n/100,ask:'كم الناتج؟'}},
  pyth:function(){var t=pick([[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17],[7,24,25]]);
    return{text:'مثلث قائم ضلعاه '+t[0]+' و '+t[1],value:t[2],ask:'كم طول الوتر؟'}},
  thales:function(){var k=ri(2,4),am=ri(2,5),an=ri(2,5);
    return{text:'طاليس AM='+am+' AB='+(am*k)+' AN='+an,value:an*k,ask:'ما طول AC؟'}},
  vector:function(){var ax=ri(-5,5),ay=ri(-5,5),bx=ri(-5,5),by=ri(-5,5);
    return{text:'شعاع A('+ax+','+ay+') B('+bx+','+by+')',value:bx-ax,ask:'ما الإحداثي السيني للشعاع AB؟'}},
  midpoint:function(){var ax=ri(-5,5),bx=ri(-5,5),ay=ri(-5,5),by=ri(-5,5);
    return{text:'منتصف A('+ax+','+ay+') B('+bx+','+by+')',value:(ax+bx)/2,ask:'ما الإحداثي السيني للمنتصف؟'}},
  distance:function(){var t=pick([[0,0,3,4],[1,1,4,5],[0,0,6,8],[-2,-1,1,3]]);
    return{text:'مسافة A('+t[0]+','+t[1]+') B('+t[2]+','+t[3]+')',
      value:Math.hypot(t[2]-t[0],t[3]-t[1]),ask:'كم المسافة AB؟'}},
  funcImg:function(){var a=ri(2,6),b=ri(-6,6),x=ri(-4,6);
    return{text:'f(س)='+a+'س'+(b>=0?'+':'-')+Math.abs(b)+' احسب f('+x+')',value:a*x+b,ask:'ما صورة العدد '+x+'؟'}},
  trigAngle:function(){
    var ang=pick([30,45,60]),fn=pick(['sin','cos','tan']);
    var vals={'sin30':0.5,'cos30':Math.sqrt(3)/2,'tan30':Math.sqrt(3)/3,'sin45':Math.SQRT1_2,
      'cos45':Math.SQRT1_2,'tan45':1,'sin60':Math.sqrt(3)/2,'cos60':0.5,'tan60':Math.sqrt(3)};
    return{text:fn+' '+ang,value:vals[fn+ang],ask:'اكتب القيمة عشريًا لأقرب جزء من مئة.',tol:0.01}},
  trigTri:function(){var t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17]]);
    return{text:'sin_cos_tan مثلث قائم في A: AB='+t[0]+', AC='+t[1]+', BC='+t[2],
      value:t[1]/t[2],ask:'ما قيمة sin B؟ (كسر أو عشري)',tol:0.01}},
  geom:function(){var l=ri(3,16),w=ri(3,14);
    return{text:'مساحة مستطيل طوله '+l+' وعرضه '+w,value:l*w,ask:'كم المساحة؟'}},
  solid:function(){var r=ri(2,6),h=ri(3,9);
    return{text:'حجم أسطوانة نصف قطرها '+r+' وارتفاعها '+h,value:Math.PI*r*r*h,
      ask:'كم الحجم؟ (π≈3.14 لأقرب عدد صحيح)',tol:2}},
  stats:function(){var arr=[];for(var i=0;i<4;i++)arr.push(ri(2,20));
    return{text:'المتوسط الحسابي لـ '+arr.join('، '),value:arr.reduce(function(a,b){return a+b},0)/4,
      ask:'كم المتوسط الحسابي؟'}}
};
})();
