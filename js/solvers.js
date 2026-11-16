/* js/solvers.js — محرّك المسائل: منهاج الثالث الإعدادي السوري، بأي مجهول */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var F=KH.F,F0=KH.F0,F1=KH.F1,R=KH.R,MError=KH.MError;
var parse=KH.parse,toPoly=KH.toPoly,deg=KH.deg,get=KH.get,polyHTML=KH.polyHTML,
    subHTML=KH.subHTML,astHTML=KH.astHTML,st=KH.st,terms=KH.terms,
    nums=KH.nums,labeled=KH.labeled,normDigits=KH.normDigits,longestRun=KH.longestRun;
var MATHCH='0-9A-Za-z\\u0621-\\u064A+\\-*/^().\\s';

function mk(o){
  o.id='s'+Date.now()+Math.random().toString(36).slice(2,6);
  o.steps=o.steps||[];o.check=o.check||null;o.unit=o.unit||'';o.created=Date.now();
  o.answerHTML=o.answerHTML||R.txt(o.answerText||'');
  return o;
}
function toMath(s){return String(s).replace(/\s+/g,'')}
function stripWords(s){return s.replace(/حل المعادلة|حل المتراجحة|أوجد|اوجد|احسب|قيمة|حل/g,' ')}

/* ============ 1) معادلة خطية بأي مجهول ============ */
function solveEquation(t){
  var re=new RegExp('['+MATHCH+']*=['+MATHCH+']*');
  var raw=(t.match(re)||[''])[0].trim();
  var parts=raw.split('=');
  if(parts.length!==2)throw new MError('اكتب معادلة بعلامة = واحدة، مثل: 3س + 7 = 22');
  var la=parse(toMath(parts[0])),ra=parse(toMath(parts[1]));
  var vs=new Set();KH.varsOf(la,vs);KH.varsOf(ra,vs);
  if(vs.size===0)throw new MError('لا يوجد مجهول في المعادلة. اكتب مثل: 3س + 7 = 22');
  if(vs.size>1)throw new MError('ظهر أكثر من مجهول ('+Array.from(vs).join('، ')+'). لحل جملة معادلتين افصل بينهما بـ ؛');
  var vn=Array.from(vs)[0];
  var L=toPoly(la,vn),Rr=toPoly(ra,vn),P=KH.psub(L,Rr);
  if(deg(P)===2)return solveQuadratic(t,L,Rr,P,la,ra,vn);
  var l1=get(L,1),l0=get(L,0),r1=get(Rr,1),r0=get(Rr,0);
  var steps=[st('نكتب المعادلة',astHTML(la)+R.eq()+astHTML(ra),'الهدف: عزل المجهول «'+vn+'» في طرف والأعداد في الطرف الآخر.')];
  if(/\(/.test(raw))steps.push(st('نفكّ الأقواس ونرتّب',polyHTML(L,vn)+R.eq()+polyHTML(Rr,vn),'خاصية التوزيع: أ(ب + ج) = أ×ب + أ×ج.'));
  var a=l1.sub(r1),b=r0.sub(l0);
  if(!r1.isZero()||!l0.isZero()){
    steps.push(st('ننقل حدود المجهول لطرف والأعداد لطرف',
      terms([{c:l1,deg:1},{c:r1.neg(),deg:1}],vn)+R.eq()+terms([{c:r0,deg:0},{c:l0.neg(),deg:0}],vn),
      'عند نقل حدّ إلى الطرف الآخر نعكس إشارته.'));
    steps.push(st('نجمّع الحدود المتشابهة',terms([{c:a,deg:1}],vn)+R.eq()+R.num(b)));
  }
  if(a.isZero()){
    var inf=b.isZero();
    steps.push(st(inf?'متطابقة':'مستحيلة',R.raw('0')+R.eq()+R.num(b),
      inf?'الطرفان متطابقان مهما كانت قيمة المجهول: عدد لا نهائي من الحلول.':'وصلنا إلى عبارة خاطئة: لا حل للمعادلة.'));
    return mk({topic:'equation',topicLabel:'معادلة · الدرجة الأولى',problemText:t,
      problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
      answerText:inf?'كل عدد حقيقي':'لا يوجد حل',answerHTML:R.txt(inf?'ℝ':'∅'),practice:'linear'});
  }
  var x=b.div(a);
  if(!(a.n===1&&a.d===1))
    steps.push(st('نقسم الطرفين على معامل المجهول',R.vr(vn)+R.eq()+R.num(b)+R.op('÷')+R.num(a),
      a.isInt()?'نقسم على '+a.txt()+'.':'القسمة على كسر = الضرب في مقلوبه.'));
  steps.push(st('قيمة المجهول',R.vr(vn)+R.eq()+R.num(x)));
  var lv=KH.pval(L,x),rv=KH.pval(Rr,x);
  return mk({topic:'equation',topicLabel:'معادلة · الدرجة الأولى',problemText:t,
    problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,
    answerText:vn+' = '+x.txt(),answerHTML:R.vr(vn)+R.eq()+R.num(x),answerValue:x.val(),
    check:{html:subHTML(L,vn,R.num(x))+R.eq()+R.num(lv)+R.sp()+subHTML(Rr,vn,R.num(x))+R.eq()+R.num(rv),
      note:'عوّضنا عن «'+vn+'» بالقيمة في الطرفين فتساويا ✔ الحل صحيح.'},
    practice:'linear'});
}
/* ============ 2) معادلة الدرجة الثانية ============ */
function solveQuadratic(t,L,Rr,P,la,ra,vn){
  var a=get(P,2),b=get(P,1),c=get(P,0);
  var steps=[st('نكتب المعادلة',astHTML(la)+R.eq()+astHTML(ra)),
    st('نرتّبها على الشكل أ'+vn+'² + ب'+vn+' + ج = 0',polyHTML(P,vn)+R.eq()+R.raw('0'),'ننقل كل الحدود إلى طرف واحد.'),
    st('نحدّد المعاملات',R.lbl('أ')+R.num(a)+R.sp()+R.lbl('ب')+R.num(b)+R.sp()+R.lbl('ج')+R.num(c))];
  var D=b.mul(b).sub(F(4).mul(a).mul(c));
  steps.push(st('نحسب المميّز Δ',R.raw('Δ')+R.eq()+R.pow(R.vr('ب'),2)+R.op('−')+R.raw('4')+R.op('×')+R.vr('أ')+R.op('×')+R.vr('ج')+R.eq()+R.num(D),'إشارة Δ تحدّد عدد الحلول.'));
  if(D.n<0){
    steps.push(st('لا حل حقيقي',R.raw('Δ < 0'),'المميّز سالب: لا حلول في ℝ.'));
    return mk({topic:'quadratic',topicLabel:'معادلة · الدرجة الثانية',problemText:t,
      problemHTML:astHTML(la)+R.eq()+astHTML(ra),steps:steps,answerText:'لا يوجد حل حقيقي',answerHTML:R.txt('∅'),practice:'quad'});
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
    steps.push(st('القانون العام',R.vr(vn)+R.eq()+R.frac(R.op('−')+R.vr('ب')+R.op('±')+R.sqrt(R.raw('Δ')),R.raw('2')+R.vr('أ'))+R.eq()+
      R.frac(R.num(b.neg())+R.op('±')+R.num(s),R.num(F(2).mul(a)))));
  }else{
    var dv=D.val();
    x1=F((-b.val()+Math.sqrt(dv))/(2*a.val()));x2=F((-b.val()-Math.sqrt(dv))/(2*a.val()));
    steps.push(st('القانون العام',R.vr(vn)+R.eq()+R.frac(R.op('−')+R.vr('ب')+R.op('±')+R.sqrt(R.raw('Δ')),R.raw('2')+R.vr('أ')),'Δ ليس مربعًا كاملًا: نقرّب عشريًا.'));
    steps.push(st('التقريب',R.vr(vn)+R.raw('₁')+R.op('≈')+R.raw(x1.val().toFixed(3))+R.sp()+R.vr(vn)+R.raw('₂')+R.op('≈')+R.raw(x2.val().toFixed(3))));
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
/* ============ 3) جملة معادلتين بمجهولين ============ */
function solveSystem(t){
  var chunks=t.split(/[;؛\n]+/).map(function(s){return s.trim()}).filter(function(s){return s.indexOf('=')>=0});
  if(chunks.length!==2)throw new MError('اكتب معادلتين مفصولتين بـ ؛ مثل: 2س + 3ص = 12 ؛ س - ص = 1');
  var eqs=chunks.map(function(c){
    var re=new RegExp('['+MATHCH+']*=['+MATHCH+']*');
    var raw=(c.match(re)||[''])[0].trim().split('=');
    if(raw.length!==2)throw new MError('كل معادلة يجب أن تحوي علامة = واحدة.');
    return{la:parse(toMath(raw[0])),ra:parse(toMath(raw[1])),raw:raw};
  });
  var vs=new Set();eqs.forEach(function(e){KH.varsOf(e.la,vs);KH.varsOf(e.ra,vs)});
  if(vs.size!==2)throw new MError('الجملة تحتاج مجهولين مختلفين exactly. وجدنا: '+(Array.from(vs).join('، ')||'لا شيء'));
  var names=Array.from(vs),X=names[0],Y=names[1];
  function coeffs(e,vn){
    var L=toPoly(e.la,vn,1),Rr=toPoly(e.ra,vn,1);
    return{a:get(L,1).sub(get(Rr,1)),c:get(Rr,0).sub(get(L,0))};
  }
  function coeffsOther(e,vn,other){
    var saveOther=other;
    var La=KH.cloneAST(e.la),Ra=KH.cloneAST(e.ra);
    function zero(n){if(n.t==='var'&&n.name===saveOther)return{t:'num',v:F0};
      if(n.a)return Object.assign({},n,{a:zero(n.a)});
      if(n.l)return Object.assign({},n,{l:zero(n.l),r:zero(n.r)});return n;}
    function keep(n){if(n.t==='var'&&n.name===vn)return{t:'var',name:vn};return n;}
    var L=toPoly(zero(La),vn,1),Rr=toPoly(zero(Ra),vn,1);
    var b=get(L,1).sub(get(Rr,1));
    var L0=toPoly(zero(keep(La)),vn,1);
    return{b:b};
  }
  function fullCoeffs(e){
    var La=e.la,Ra=e.ra;
    function pick(n,target){
      if(n.t==='num')return F0;
      if(n.t==='var')return n.name===target?F1:F0;
      if(n.t==='par')return pick(n.a,target);
      if(n.t==='neg')return pick(n.a,target).neg();
      if(n.t==='bin'){
        var A=pick(n.l,target),B=pick(n.r,target);
        if(n.op==='+')return A.add(B);
        if(n.op==='-')return A.sub(B);
        if(n.op==='*'){
          var cl=constOf(n.l),cr=constOf(n.r);
          if(cl!==null)return cl.mul(B);
          if(cr!==null)return cr.mul(A);
          throw new MError('جداء مجهولين غير مدعوم في الجملة الخطية.');
        }
        if(n.op==='/'){var cr2=constOf(n.r);if(cr2===null)throw new MError('قسمة على مجهول غير مدعومة.');return A.div(cr2)}
        throw new MError('أس غير مدعوم في الجملة الخطية.');
      }
      throw new MError('تعذّر تحليل الجملة.');
    }
    function constOf(n){
      try{var p=toPoly(n,X,0);return deg(p)===0?p[0]:null}catch(e){return null}
    }
    var ax=pick(La,X).sub(pick(Ra,X));
    var by=pick(La,Y).sub(pick(Ra,Y));
    var cc=pick(Ra,'').sub(pick(La,''));
    return{a:ax,b:by,c:cc};
  }
  var e1=fullCoeffs(eqs[0]),e2=fullCoeffs(eqs[1]);
  var steps=[st('نكتب الجملة',
    R.lbl('(1)')+terms([{c:e1.a,deg:1}],X)+R.op('+')+terms([{c:e1.b,deg:1}],Y)+R.eq()+R.num(e1.c)+R.sp()+
    R.lbl('(2)')+terms([{c:e2.a,deg:1}],X)+R.op('+')+terms([{c:e2.b,deg:1}],Y)+R.eq()+R.num(e2.c),
    'سنستعمل طريقة الحذف: نجعل معاملي أحد المجهولين متساويين ثم نطرح.')];
  var D=e1.a.mul(e2.b).sub(e2.a.mul(e1.b));
  if(D.isZero()){
    var consistent=e1.c.mul(e2.b).sub(e2.c.mul(e1.b)).isZero();
    steps.push(st('المحدّد معدوم',R.raw('Δ')+R.eq()+R.num(e1.a)+R.op('×')+R.num(e2.b)+R.op('−')+R.num(e2.a)+R.op('×')+R.num(e1.b)+R.eq()+R.raw('0'),
      consistent?'المعادلتان متكافئتان: عدد لا نهائي من الحلول (مستقيم واحد).':'المستقيمان متوازيان ومتمايزان: لا حل للجملة.'));
    return mk({topic:'system',topicLabel:'جملة معادلتين',problemText:t,
      problemHTML:terms([{c:e1.a,deg:1}],X)+R.op('+')+terms([{c:e1.b,deg:1}],Y)+R.eq()+R.num(e1.c),
      steps:steps,answerText:consistent?'عدد لا نهائي من الحلول':'لا يوجد حل',answerHTML:R.txt(consistent?'∞':'∅'),practice:'system'});
  }
  var m1=e2.b.abs(),m2=e1.b.abs();
  steps.push(st('نوحّد معامل '+Y,
    R.lbl('(1)×'+m1.txt())+terms([{c:e1.a.mul(m1),deg:1}],X)+R.op('+')+terms([{c:e1.b.mul(m1),deg:1}],Y)+R.eq()+R.num(e1.c.mul(m1))+R.sp()+
    R.lbl('(2)×'+m2.txt())+terms([{c:e2.a.mul(m2),deg:1}],X)+R.op('+')+terms([{c:e2.b.mul(m2),deg:1}],Y)+R.eq()+R.num(e2.c.mul(m2)),
    'نضرب (1) في '+m1.txt()+' و(2) في '+m2.txt()+' ليصبح معامل '+Y+' واحدًا في المعادلتين.'));
  var sameSign=(e1.b.mul(m1).n>0)===(e2.b.mul(m2).n>0);
  var A1=e1.a.mul(m1),A2=e2.a.mul(m2),C1=e1.c.mul(m1),C2=e2.c.mul(m2);
  var aDiff=sameSign?A1.sub(A2):A1.add(A2),cDiff=sameSign?C1.sub(C2):C1.add(C2);
  steps.push(st(sameSign?'نطرح المعادلتين':'نجمع المعادلتين',
    terms([{c:aDiff,deg:1}],X)+R.eq()+R.num(cDiff),'يُحذف المجهول '+Y+' ويبقى '+X+' وحده.'));
  if(aDiff.isZero())throw new MError('تعذّر الحذف؛ تحقّق من كتابة الجملة.');
  var xv=cDiff.div(aDiff);
  steps.push(st('نجد '+X,R.vr(X)+R.eq()+R.num(cDiff)+R.op('÷')+R.num(aDiff)+R.eq()+R.num(xv)));
  var yv=e1.c.sub(e1.a.mul(xv)).div(e1.b);
  steps.push(st('نعوّض في (1) لإيجاد '+Y,
    R.num(e1.a)+R.op('×')+R.par(R.num(xv))+R.op('+')+R.num(e1.b)+R.vr(Y)+R.eq()+R.num(e1.c)+R.sp()+R.op('⟹')+R.sp()+R.vr(Y)+R.eq()+R.num(yv)));
  steps.push(st('حلّ الجملة',R.vr(X)+R.eq()+R.num(xv)+R.sp()+R.vr(Y)+R.eq()+R.num(yv)));
  var v1=e1.a.mul(xv).add(e1.b.mul(yv)),v2=e2.a.mul(xv).add(e2.b.mul(yv));
  return mk({topic:'system',topicLabel:'جملة معادلتين',problemText:t,
    problemHTML:R.lbl('(1)')+terms([{c:e1.a,deg:1}],X)+R.op('+')+terms([{c:e1.b,deg:1}],Y)+R.eq()+R.num(e1.c)+R.sp()+
      R.lbl('(2)')+terms([{c:e2.a,deg:1}],X)+R.op('+')+terms([{c:e2.b,deg:1}],Y)+R.eq()+R.num(e2.c),
    steps:steps,answerText:X+' = '+xv.txt()+' ، '+Y+' = '+yv.txt(),
    answerHTML:R.vr(X)+R.eq()+R.num(xv)+R.sp()+R.vr(Y)+R.eq()+R.num(yv),answerValue:xv.val(),
    check:{html:R.lbl('(1)')+R.num(v1)+R.eq()+R.num(e1.c)+R.sp()+R.lbl('(2)')+R.num(v2)+R.eq()+R.num(e2.c),
      note:'الزوج ('+xv.txt()+' , '+yv.txt()+') يحقّق المعادلتين معًا ✔'},
    practice:'system'});
}
/* ============ 4) متراجحة ============ */
function solveInequality(t){
  var m=t.match(/([<>≤≥])/);if(!m)throw new MError('اكتب متراجحة مثل: 2س + 3 > 11');
  var sign=m[1];
  var re=new RegExp('['+MATHCH+'<>≤≥]+');
  var raw=(t.match(re)||[''])[0];
  var parts=raw.split(/[<>≤≥]/);
  if(parts.length!==2)throw new MError('اكتب متراجحة مثل: 2س + 3 > 11');
  var la=parse(toMath(parts[0])),ra=parse(toMath(parts[1]));
  var vs=new Set();KH.varsOf(la,vs);KH.varsOf(ra,vs);
  if(vs.size!==1)throw new MError('المتراجحة يجب أن تحوي مجهولًا واحدًا.');
  var vn=Array.from(vs)[0];
  var L=toPoly(la,vn,1),Rr=toPoly(ra,vn,1);
  var a=get(L,1).sub(get(Rr,1)),b=get(Rr,0).sub(get(L,0));
  var sym={'<':'<','>':'>','≤':'≤','≥':'≥'}[sign];
  var steps=[st('نكتب المتراجحة',polyHTML(L,vn)+R.op(sym)+polyHTML(Rr,vn)),
    st('ننقل ونجمّع',terms([{c:a,deg:1}],vn)+R.op(sym)+R.num(b),'نعكس إشارة الحدّ المنقول.')];
  if(a.isZero())throw new MError('لا يوجد حدّ في المجهول بعد التجميع.');
  var fin=sym,note='نقسم الطرفين على '+a.txt()+'.';
  if(a.n<0){fin={'<':'>','>':'<','≤':'≥','≥':'≤'}[sym];
    note='نقسم على عدد سالب ('+a.txt()+')، لذلك نعكس اتجاه المتراجحة — القاعدة الأهم هنا.';}
  var x=b.div(a);
  steps.push(st('نقسم على معامل المجهول',R.vr(vn)+R.op(fin)+R.num(x),note));
  return mk({topic:'inequality',topicLabel:'متراجحة · الدرجة الأولى',problemText:t,
    problemHTML:polyHTML(L,vn)+R.op(sym)+polyHTML(Rr,vn),steps:steps,
    answerText:vn+' '+fin+' '+x.txt(),answerHTML:R.vr(vn)+R.op(fin)+R.num(x),answerValue:x.val(),practice:'linear'});
}
/* ============ 5) نشر حدودية / متطابقة شهيرة ============ */
function solveExpand(t){
  var raw=longestRun(t,new RegExp('['+MATHCH+']+','g')).replace(/انشر|فك|وسّع|وسع/g,'');
  if(!raw)throw new MError('اكتب المقدار بعد «انشر»، مثل: انشر (س+3)(س+2)');
  var a=parse(toMath(raw));
  var vs=KH.varsOf(a);
  if(vs.size!==1)throw new MError('النشر مدعوم بمجهول واحد.');
  var vn=Array.from(vs)[0];
  var P=toPoly(a,vn,4);
  var ident=null;
  if(a.t==='bin'&&a.op==='^'&&a.r.t==='num'&&a.r.v.n===2&&a.l.t==='par'&&a.l.a.t==='bin'){
    var inner=a.l.a,A=toPoly(inner.l,vn,2),B=toPoly(inner.r,vn,2);
    if(a.l.a.op==='+')ident='(أ + ب)² = أ² + 2أب + ب²';
    if(a.l.a.op==='-')ident='(أ − ب)² = أ² − 2أب + ب²';
  }
  var steps=[st('نكتب المقدار',astHTML(a))];
  if(ident)steps.push(st('نستعمل المتطابقة الشهيرة',R.txt(ident),'هذه متطابقة شهيرة من متطابقات الدرجة الثانية.'));
  else steps.push(st('نوزّع الضرب على الجمع',astHTML(a),'كل حدّ في القوس الأول يُضرب في كل حدّ من القوس الثاني.'));
  steps.push(st('نجمع الحدود المتشابهة',polyHTML(P,vn),'نرتّب بحسب أسس المجهول تنازلًا.'));
  return mk({topic:'expand',topicLabel:'نشر حدودية',problemText:t,problemHTML:astHTML(a),steps:steps,
    answerText:'الصورة المنشورة',answerHTML:polyHTML(P,vn),practice:'expand'});
}
/* ============ 6) تحليل حدودية ============ */
function solveFactor(t){
  var raw=longestRun(t,new RegExp('['+MATHCH+']+','g')).replace(/حلل|تحليل/g,'');
  if(!raw)throw new MError('اكتب المقدار بعد «حلل»، مثل: حلل س^2 + 5س + 6');
  var a=parse(toMath(raw));var vs=KH.varsOf(a);
  if(vs.size!==1)throw new MError('التحليل مدعوم بمجهول واحد.');
  var vn=Array.from(vs)[0];
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
      steps.push(st('نبحث عن عددين',R.raw('م + ن = '+b)+R.sp()+R.raw('م × ن = '+c),'مجموعهما معامل المجهول وجداؤهما الحد الثابت.'));
      var f=R.par(R.vr(vn)+R.op(p>=0?'+':'−')+R.raw(Math.abs(p)))+R.par(R.vr(vn)+R.op(q>=0?'+':'−')+R.raw(Math.abs(q)));
      if(p===-q&&c<0)steps.push(st('فرق مربعين',R.txt('أ² − ب² = (أ − ب)(أ + ب)'),'هذه حالة خاصة من المتطابقات الشهيرة.'));
      if(p===q)steps.push(st('مربع كامل',R.txt('أ² '+ (b>=0?'+':'−') +' 2أب + ب² = (أ '+(b>=0?'+':'−')+' ب)²'),'متطابقة المربع الكامل.'));
      steps.push(st('نكتب التحليل',polyHTML(Q,vn)+R.eq()+f));
      ans=gtx+f;done=true;
      steps.push(st('نتحقّق بالنشر',f+R.eq()+polyHTML(Q,vn),'نشر الجداء يعيد الحدودية الأصلية ✔'));
    }
  }
  if(!done&&deg(Q)>=1)steps.push(st('لا يتحلّل بمعاملات صحيحة',polyHTML(Q,vn),'نكتفي بالعامل المشترك المستخرج.'));
  return mk({topic:'factor',topicLabel:'تحليل حدودية',problemText:t,problemHTML:polyHTML(P,vn),steps:steps,
    answerText:'الصورة المحلّلة',answerHTML:ans,practice:'factor'});
}
/* ============ 7) تبسيط جذر ============ */
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
  steps.push(st('نفصل الجذر',R.sqrt(R.raw(n))+R.eq()+R.sqrt(R.raw(r.k*r.k))+R.op('×')+R.sqrt(R.raw(r.m)),'√(أ×ب) = √أ × √ب.'));
  steps.push(st('نبسّط',R.sqrt(R.raw(n))+R.eq()+R.raw(r.k)+R.sqrt(R.raw(r.m))));
  return mk({topic:'radical',topicLabel:'الأعداد الحقيقية · جذور',problemText:t,problemHTML:R.sqrt(R.raw(n)),steps:steps,
    answerText:r.k+'√'+r.m,answerHTML:R.raw(r.k)+R.sqrt(R.raw(r.m)),answerValue:Math.sqrt(n),
    check:{html:R.pow(R.par(R.raw(r.k)+R.sqrt(R.raw(r.m))),2)+R.eq()+R.raw(r.k*r.k)+R.op('×')+R.raw(r.m)+R.eq()+R.raw(n),
      note:'بتربيع الناتج نعود إلى العدد الأصلي ✔'},practice:'radical'});
}
/* ============ 8) عمليات حسابية خطوة بخطوة ============ */
function collectReady(n,path,depth,out,par){
  if(n.t==='bin'){
    collectReady(n.l,path.concat('l'),depth+1,out,par);
    collectReady(n.r,path.concat('r'),depth+1,out,par);
    if(n.l.t==='num'&&n.r.t==='num')out.push({path:path,depth:depth,pr:KH.prec(n.op),i:out.length,node:n,par:par});
  }else if(n.t==='par'){collectReady(n.a,path.concat('a'),depth+1,out,true)}
  else if(n.t==='neg'){collectReady(n.a,path.concat('a'),depth+1,out,par);
    if(n.a.t==='num')out.push({path:path,depth:depth,pr:5,i:out.length,node:n,par:par});}
  else if(n.t==='fn'){collectReady(n.a,path.concat('a'),depth+1,out,par);
    if(n.a.t==='num')out.push({path:path,depth:depth,pr:6,i:out.length,node:n,par:par});}
}
function solveArithmetic(t){
  var raw=longestRun(t,/[0-9+\-*/^().\s√]+/g);
  if(!raw||!/[+\-*/^√]/.test(raw))throw new MError('لم أجد عملية حسابية. جرّب مثل: 12 + 5 × 3');
  var ast=parse(toMath(raw));
  if(KH.varsOf(ast).size)throw new MError('هذا التعبير يحوي مجهولًا؛ استعمل درس المعادلات.');
  var original=astHTML(ast),steps=[],guard=0;
  while(guard++<80){
    var out=[];collectReady(ast,[],0,out,false);
    if(!out.length){ast=KH.unwrapPars(ast);if(ast.t==='num')break;continue}
    out.sort(function(x,y){return y.depth-x.depth||y.pr-x.pr||x.i-y.i});
    var pickd=out[0],node=pickd.node,before=astHTML(ast),val,note='',extra='',title='';
    if(node.t==='neg'){val=node.a.v.neg();title='نعالج الإشارة';note='سالب العدد هو معاكسه على خط الأعداد.'}
    else if(node.t==='fn'){
      var av=node.a.v.val();
      if(node.name==='sqrt'){var pf=KH.isPerfectSq(av);
        if(av<0)throw new MError('جذر عدد سالب.');
        if(pf===null)throw new MError('الجذر غير نسبي؛ استعمل درس تبسيط الجذور.');
        val=F(pf);title='نحسب الجذر';note='الجذر التربيعي للعدد المربع.';}
      else if(node.name==='abs'){val=F(Math.abs(av));title='القيمة المطلقة';note='البعد عن الصفر، وهي موجبة دائمًا.'}
      else throw new MError('sin/cos/tan تُحسب في درس النسب المثلثية.');
    }else{
      var A=node.l.v,B=node.r.v,op=node.op;
      var base={'+':'نجمع','-':'نطرح','*':'نضرب','/':'نقسم','^':'نحسب القوة'}[op];
      title=(pickd.par?'داخل الأقواس — ':'')+base;
      if(op==='+'){val=A.add(B);note='نجمع.';
        if(A.d>1&&B.d>1&&A.d!==B.d){var L=KH.lcm(A.d,B.d);
          extra=R.frac(R.raw(A.n*(L/A.d)),R.raw(L))+R.op('+')+R.frac(R.raw(B.n*(L/B.d)),R.raw(L))+R.eq();
          note='نوحّد المقامات على المقام المشترك الأصغر '+L+' ثم نجمع البسوط.'}
        else if(A.n<0||B.n<0)note='عند جمع مختلفي الإشارة نطرح القيمتين ونأخذ إشارة الأكبر قيمة.'}
      else if(op==='-'){val=A.sub(B);note='طرح عدد سالب = جمع معاكسه.';
        if(A.d>1&&B.d>1&&A.d!==B.d){var L2=KH.lcm(A.d,B.d);
          extra=R.frac(R.raw(A.n*(L2/A.d)),R.raw(L2))+R.op('−')+R.frac(R.raw(B.n*(L2/B.d)),R.raw(L2))+R.eq();
          note='نوحّد المقامات على '+L2+' ثم نطرح البسوط.'}}
      else if(op==='*'){val=A.mul(B);note=(A.d>1||B.d>1)?'بسط×بسط ومقام×مقام ثم نختصر.':'الضرب يُنفَّذ قبل الجمع والطرح.'}
      else if(op==='/'){val=A.div(B);note='القسمة على عدد = الضرب في مقلوبه.'}
      else{if(!B.isInt()||Math.abs(B.n)>12)throw new MError('الأس كبير أو غير صحيح.');
        val=A.pow(B.n);note='القوة تعني تكرار ضرب الأساس في نفسه '+B.n+' مرة.'}
    }
    var next=KH.cloneAST(ast);
    if(pickd.path.length===0){Object.keys(next).forEach(function(k){delete next[k]});next.t='num';next.v=val}
    else{var p=next;for(var k=0;k<pickd.path.length-1;k++)p=p[pickd.path[k]];
      p[pickd.path[pickd.path.length-1]]={t:'num',v:val}}
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
/* ============ 9) نسبة مئوية ============ */
function solvePercent(t){
  var m=t.match(/(\d+(?:\.\d+)?)\s*(?:%|٪)\s*(?:من|of)\s*(\d+(?:\.\d+)?)/);
  if(m){var p=F(+m[1]),n=F(+m[2]),r=p.div(F(100)).mul(n);
    return mk({topic:'percent',topicLabel:'نسبة مئوية',problemText:t,problemHTML:R.raw(p.txt()+'%')+R.op('×')+R.num(n),
      steps:[st('نفهم المطلوب',R.txt('نسبة من عدد = ضرب العدد في النسبة')),
        st('نحوّل النسبة إلى كسر',R.raw(p.txt()+'%')+R.eq()+R.frac(R.raw(p.n),R.raw(100)),'النسبة المئوية معناها «من كل مائة».'),
        st('نضرب في العدد',R.frac(R.raw(p.n),R.raw(100))+R.op('×')+R.num(n)+R.eq()+R.num(r)),
        st('النتيجة',R.num(r)+(r.isInt()?'':R.op('≈')+R.raw(r.val().toFixed(2))))],
      answerText:r.txt(),answerHTML:R.num(r),answerValue:r.val(),practice:'percent'})}
  m=t.match(/(زيادة|خصم|تخفيض)\s*(\d+(?:\.\d+)?)\s*(?:%|٪)\s*(?:من|على)\s*(\d+(?:\.\d+)?)/);
  if(m){var up=m[1]==='زيادة',p2=F(+m[2]),n2=F(+m[3]),d=p2.div(F(100)).mul(n2),fin=up?n2.add(d):n2.sub(d);
    return mk({topic:'percent',topicLabel:up?'زيادة':'خصم',problemText:t,problemHTML:R.num(n2)+R.op(up?'+':'−')+R.raw(p2.txt()+'%'),
      steps:[st('نحسب قيمة النسبة',R.frac(R.raw(p2.n),R.raw(100))+R.op('×')+R.num(n2)+R.eq()+R.num(d)),
        st(up?'نضيف الزيادة':'نطرح الخصم',R.num(n2)+R.op(up?'+':'−')+R.num(d)+R.eq()+R.num(fin)),
        st('النتيجة',R.num(fin))],
      answerText:fin.txt(),answerHTML:R.num(fin),answerValue:fin.val(),practice:'percent'})}
  throw new MError('اكتب النسبة هكذا: 15% من 80، أو: خصم 20% من 350.');
}
/* ============ 10) طاليس ============ */
function solveThales(t){
  var AM=labeled(t,['AM']),AB=labeled(t,['AB']),AN=labeled(t,['AN']),AC=labeled(t,['AC']),MN=labeled(t,['MN']),BC=labeled(t,['BC']);
  var pairs=[[AM,AB,'AM','AB'],[AN,AC,'AN','AC'],[MN,BC,'MN','BC']];
  var known=pairs.filter(function(p){return p[0]!==null&&p[1]!==null});
  var missing=pairs.filter(function(p){return p[0]!==null&&p[1]===null});
  if(!known.length||!missing.length)throw new MError('اكتب ثلاث قيم معروفة ومجهولًا واحدًا، مثل: طاليس AM=3 AB=9 AN=4 (لإيجاد AC).');
  var k=known[0],ms=missing[0];
  var ratio=F(k[0]).div(F(k[1]));
  var val=ratio.mul(F(ms[0]));
  var steps=[st('نكتب نظرية طاليس',
    R.frac(R.raw('AM'),R.raw('AB'))+R.eq()+R.frac(R.raw('AN'),R.raw('AC'))+R.eq()+R.frac(R.raw('MN'),R.raw('BC')),
    'في المثلث ABC، إذا كان M على [AB] و N على [AC] و (MN) يوازي (BC) تتساوى هذه النسب الثلاث.')];
  steps.push(st('نحسب النسبة المعلومة',R.frac(R.raw(k[2]),R.raw(k[3]))+R.eq()+R.frac(R.raw(k[0]),R.raw(k[1]))+R.eq()+R.num(ratio)));
  steps.push(st('نساوي النسبة المجهولة بها',R.frac(R.raw(ms[2]),R.raw(ms[3]))+R.eq()+R.num(ratio)));
  steps.push(st('نضرب تبادليًا',R.raw(ms[3])+R.eq()+R.num(F(ms[0]))+R.op('÷')+R.num(ratio)+R.eq()+R.num(val)));
  return mk({topic:'thales',topicLabel:'نظرية طاليس',problemText:t,
    problemHTML:R.frac(R.raw('AM'),R.raw('AB'))+R.eq()+R.frac(R.raw('AN'),R.raw('AC'))+R.eq()+R.frac(R.raw('MN'),R.raw('BC')),
    steps:steps,answerText:ms[3]+' = '+val.txt(),answerHTML:R.raw(ms[3])+R.eq()+R.num(val),answerValue:val.val(),unit:'سم',
    check:{html:R.frac(R.raw(ms[2]),R.num(val))+R.eq()+R.num(ratio),note:'النسبة تساوي النسبة المعلومة ✔'},practice:'thales'});
}
/* ============ 11) فيثاغورس ============ */
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
      st('نطرح',R.pow(R.raw('ب'),2)+R.eq()+R.num(c.mul(c))+R.op('−')+R.num(a.mul(a))+R.eq()+R.num(b2)),
      st('نأخذ الجذر',R.raw('ب')+R.eq()+R.num(bv)+(r!==null?'':R.op('≈')+R.raw(bv.val().toFixed(2)))));
    ans=R.raw('ب')+R.eq()+R.num(bv);val=bv.val();
  }else{
    var a2=F(ns[0]),b=F(ns[1]),c2=a2.mul(a2).add(b.mul(b));
    var r2=KH.isPerfectSq(c2.n),cv=r2!==null?F(r2):F(Math.sqrt(c2.val()));
    steps.push(st('نعوّض',R.pow(R.num(a2),2)+R.op('+')+R.pow(R.num(b),2)+R.eq()+R.pow(R.raw('ج'),2)),
      st('نحسب المربّعات',R.num(a2.mul(a2))+R.op('+')+R.num(b.mul(b))+R.eq()+R.pow(R.raw('ج'),2)),
      st('نجمع',R.pow(R.raw('ج'),2)+R.eq()+R.num(c2)),
      st('نأخذ الجذر',R.raw('ج')+R.eq()+R.num(cv)+(r2!==null?'':R.op('≈')+R.raw(cv.val().toFixed(2))),'الطول موجب دائمًا.'));
    ans=R.raw('ج')+R.eq()+R.num(cv);val=cv.val();
  }
  return mk({topic:'pythagoras',topicLabel:'نظرية فيثاغورس',problemText:t,
    problemHTML:R.pow(R.raw('أ'),2)+R.op('+')+R.pow(R.raw('ب'),2)+R.eq()+R.pow(R.raw('ج'),2),
    steps:steps,answerText:'الطول = '+(Math.round(val*100)/100),answerHTML:ans,answerValue:val,unit:'سم',practice:'pyth'});
}
/* ============ 12) sin_cos_tan ============ */
var SPECIAL={0:{sin:'0',cos:'1',tan:'0'},30:{sin:'1/2',cos:'√3/2',tan:'√3/3'},
  45:{sin:'√2/2',cos:'√2/2',tan:'1'},60:{sin:'√3/2',cos:'1/2',tan:'√3'},90:{sin:'1',cos:'0',tan:'غير معرّفة'}};
function specialHTML(v){
  if(v==='غير معرّفة')return R.txt('غير معرّفة');
  if(v.indexOf('√')===0){var parts=v.split('/');var rad=parts[0].slice(1);
    return parts[1]?R.frac(R.sqrt(R.raw(rad)),R.raw(parts[1])):R.sqrt(R.raw(rad));}
  if(v.indexOf('/')>0){var p=v.split('/');return R.frac(R.raw(p[0]),R.raw(p[1]))}
  return R.raw(v);
}
function solveTrig(t){
  var ang=t.match(/\b(sin|cos|tan)\s*\(?\s*(0|30|45|60|90)\s*\)?/i);
  if(ang){
    var fn=ang[1].toLowerCase(),degv=Number(ang[2]),v=SPECIAL[degv][fn];
    var steps=[st('نكتب المطلوب',R.fn(fn,R.raw(degv)),'الزاوية بالدرجات، وهذه من الزوايا الخاصة التي تُحفظ قيمهاExactة.'),
      st('نستعمل جدول الزوايا الخاصة',
        R.lbl('الزاوية')+R.raw(degv+'°')+R.sp()+R.lbl('sin')+specialHTML(SPECIAL[degv].sin)+R.sp()+
        R.lbl('cos')+specialHTML(SPECIAL[degv].cos)+R.sp()+R.lbl('tan')+specialHTML(SPECIAL[degv].tan)),
      st('النتيجة',R.fn(fn,R.raw(degv))+R.eq()+specialHTML(v))];
    return mk({topic:'sin_cos_tan',topicLabel:'sin_cos_tan · زوايا خاصة',problemText:t,
      problemHTML:R.fn(fn,R.raw(degv)),steps:steps,answerText:fn+' '+degv+'° = '+v,
      answerHTML:specialHTML(v),practice:'trigAngle'});
  }
  var AB=labeled(t,['AB']),AC=labeled(t,['AC']),BC=labeled(t,['BC']);
  var angle=(t.match(/(?:الزاوية|زاوية)\s*([A-Za-z\u0621-\u064A])/)||[])[1]||'B';
  if(AB===null||AC===null){
    var ns=nums(t);
    if(ns.length>=2){AB=ns[0];AC=ns[1];BC=ns[2]!==undefined?ns[2]:null}
  }
  if(AB===null||AC===null)throw new MError('اكتب ضلعي القائمة، مثل: sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5');
  var steps=[st('نحدّد المثلث القائم',R.txt('المثلث ABC قائم في A، والوتر هو [BC]'),'الوتر هو الضلع المقابل للزاوية القائمة.')];
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
/* ============ 13) الأشعة والمعالم ============ */
function solveVector(t){
  var re=/([A-Za-z\u0621-\u064A])\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  var pts=[],m;
  while((m=re.exec(t))!==null)pts.push({n:m[1],x:F(+m[2]),y:F(+m[3])});
  if(pts.length<2)throw new MError('اكتب نقطتين بإحداثياتهما، مثل: شعاع A(1,2) B(4,6)');
  var A=pts[0],B=pts[1];
  var dx=B.x.sub(A.x),dy=B.y.sub(A.y);
  var mode=/منتصف/.test(t)?'mid':/مسافة|طول/.test(t)?'dist':'vec';
  var base=st('نكتب إحداثيات النقطتين',R.raw(A.n)+R.par(R.num(A.x)+R.op(',')+R.num(A.y))+R.sp()+
    R.raw(B.n)+R.par(R.num(B.x)+R.op(',')+R.num(B.y)),'في معلم متعامد ممنظم.');
  if(mode==='vec'){
    var steps=[base,
      st('قاعدة إحداثيات شعاع',R.vr('AB')+R.par(R.raw('x')+R.sub?R.raw('B'):R.raw('B'))+'', ''),
    ];
    steps=[base,
      st('نطبّق القاعدة',R.lbl('إحداثيا الشعاع')+R.par(R.raw('x_B − x_A')+R.op(',')+R.raw('y_B − y_A')),'إحداثيا الشعاع = إحداثيات النهاية − إحداثيات البداية.'),
      st('نعوّض',R.par(R.num(B.x)+R.op('−')+R.par(R.num(A.x))+R.op(',')+R.num(B.y)+R.op('−')+R.par(R.num(A.y)))),
      st('النتيجة',R.lbl('شعاع '+A.n+B.n)+R.par(R.num(dx)+R.op(',')+R.num(dy)))];
    return mk({topic:'vector',topicLabel:'أشعة · إحداثيات شعاع',problemText:t,
      problemHTML:R.raw(A.n)+R.par(R.num(A.x)+R.op(',')+R.num(A.y))+R.sp()+R.raw(B.n)+R.par(R.num(B.x)+R.op(',')+R.num(B.y)),
      steps:steps,answerText:'('+dx.txt()+' , '+dy.txt()+')',
      answerHTML:R.par(R.num(dx)+R.op(',')+R.num(dy)),practice:'vector'});
  }
  if(mode==='mid'){
    var mx=A.x.add(B.x).div(F(2)),my=A.y.add(B.y).div(F(2));
    var steps=[base,
      st('قاعدة المنتصف',R.par(R.frac(R.raw('x_A + x_B'),R.raw(2))+R.op(',')+R.frac(R.raw('y_A + y_B'),R.raw(2))),'منتصف قطعة مستقيم = متوسط الإحداثيات.'),
      st('نعوّض',R.par(R.frac(R.num(A.x)+R.op('+')+R.num(B.x),R.raw(2))+R.op(',')+R.frac(R.num(A.y)+R.op('+')+R.num(B.y),R.raw(2)))),
      st('النتيجة',R.lbl('المنتصف I')+R.par(R.num(mx)+R.op(',')+R.num(my)))];
    return mk({topic:'vector',topicLabel:'أشعة · منتصف قطعة',problemText:t,
      problemHTML:R.txt('منتصف ['+A.n+B.n+']'),steps:steps,answerText:'('+mx.txt()+' , '+my.txt()+')',
      answerHTML:R.par(R.num(mx)+R.op(',')+R.num(my)),practice:'midpoint'});
  }
  var s=dx.mul(dx).add(dy.mul(dy)),pf=KH.isPerfectSq(s.n);
  var dv=pf!==null?F(pf):F(Math.sqrt(s.val()));
  var steps=[base,
    st('قاعدة المسافة',R.raw(A.n+B.n)+R.eq()+R.sqrt(R.pow(R.par(R.raw('x_B − x_A')),2)+R.op('+')+R.pow(R.par(R.raw('y_B − y_A')),2)),'في معلم متعامد ممنظم تُطبَّق فيثاغورس.'),
    st('نعوّض',R.sqrt(R.pow(R.par(R.num(dx)),2)+R.op('+')+R.pow(R.par(R.num(dy)),2))),
    st('نحسب',R.sqrt(R.num(dx.mul(dx))+R.op('+')+R.num(dy.mul(dy)))+R.eq()+R.sqrt(R.num(s))),
    st('النتيجة',R.raw(A.n+B.n)+R.eq()+(pf!==null?R.num(dv):R.sqrt(R.num(s)))+(pf!==null?'':R.op('≈')+R.raw(dv.val().toFixed(3))))];
  return mk({topic:'vector',topicLabel:'أشعة · مسافة',problemText:t,problemHTML:R.txt('المسافة '+A.n+B.n),
    steps:steps,answerText:pf!==null?dv.txt():'√'+s.n,
    answerHTML:pf!==null?R.num(dv):R.sqrt(R.num(s)),answerValue:dv.val(),practice:'distance'});
}
/* ============ 14) الدوال: صورة وسابقة ============ */
function solveFunction(t){
  var def=t.match(/([A-Za-z\u0621-\u064A])\s*\(\s*([A-Za-z\u0621-\u064A])\s*\)\s*=\s*([^،;\n]+?)(?=\s+(?:احسب|أوجد|اوجد|جد|سابقة|صورة)|$)/);
  if(!def)throw new MError('اكتب الدالة هكذا: f(س)=2س+3 احسب f(4)');
  var fname=def[1],vn=def[2],body=def[3].trim();
  var ast=parse(toMath(body));
  var vs=KH.varsOf(ast);
  if(vs.size>1||(vs.size===1&&!vs.has(vn)))throw new MError('عبارة الدالة يجب أن تحوي المجهول «'+vn+'» فقط.');
  var pre=t.match(/سابقة\s*(?:العدد\s*)?(-?\d+(?:\.\d+)?)/);
  var img=t.match(new RegExp(fname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)'));
  if(pre){
    var target=F(+pre[1]);
    var P=toPoly(ast,vn,2);
    var eqP=KH.psub(P,[target]);
    var steps=[st('نكتب الدالة',R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast)),
      st('نفهم المطلوب',R.txt('السابقة: نبحث عن قيمة المجهول التي صورتها '+target.txt()))];
    if(deg(eqP)===1){
      var a=get(eqP,1),b=get(eqP,0);
      if(a.isZero())throw new MError('الدالة ثابتة: لا سابقة وحيدة.');
      var x=b.neg().div(a);
      steps.push(st('نحلّ المعادلة',astHTML(ast)+R.eq()+R.num(target),'نضع عبارة الدالة مساوية للعدد المطلوب.'),
        st('ننقل ونجمّع',terms([{c:a,deg:1}],vn)+R.eq()+R.num(b.neg())),
        st('نقسم على المعامل',R.vr(vn)+R.eq()+R.num(x)));
      return mk({topic:'function',topicLabel:'دوال · سابقة',problemText:t,
        problemHTML:R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast),steps:steps,
        answerText:'سابقة '+target.txt()+' هي '+x.txt(),answerHTML:R.vr(vn)+R.eq()+R.num(x),answerValue:x.val(),
        check:{html:R.raw(fname)+R.par(R.num(x))+R.eq()+R.num(KH.pval(P,x)),note:'صورة الناتج تساوي العدد المطلوب ✔'},practice:'funcImg'});
    }
    throw new MError('السابقة لدالة غير خطية تحتاج حلّ معادلة من الدرجة الثانية؛ استعمل درس المعادلات.');
  }
  if(!img)throw new MError('اكتب الصورة المطلوبة مثل: f(4)، أو «سابقة 11».');
  var xv=F(+img[1]);
  var P2=toPoly(ast,vn,2),res=KH.pval(P2,xv);
  var steps=[st('نكتب الدالة',R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast)),
    st('نعوّض المجهول بالعدد',R.raw(fname)+R.par(R.num(xv))+R.eq()+subHTML(P2,vn,R.num(xv)),'الصورة = قيمة العبارة عند العدد المعطى.'),
    st('نحسب',R.raw(fname)+R.par(R.num(xv))+R.eq()+R.num(res))];
  return mk({topic:'function',topicLabel:'دوال · صورة',problemText:t,
    problemHTML:R.raw(fname)+R.par(R.vr(vn))+R.eq()+astHTML(ast),steps:steps,
    answerText:fname+'('+xv.txt()+') = '+res.txt(),
    answerHTML:R.raw(fname)+R.par(R.num(xv))+R.eq()+R.num(res),answerValue:res.val(),practice:'funcImg'});
}
/* ============ 15) الأشكال المستوية ============ */
function solveGeometry(t){
  var want=/حجم/.test(t)?'vol':/محيط/.test(t)?'per':'area';
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
  function piFor(r){var u22=(r%7===0);return{pi:u22?F(22,7):F(157,50),t:u22?R.frac(R.raw(22),R.raw(7)):R.raw('3.14'),
    note:u22?'نأخذ π ≈ 22/7 لأن نصف القطر من مضاعفات 7.':'نأخذ π ≈ 3.14.'}}
  if(sh.n==='مربع'){var a=F(S1!==null?S1:ns[0]);
    if(want==='per'){formula=R.raw('P')+R.eq()+R.raw('4أ');val=a.mul(F(4));push(formula,R.raw('P')+R.eq()+R.raw('4')+R.op('×')+R.num(a),R.raw('P')+R.eq()+R.num(val))}
    else{formula=R.raw('A')+R.eq()+R.pow(R.raw('أ'),2);val=a.mul(a);u=unit+'²';push(formula,R.raw('A')+R.eq()+R.pow(R.num(a),2),R.raw('A')+R.eq()+R.num(val))}
  }else if(sh.n==='مستطيل'){var l=F(L!==null?L:ns[0]),w=F(W!==null?W:(ns[1]!==undefined?ns[1]:ns[0]));
    if(want==='per'){formula=R.raw('P')+R.eq()+R.raw('2(ل + ع)');val=l.add(w).mul(F(2));
      push(formula,R.raw('P')+R.eq()+R.raw('2')+R.par(R.num(l)+R.op('+')+R.num(w)),R.raw('P')+R.eq()+R.num(val))}
    else{formula=R.raw('A')+R.eq()+R.raw('ل × ع');val=l.mul(w);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.num(l)+R.op('×')+R.num(w),R.raw('A')+R.eq()+R.num(val))}
  }else if(sh.n==='مثلث'){
    if(want==='per'&&ns.length>=3){val=F(ns[0]).add(F(ns[1])).add(F(ns[2]));
      push(R.raw('P')+R.eq()+R.raw('أ + ب + ج'),R.raw('P')+R.eq()+R.raw(ns[0])+R.op('+')+R.raw(ns[1])+R.op('+')+R.raw(ns[2]),R.raw('P')+R.eq()+R.num(val))}
    else{var b=F(B!==null?B:ns[0]),h=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0]));
      val=b.mul(h).div(F(2));u=unit+'²';
      push(R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.op('×')+R.raw('القاعدة')+R.op('×')+R.raw('الارتفاع'),
        R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.op('×')+R.num(b)+R.op('×')+R.num(h),
        R.raw('A')+R.eq()+R.num(val),'الارتفاع عمودي على القاعدة وليس الضلع المائل.')}
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
    if(want==='per'){val=b2.add(h2).mul(F(2));push(R.raw('P')+R.eq()+R.raw('2(أ + ب)'),R.raw('P')+R.eq()+R.raw('2')+R.par(R.num(b2)+R.op('+')+R.num(h2)),R.raw('P')+R.eq()+R.num(val))}
    else{val=b2.mul(h2);u=unit+'²';push(R.raw('A')+R.eq()+R.raw('القاعدة × الارتفاع'),R.raw('A')+R.eq()+R.num(b2)+R.op('×')+R.num(h2),R.raw('A')+R.eq()+R.num(val))}
  }else{
    var b1=F(ns[0]),bb2=F(ns[1]!==undefined?ns[1]:ns[0]),hh=F(H!==null?H:(ns[2]!==undefined?ns[2]:ns[0]));
    val=b1.add(bb2).mul(hh).div(F(2));u=unit+'²';
    push(R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.par(R.raw('ب₁ + ب₂'))+R.raw('هـ'),
      R.raw('A')+R.eq()+R.frac(R.raw('1'),R.raw(2))+R.par(R.num(b1)+R.op('+')+R.num(bb2))+R.op('×')+R.num(hh),
      R.raw('A')+R.eq()+R.num(val));
  }
  var label=want==='vol'?'الحجم':want==='per'?'المحيط':'المساحة';
  steps.push(st(label,R.num(val),'الوحدة: '+u));
  return mk({topic:'geometry',topicLabel:'مستويات · '+sh.n,problemText:t,problemHTML:formula,steps:steps,
    answerText:val.txt()+' '+u,answerHTML:R.num(val),answerValue:val.val(),unit:u,practice:'geom'});
}
/* ============ 16) المجسمات ============ */
function solveSolid(t){
  var want=/مساحة/.test(t)?'area':'vol';
  var unit=/متر/.test(t)?'م':'سم';
  var ns=nums(t);if(!ns.length)throw new MError('اكتب الأبعاد، مثل: حجم مخروط نصف قطره 3 وارتفاعه 4.');
  var Rr=labeled(t,['نصف\\s*ال?قطر(?:ها|ه)?']),H=labeled(t,['ال?ارتفاع(?:ه)?']),
    B=labeled(t,['مساحة\\s*ال?قاعدة','ال?قاعدة']),S1=labeled(t,['ال?ضلع(?:ه)?']),
    L=labeled(t,['ال?طول(?:ه)?']),W=labeled(t,['ال?عرض(?:ه)?']);
  function piFor(r){var u22=(r%7===0);return{pi:u22?F(22,7):F(157,50),t:u22?R.frac(R.raw(22),R.raw(7)):R.raw('3.14'),
    note:u22?'نأخذ π ≈ 22/7.':'نأخذ π ≈ 3.14.'}}
  var steps=[],val,u,formula,name;
  function push(f,s,c,n){steps.push(st('نكتب القانون',f,n||''));steps.push(st('نعوّض',s));steps.push(st('نحسب',c))}
  if(/كرة|كره/.test(t)){
    name='كرة';var r=F(Rr!==null?Rr:ns[0]),P=piFor(r.val());
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('4πr²');val=F(4).mul(P.pi).mul(r).mul(r);u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('4')+R.op('×')+P.t+R.op('×')+R.pow(R.num(r),2),R.raw('A')+R.eq()+R.num(val),P.note)}
    else{formula=R.raw('V')+R.eq()+R.frac(R.raw('4'),R.raw(3))+R.raw('πr³');val=F(4).div(F(3)).mul(P.pi).mul(r).mul(r).mul(r);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+R.frac(R.raw('4'),R.raw(3))+R.op('×')+P.t+R.op('×')+R.pow(R.num(r),3),R.raw('V')+R.eq()+R.num(val),P.note)}
  }else if(/مخروط/.test(t)){
    name='مخروط دوراني';var r2=F(Rr!==null?Rr:ns[0]),h2=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0])),P2=piFor(r2.val());
    formula=R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.raw('πr²هـ');
    val=F(1).div(F(3)).mul(P2.pi).mul(r2).mul(r2).mul(h2);u=unit+'³';
    push(formula,R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.op('×')+P2.t+R.op('×')+R.pow(R.num(r2),2)+R.op('×')+R.num(h2),
      R.raw('V')+R.eq()+R.num(val),'حجم المخروط ثلث حجم الأسطوانة التي لها القاعدة والارتفاع نفسه.');
  }else if(/هرم/.test(t)){
    name='هرم';var bb=F(B!==null?B:ns[0]),hh=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0]));
    formula=R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.raw('مساحة القاعدة × الارتفاع');
    val=bb.mul(hh).div(F(3));u=unit+'³';
    push(formula,R.raw('V')+R.eq()+R.frac(R.raw('1'),R.raw(3))+R.op('×')+R.num(bb)+R.op('×')+R.num(hh),R.raw('V')+R.eq()+R.num(val),
      'مساحة القاعدة معطاة مباشرة؛ لو كان الضلع معطًى لحسبنا مساحتها أولًا.');
  }else if(/أسطوانة|اسطوانة/.test(t)){
    name='أسطوانة دورانية';var r3=F(Rr!==null?Rr:ns[0]),h3=F(H!==null?H:(ns[1]!==undefined?ns[1]:ns[0])),P3=piFor(r3.val());
    if(want==='area'){formula=R.raw('A')+R.eq()+R.raw('2πr(ر + هـ)');val=F(2).mul(P3.pi).mul(r3).mul(r3.add(h3));u=unit+'²';
      push(formula,R.raw('A')+R.eq()+R.raw('2')+R.op('×')+P3.t+R.op('×')+R.num(r3)+R.par(R.num(r3)+R.op('+')+R.num(h3)),R.raw('A')+R.eq()+R.num(val),P3.note)}
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
      push(formula,R.raw('A')+R.eq()+R.raw('2')+R.par(R.num(l.mul(w))+R.op('+')+R.num(l.mul(h))+R.op('+')+R.num(w.mul(h))),R.raw('A')+R.eq()+R.num(val))}
    else{formula=R.raw('V')+R.eq()+R.raw('ل × ع × هـ');val=l.mul(w).mul(h);u=unit+'³';
      push(formula,R.raw('V')+R.eq()+R.num(l)+R.op('×')+R.num(w)+R.op('×')+R.num(h),R.raw('V')+R.eq()+R.num(val))}
  }
  steps.push(st(want==='area'?'المساحة الكلية':'الحجم',R.num(val),'الوحدة: '+u));
  return mk({topic:'solid',topicLabel:'مجسمات · '+name,problemText:t,problemHTML:formula,steps:steps,
    answerText:val.txt()+' '+u,answerHTML:R.num(val),answerValue:val.val(),unit:u,practice:'solid'});
}
/* ============ 17) الإحصاء ============ */
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
    st('نحسب المجموع',list.map(function(v){return R.num(v)}).join(R.op('+'))+R.eq()+R.num(sum)),
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
/* ============ الموجّه ============ */
KH.solveProblem=function(text){
  var t=normDigits(text);
  if(!t)throw new MError('اكتب مسألة أولًا، أو اختر قالبًا جاهزًا.');
  try{
    if(/[;؛]/.test(t)&&((t.match(/=/g)||[]).length>=2))return solveSystem(t);
    if(/\n/.test(String(text))&&((t.match(/=/g)||[]).length>=2))return solveSystem(String(text).split('\n').filter(function(s){return s.indexOf('=')>=0}).join(' ؛ '));
    if(/طاليس|thalès|thales/i.test(t))return solveThales(t);
    if(/sin|cos|tan|نسب مثلثية|مثلثية/i.test(t))return solveTrig(t);
    if(/منتصف|مسافة|شعاع|إحداثي|احداثي/.test(t)&&/\(\s*-?\d/.test(t))return solveVector(t);
    if(/سابقة|صورة/.test(t)||/[A-Za-z\u0621-\u064A]\s*\(\s*[A-Za-z\u0621-\u064A]\s*\)\s*=/.test(t))return solveFunction(t);
    if(/حلل|تحليل/.test(t))return solveFactor(t);
    if(/انشر|فك\b|وسّع|وسع|متطابقة/.test(t))return solveExpand(t);
    if(/[<>≤≥]/.test(t))return solveInequality(t);
    if(t.indexOf('=')>=0&&KH.varsOf(parse(toMath((t.match(new RegExp('['+MATHCH+']*=['+MATHCH+']*'))||[''])[0]))).size>0)return solveEquation(t);
    if(/حجم|مساحة\s*(?:السطح|الكلية)|كرة|مخروط|هرم|أسطوانة|اسطوانة|مكعب|متوازي مستطيلات/.test(t))return solveSolid(t);
    if(/مساحة|محيط/.test(t))return solveGeometry(t);
    if(/فيثاغورس|قائم|الوتر/.test(t))return solvePyth(t);
    if(/√|جذر/.test(t)&&!/[A-Za-z\u0621-\u064A]\s*[=]/.test(t.replace(/جذر|التربيعي|لـ|ل/g,'')))return solveRadical(t);
    if(/%|٪|مئوية|المائة/.test(t))return solvePercent(t);
    if(/متوسط|وسيط|منوال|مدى|إحصاء|احصاء/.test(t))return solveStats(t);
    if(/\(/.test(t)&&/[A-Za-z\u0621-\u064A]/.test(t)&&!/=/.test(t))return solveExpand(t);
    return solveArithmetic(t);
  }catch(e){
    if(e instanceof MError||e.name==='MError')throw e;
    throw new MError('تعذّر تحليل المسألة: '+(e&&e.message?e.message:'صيغة غير مفهومة'));
  }
};
/* ============ مولّدات التمارين ============ */
var ri=KH.ri,pick=KH.pick;
KH.gen={
  linear:function(){var a=ri(2,9),x=ri(-6,12),b=ri(-12,12),r=a*x+b,v=pick(['س','ص','ع','n','y']);
    return{text:a+v+' '+(b>=0?'+':'-')+' '+Math.abs(b)+' = '+r,value:x,ask:'ما قيمة '+v+'؟'}},
  quad:function(){var p=ri(-6,6),q=ri(-6,6),b=-(p+q),c=p*q;
    return{text:'س^2 '+(b>=0?'+':'-')+' '+Math.abs(b)+'س '+(c>=0?'+':'-')+' '+Math.abs(c)+' = 0',value:p,ask:'اكتب أحد جذري المعادلة.'}},
  system:function(){var x=ri(-4,6),y=ri(-4,6),a1=ri(1,5),b1=ri(1,5),a2=ri(1,5),b2=ri(1,5);
    if(a1*b2===a2*b1)b2+=1;
    return{text:a1+'س + '+b1+'ص = '+(a1*x+b1*y)+' ؛ '+a2+'س + '+b2+'ص = '+(a2*x+b2*y),value:x,ask:'ما قيمة س؟'}},
  expand:function(){var a=ri(1,6),b=ri(1,6);
    return{text:'انشر (س+'+a+')(س+'+b+')',value:a*b,ask:'ما الحد الثابت بعد النشر؟'}},
  factor:function(){var p=ri(1,6),q=ri(1,6);
    return{text:'حلل س^2 + '+(p+q)+'س + '+(p*q),value:p,ask:'اكتب أحد العددين في التحليل.'}},
  radical:function(){var k=ri(2,6),m=pick([2,3,5,6,7]);
    return{text:'√'+(k*k*m),value:Math.sqrt(k*k*m),coeff:k,ask:'ما العدد الخارج خارج الجذر؟'}},
  arith:function(){var a=ri(2,12),b=ri(2,9),c=ri(2,9);
    return{text:a+' + '+b+' × '+c,value:a+b*c,ask:'كم الناتج؟ (انتبه لترتيب العمليات)'}},
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
  trigAngle:function(){var ang=pick([30,45,60]),fn=pick(['sin','cos','tan']);
    var vals={'sin30':0.5,'cos30':Math.sqrt(3)/2,'tan30':Math.sqrt(3)/3,'sin45':Math.SQRT1_2,'cos45':Math.SQRT1_2,'tan45':1,
      'sin60':Math.sqrt(3)/2,'cos60':0.5,'tan60':Math.sqrt(3)};
    return{text:fn+' '+ang,value:vals[fn+ang],ask:'اكتب القيمة (عشريًا لأقرب جزء من مئة).',tol:0.01}},
  trigTri:function(){var t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17]]);
    return{text:'sin_cos_tan مثلث قائم في A: AB='+t[0]+', AC='+t[1]+', BC='+t[2],value:t[1]/t[2],ask:'ما قيمة sin B؟ (كسر أو عشري)',tol:0.01}},
  geom:function(){var l=ri(3,16),w=ri(3,14);
    return{text:'مساحة مستطيل طوله '+l+' وعرضه '+w,value:l*w,ask:'كم المساحة؟'}},
  solid:function(){var r=ri(2,6),h=ri(3,9);
    return{text:'حجم أسطوانة نصف قطرها '+r+' وارتفاعها '+h,value:Math.PI*r*r*h,ask:'كم الحجم؟ (π≈3.14 لأقرب عدد صحيح)',tol:2}},
  stats:function(){var arr=[];for(var i=0;i<4;i++)arr.push(ri(2,20));
    return{text:'المتوسط الحسابي لـ '+arr.join('، '),value:arr.reduce(function(a,b){return a+b},0)/4,ask:'كم المتوسط الحسابي؟'}}
};
})();