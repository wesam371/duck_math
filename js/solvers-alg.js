/* js/solvers-alg.js — الجبر: معادلات بكل أنواعها، جمل، متراجحات، حدوديات، دوال، مصفوفات */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X,M=DM.M,q=DM.q,q0=DM.q0,q1=DM.q1,q2=DM.q2,E=DM.E,P=DM.P;
var S=M.step,mk=DM.mk,SOL={};
function rel(t){var r=DM.relation(t);if(!r)throw new E('اكتب معادلة بعلامة = أو متراجحة بعلامة < > ≤ ≥.','rel');return r}
function side(s,vn,maxD){return P.toPoly(DM.parse(DM.toMath(s)),vn,maxD||4)}
function balance(co,vn){ /* معامل + متغير بشكل نصّي */
  var a=co.abs();return (a.one()?'':M.q(a))+M.v(vn)}
function cancel(c,vn){var neg=c.sign()<0;
  return{sym:neg?'+':'−',val:c.abs(),verb:neg?'نضيف':'نطرح',prep:neg?'إلى':'من',
    h:M.op(neg?'+':'−')+M.q(c.abs()),ht:M.op(neg?'+':'−')+balance(c,vn),plain:(c.abs().one()?'':c.abs().txt())+vn}}

/* ══ معادلة خطية — طريقتان ══ */
SOL.linear=function(t){
  var r=rel(t);if(r.op!=='=')return SOL.inequality(t);
  var vs=DM.vars(DM.parse(DM.toMath(r.left))).concat(DM.vars(DM.parse(DM.toMath(r.right))));
  vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
  if(!vs.length)throw new E('لا يوجد مجهول. اكتب مثل 3س + 7 = 22.','novar');
  if(vs.length>1)throw new E('ظهر أكثر من مجهول ('+vs.join('، ')+'). لجمل المعادلات افصل بـ ؛','multi');
  var vn=vs[0],L=side(r.left,vn,3),Rr=side(r.right,vn,3),D=P.sub(L,Rr);
  if(P.deg(D)===2)return SOL.quadratic(t);
  if(P.deg(D)>2)return SOL.cubic(t);
  var l1=P.get(L,1),l0=P.get(L,0),r1=P.get(Rr,1),r0=P.get(Rr,0);
  var a=l1.sub(r1),b=r0.sub(l0);
  var head=M.poly(L,vn)+M.eq()+M.poly(Rr,vn);
  /* طريقة الميزان */
  var m1=[S('نكتب المعادلة',head,'المعادلة ميزان: كل عملية على طرف تُجرى على الآخر.','خاصية التساوي')];
  if(/\(/.test(r.raw))m1.push(S('نفكّ الأقواس',M.poly(L,vn)+M.eq()+M.poly(Rr,vn),'أ(ب+ج) = أب + أج.','التوزيع'));
  var cL=L.slice(),cR=Rr.slice();
  if(!l0.zero()){var o=cancel(l0,vn),n0=r0.sub(l0);
    m1.push(S(o.verb+' '+o.val.txt()+' '+o.prep+' الطرفين',M.poly(cL,vn)+o.h+M.eq()+M.poly(cR,vn)+o.h,
      'نُلغي الحدّ الثابت من الطرف الأيسر بالعملية المعاكسة.','العملية المعاكسة'));
    cL=[q0,l1];cR=[n0,r1];
    m1.push(S('نبسّط',M.poly(cL,vn)+M.eq()+M.poly(cR,vn),'الأيسر: '+l0.txt()+' '+o.sym+' '+o.val.txt()+' = 0. الأيمن: '+r0.txt()+' '+o.sym+' '+o.val.txt()+' = '+n0.txt()+'.','حساب'))}
  if(!r1.zero()){var o2=cancel(r1,vn),n1=l1.sub(r1),kept=cR[0]||q0;
    m1.push(S(o2.verb+' '+o2.plain+' '+o2.prep+' الطرفين',M.poly(cL,vn)+o2.ht+M.eq()+M.poly(cR,vn)+o2.ht,
      'نجمع حدود المجهول في طرف واحد.','تجميع الحدود'));
    cL=[q0,n1];cR=[kept];
    m1.push(S('نجمع الحدود المتشابهة',M.poly(cL,vn)+M.eq()+M.poly(cR,vn),'معامل '+vn+': '+l1.txt()+' '+o2.sym+' '+r1.abs().txt()+' = '+n1.txt()+'.','حساب'));
    l1=n1}
  var x=null,inf=false,none=false;
  if(l1.zero()){if((cR[0]||q0).zero())inf=true;else none=true;
    m1.push(S(inf?'متطابقة':'مستحيلة',M.n('0')+M.eq()+M.q(cR[0]||q0),
      inf?'الطرفان متطابقان لكل قيمة: عدد لا نهائي من الحلول.':'عبارة خاطئة: لا حلّ.','حالة خاصة'))}
  else{x=(cR[0]||q0).div(l1);
    if(!l1.one()){m1.push(S('نقسم الطرفين على المعامل',M.frac(M.poly(cL,vn),M.q(l1))+M.eq()+M.frac(M.q(cR[0]||q0),M.q(l1)),
      'القسمة على المعامل تعزل المجهول.','العملية المعاكسة'));
      m1.push(S('نحسب القسمة',M.v(vn)+M.eq()+M.q(cR[0]||q0)+M.op('÷')+M.q(l1)+M.eq()+M.q(x),'','حساب'))}
    m1.push(S('قيمة المجهول',M.v(vn)+M.eq()+M.q(x),'','النتيجة'))}
  /* طريقة النقل */
  var m2=[S('نكتب المعادلة',head,'نقل الحدّ من طرف إلى آخر يعكس إشارته.','قاعدة النقل'),
    S('ننقل مباشرًا',M.terms([{c:a,d:1}],vn)+M.eq()+M.q(b),'حدود المجهول يسارًا والأعداد يمينًا مع عكس الإشارة.','النقل بعكس الإشارة')];
  if(!a.zero()){m2.push(S('نقسم على المعامل',M.v(vn)+M.eq()+M.frac(M.q(b),M.q(a))+M.eq()+M.q(x),'','القسمة'));
    m2.push(S('النتيجة',M.v(vn)+M.eq()+M.q(x),'',''))}
  var lv=x?P.val(L,x):q0,rv=x?P.val(Rr,x):q0;
  return mk({topic:'linear',label:'معادلة · الدرجة الأولى',input:t,given:[{l:'المعادلة',h:head}],
    methods:[{name:'الميزان (خطوة خطوة)',steps:m1},{name:'النقل المباشر',steps:m2}],steps:m1,
    answer:{html:inf?M.all:none?M.empty:M.v(vn)+M.eq()+M.q(x),text:inf?'كل عدد حقيقي':none?'لا حلّ':vn+' = '+x.txt(),x:x?X.q(x):null},
    verify:x?{html:M.sub(L,vn,M.q(x))+M.eq()+M.q(lv)+M.sp()+M.sub(Rr,vn,M.q(x))+M.eq()+M.q(rv),
      ok:lv.eq(rv),note:'عوّضنا في الطرفين الأصليين فتساويا ✔'}:null,
    mistakes:x?[{v:x.neg().txt(),msg:'عكست إشارة الناتج — راجع خطوة القسمة.'},
      {v:b.txt(),msg:'نسيت القسمة على معامل المجهول ('+a.txt()+').'},
      {v:r0.add(l0).div(l1.add(r1)).txt(),msg:'جمعت الحدّ الثابت بدل طرحه عند النقل.'}]:[],
    practice:'linear'});
};
/* ══ جملة معادلتين — ثلاث طرق ══ */
SOL.system=function(t){
  var parts=DM.parts(t).filter(function(s){return s.indexOf('=')>=0});
  if(parts.length===3)return SOL.system3(t);
  if(parts.length!==2)throw new E('اكتب معادلتين مفصولتين بـ ؛ مثل 2س+3ص=12 ؛ س−ص=1','sys');
  var eqs=parts.map(function(p){var r=DM.relation(p);
    return{L:DM.parse(DM.toMath(r.left)),R:DM.parse(DM.toMath(r.right))}});
  var vs=[];eqs.forEach(function(e){DM.vars(e.L,vs);DM.vars(e.R,vs)});
  vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
  if(vs.length!==2)throw new E('الجملة تحتاج مجهولين مختلفين. وجدنا: '+(vs.join('، ')||'لا شيء'),'sys');
  var Xv=vs[0],Yv=vs[1];
  function co(e){var f=P.fadd(P.form(e.L),P.fscale(P.form(e.R),q(-1n)));
    return{a:f.v[Xv]||q0,b:f.v[Yv]||q0,c:f.c.neg()}}
  var e1=co(eqs[0]),e2=co(eqs[1]);
  function eh(e){var out='',first=true;
    if(!e.a.zero()){out+=(e.a.sign()<0?M.op('−'):'')+balance(e.a,Xv);first=false}
    if(!e.b.zero()){out+=first?((e.b.sign()<0?M.op('−'):'')+balance(e.b,Yv)):(M.op(e.b.sign()<0?'−':'+')+balance(e.b,Yv));first=false}
    return (first?M.n('0'):out)+M.eq()+M.q(e.c)}
  var head=M.lbl('(1)')+eh(e1)+M.sp()+M.lbl('(2)')+eh(e2);
  var det=e1.a.mul(e2.b).sub(e2.a.mul(e1.b));
  if(det.zero()){
    var ok=e1.c.mul(e2.b).sub(e2.c.mul(e1.b)).zero();
    return mk({topic:'system',label:'جملة معادلتين · حالة خاصة',input:t,given:[{l:'الجملة',h:head}],
      steps:[S('نحسب المحدّد',M.v('Δ')+M.eq()+M.q(e1.a)+M.op('×')+M.q(e2.b)+M.op('−')+M.q(e2.a)+M.op('×')+M.q(e1.b)+M.eq()+M.n('0'),
        'المحدّد صفر يعني المستقيمين متوازيان أو منطبقان.','محدّد الجملة'),
        S(ok?'منطبقان':'متوازيان',ok?M.txt('عدد لا نهائي من الحلول'):M.empty,
          ok?'المعادلتان مضاعفة إحداهما للأخرى.':'لا نقطة تقاطع بين المستقيمين.','التفسير البياني')],
      answer:{html:ok?M.txt('∞ حلول'):M.empty,text:ok?'عدد لا نهائي':'لا حلّ'}});
  }
  var dx=e1.c.mul(e2.b).sub(e2.c.mul(e1.b)),dy=e1.a.mul(e2.c).sub(e2.a.mul(e1.c));
  var xv=dx.div(det),yv=dy.div(det);
  /* الحذف */
  var m1=[S('نرتّب الجملة',head,'نضع كل معادلة على الشكل أ'+Xv+' + ب'+Yv+' = ج.','الصورة العامة')];
  if(e1.b.zero()||e2.b.zero()){
    var src=e1.b.zero()?e1:e2,oth=e1.b.zero()?e2:e1;
    xv=src.c.div(src.a);
    m1.push(S('معادلة بمجهول واحد',M.v(Xv)+M.eq()+M.q(src.c)+M.op('÷')+M.q(src.a)+M.eq()+M.q(xv),'لا حاجة للحذف.','قسمة مباشرة'));
    var rh=oth.c.sub(oth.a.mul(xv));yv=rh.div(oth.b);
    m1.push(S('نعوّض في الأخرى',M.q(oth.a)+M.op('×')+M.par(M.q(xv))+M.op('+')+M.q(oth.b)+M.v(Yv)+M.eq()+M.q(oth.c),'','التعويض'),
      S('نطرح ثم نقسم',M.v(Yv)+M.eq()+M.frac(M.q(rh),M.q(oth.b))+M.eq()+M.q(yv),'','حلّ معادلة'));
  }else{
    var k1=e2.b.abs(),k2=e1.b.abs();
    var A1=e1.a.mul(k1),A2=e2.a.mul(k2),C1=e1.c.mul(k1),C2=e2.c.mul(k2);
    var same=(e1.b.mul(k1).sign()>0)===(e2.b.mul(k2).sign()>0),sym=same?'−':'+';
    var aD=same?A1.sub(A2):A1.add(A2),cD=same?C1.sub(C2):C1.add(C2);
    m1.push(S('نوحّد معامل '+Yv,M.lbl('(1)×'+k1.txt())+eh({a:A1,b:e1.b.mul(k1),c:C1})+M.sp()+M.lbl('(2)×'+k2.txt())+eh({a:A2,b:e2.b.mul(k2),c:C2}),
      'نضرب كل معادلة في عدد يجعل معاملي '+Yv+' متساويين بالقيمة المطلقة.','توحيد المعاملات'),
      S(same?'نطرح (2) من (1)':'نجمع (1) و(2)',M.par(M.q(A1)+M.op(sym)+M.q(A2))+M.v(Xv)+M.eq()+M.q(C1)+M.op(sym)+M.q(C2),
        same?'المعاملان بالإشارة نفسها فالطرح يحذفهما.':'المعاملان متعاكسان فالجمع يحذفهما.','الحذف'),
      S('نحسب',M.terms([{c:aD,d:1}],Xv)+M.eq()+M.q(cD),'معامل '+Xv+': '+A1.txt()+' '+sym+' '+A2.txt()+' = '+aD.txt()+'.','حساب'),
      S('نقسم',M.v(Xv)+M.eq()+M.frac(M.q(cD),M.q(aD))+M.eq()+M.q(xv),'','القسمة'));
    var rh2=e1.c.sub(e1.a.mul(xv));yv=rh2.div(e1.b);
    m1.push(S('نعوّض في (1)',M.q(e1.a)+M.op('×')+M.par(M.q(xv))+M.op('+')+M.q(e1.b)+M.v(Yv)+M.eq()+M.q(e1.c),'','التعويض'),
      S('نطرح من الطرفين',M.q(e1.b)+M.v(Yv)+M.eq()+M.q(e1.c)+M.op('−')+M.q(e1.a.mul(xv))+M.eq()+M.q(rh2),'','العملية المعاكسة'),
      S('نقسم',M.v(Yv)+M.eq()+M.frac(M.q(rh2),M.q(e1.b))+M.eq()+M.q(yv),'','القسمة'));
  }
  /* التعويض */
  var m2=[S('نستخرج مجهولًا من (1)',M.v(Yv)+M.eq()+M.frac(M.q(e1.c)+M.op('−')+M.q(e1.a)+M.v(Xv),M.q(e1.b)),
    'نعزل '+Yv+' بدلالة '+Xv+'.','التعويض'),
    S('نعوّض في (2)',M.q(e2.a)+M.v(Xv)+M.op('+')+M.q(e2.b)+M.par(M.frac(M.q(e1.c)+M.op('−')+M.q(e1.a)+M.v(Xv),M.q(e1.b)))+M.eq()+M.q(e2.c),
    'نستبدل '+Yv+' بعبارتها فتصبح المعادلة بمجهول واحد.','التعويض'),
    S('نحلّ المعادلة الناتجة',M.v(Xv)+M.eq()+M.q(xv),'بعد فكّ الأقواس والتجميع.','حلّ خطية'),
    S('نعود لإيجاد '+Yv,M.v(Yv)+M.eq()+M.q(yv),'نعوّض قيمة '+Xv+' في العبارة المستخرجة.','التعويض العكسي')];
  /* كرامر */
  var m3=[S('نكتب مصفوفة المعاملات',M.brk(M.q(e1.a)+M.op(',')+M.q(e1.b)+M.txt(' ; ')+M.q(e2.a)+M.op(',')+M.q(e2.b)),
    'المحدّد يقيس استقلال المعادلتين.','مصفوفة المعاملات'),
    S('المحدّد Δ',M.v('Δ')+M.eq()+M.q(e1.a)+M.op('×')+M.q(e2.b)+M.op('−')+M.q(e2.a)+M.op('×')+M.q(e1.b)+M.eq()+M.q(det),
      'Δ = أ₁ب₂ − أ₂ب₁.','قاعدة كرامر'),
    S('محدّد '+Xv,M.v('Δx')+M.eq()+M.q(e1.c)+M.op('×')+M.q(e2.b)+M.op('−')+M.q(e2.c)+M.op('×')+M.q(e1.b)+M.eq()+M.q(dx),'نستبدل عمود '+Xv+' بعمود الثوابت.','كرامر'),
    S('محدّد '+Yv,M.v('Δy')+M.eq()+M.q(e1.a)+M.op('×')+M.q(e2.c)+M.op('−')+M.q(e2.a)+M.op('×')+M.q(e1.c)+M.eq()+M.q(dy),'نستبدل عمود '+Yv+' بعمود الثوابت.','كرامر'),
    S('القسمة',M.v(Xv)+M.eq()+M.frac(M.q(dx),M.q(det))+M.eq()+M.q(xv)+M.sp()+M.v(Yv)+M.eq()+M.frac(M.q(dy),M.q(det))+M.eq()+M.q(yv),'','كرامر')];
  var v1=e1.a.mul(xv).add(e1.b.mul(yv)),v2=e2.a.mul(xv).add(e2.b.mul(yv));
  return mk({topic:'system',label:'جملة معادلتين بمجهولين',input:t,given:[{l:'الجملة',h:head}],
    methods:[{name:'الحذف',steps:m1},{name:'التعويض',steps:m2},{name:'المحدّدات (كرامر)',steps:m3}],steps:m1,
    answer:{html:M.v(Xv)+M.eq()+M.q(xv)+M.sp()+M.v(Yv)+M.eq()+M.q(yv),text:Xv+' = '+xv.txt()+' ، '+Yv+' = '+yv.txt(),x:X.q(xv)},
    verify:{html:M.lbl('(1)')+M.q(v1)+M.eq()+M.q(e1.c)+M.sp()+M.lbl('(2)')+M.q(v2)+M.eq()+M.q(e2.c),
      ok:v1.eq(e1.c)&&v2.eq(e2.c),note:'الزوج يحقّق المعادلتين معًا ✔'},practice:'sys'});
};
/* ══ جملة ثلاث معادلات ══ */
SOL.system3=function(t){
  var parts=DM.parts(t).filter(function(s){return s.indexOf('=')>=0});
  if(parts.length!==3)throw new E('اكتب ثلاث معادلات مفصولة بـ ؛','sys3');
  var vs=[];var rows=parts.map(function(p){var r=DM.relation(p);
    var f=P.fadd(P.form(DM.parse(DM.toMath(r.left))),P.fscale(P.form(DM.parse(DM.toMath(r.right))),q(-1n)));
    Object.keys(f.v).forEach(function(k){if(vs.indexOf(k)<0)vs.push(k)});return f});
  if(vs.length!==3)throw new E('الجملة تحتاج ثلاثة مجاهيل مختلفة.','sys3');
  var A=rows.map(function(f){return vs.map(function(v){return f.v[v]||q0})});
  var B=rows.map(function(f){return f.c.neg()});
  function det3(m){
    return m[0][0].mul(m[1][1].mul(m[2][2]).sub(m[1][2].mul(m[2][1])))
      .sub(m[0][1].mul(m[1][0].mul(m[2][2]).sub(m[1][2].mul(m[2][0])))
      .add(m[0][2].mul(m[1][0].mul(m[2][1]).sub(m[1][1].mul(m[2][0]))));
  }
  var D=det3(A);
  if(D.zero())return mk({topic:'system3',label:'جملة ثلاثية · محدّد صفر',input:t,
    steps:[S('نحسب المحدّد',M.v('Δ')+M.eq()+M.n('0'),'المحدّد صفر: لا حلّ وحيد.','محدّد')],
    answer:{html:M.txt('لا حلّ وحيد'),text:'لا حلّ وحيد'}});
  var sols=vs.map(function(_,i){
    var Mi=A.map(function(row,r){return row.map(function(v,c){return c===i?B[r]:v})});
    return det3(Mi).div(D)});
  var steps=[S('نكتب الجملة',rows.map(function(f,i){
    return M.lbl('('+String(i+1)+')')+M.terms(vs.map(function(v){return{c:f.v[v]||q0,d:1}}).map(function(o,j){return{c:o.c,d:1}}),vs[0]).length?
      vs.map(function(v,j){var c=f.v[v]||q0;return c.zero()?'':(j?M.op(c.sign()<0?'−':'+'):(c.sign()<0?M.op('−'):''))+balance(c.abs(),v)}).join('')+M.eq()+M.q(f.c.neg()):M.n('0')
  }).join(M.sp()),'ثلاث معادلات بثلاثة مجاهيل.','الصورة العامة'),
    S('نحسب المحدّد العام',M.v('Δ')+M.eq()+M.q(D),'نوسّع على السطر الأول.','محدّد 3×3')];
  vs.forEach(function(v,i){steps.push(S('محدّد '+v,M.v('Δ'+v)+M.eq()+M.q(sols[i].mul(D)),'نستبدل عمود '+v+' بالثوابت.','كرامر'),
    S('قيمة '+v,M.v(v)+M.eq()+M.frac(M.q(sols[i].mul(D)),M.q(D))+M.eq()+M.q(sols[i]),'','القسمة'))});
  var checks=rows.map(function(f,r){var s=q0;vs.forEach(function(v,i){s=s.add((f.v[v]||q0).mul(sols[i]))});return s});
  return mk({topic:'system3',label:'جملة ثلاث معادلات',input:t,steps:steps,
    answer:{html:vs.map(function(v,i){return M.v(v)+M.eq()+M.q(sols[i])}).join(M.sp()),
      text:vs.map(function(v,i){return v+' = '+sols[i].txt()}).join(' ، '),x:X.q(sols[0])},
    verify:{html:checks.map(function(c,i){return M.lbl('('+String(i+1)+')')+M.q(c)+M.eq()+M.q(B[i])}).join(M.sp()),
      ok:checks.every(function(c,i){return c.eq(B[i])}),note:'الثلاث معادلات محقّقة ✔'}});
};
/* ══ الدرجة الثانية — ثلاث طرق، جذور مضبوطة ══ */
SOL.quadratic=function(t){
  var r=rel(t),vs=DM.vars(DM.parse(DM.toMath(r.left))).concat(DM.vars(DM.parse(DM.toMath(r.right))));
  vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
  if(vs.length!==1)throw new E('المعادلة التربيعية بمجهول واحد.','quad');
  var vn=vs[0],L=side(r.left,vn,2),Rr=side(r.right,vn,2),Pp=P.sub(L,Rr);
  var a=P.get(Pp,2),b=P.get(Pp,1),c=P.get(Pp,0);
  if(a.zero())return SOL.linear(t);
  var head=M.poly(L,vn)+M.eq()+M.poly(Rr,vn);
  var b2=b.mul(b),fac=q(4n).mul(a).mul(c),D=b2.sub(fac);
  var base=[S('نكتب المعادلة',head,'',''),
    S('نرتّب على الصورة العامة',M.poly(Pp,vn)+M.eq()+M.n('0'),'ننقل كل الحدود إلى طرف واحد.','الصورة أ س²+ب س+ج=0'),
    S('نحدّد المعاملات',M.lbl('أ')+M.q(a)+M.sp()+M.lbl('ب')+M.q(b)+M.sp()+M.lbl('ج')+M.q(c),'المعاملات تشمل إشاراتها.','قراءة المعاملات')];
  if(D.sign()<0){
    return mk({topic:'quadratic',label:'معادلة تربيعية · لا حلّ حقيقي',input:t,given:[{l:'المعادلة',h:head}],
      steps:base.concat([S('نحسب المميّز',M.v('Δ')+M.eq()+M.q(b2)+M.op('−')+M.par(M.q(fac))+M.eq()+M.q(D),'Δ = ب² − 4أج.','المميّز'),
        S('Δ سالب',M.q(D)+M.op('<')+M.n('0'),'لا جذر حقيقي لعدد سالب، فالمنحنى لا يقطع محور السينات.','إشارة المميّز')]),
      answer:{html:M.empty,text:'لا حلّ في ℝ'},practice:'quad'});
  }
  var sq=R.sqrtQ(D),exact=!!sq;
  var x1,x2,x1x,x2x;
  if(exact){var sr=sq.asQ();
    if(sr){x1=b.neg().add(sr).div(q2.mul(a));x2=b.neg().sub(sr).div(q2.mul(a));x1x=X.q(x1);x2x=X.q(x2)}
    else{var twoA=q2.mul(a);
      x1x=X.rad(R.div(sq.neg().add(R.q(b.neg())),R.q(twoA)));
      x2x=X.rad(R.div(sq.neg().sub(R.q(b)),R.q(twoA)));}
  }else{var dv=D.val(),av=a.val();
    x1x=X.n((-b.val()+Math.sqrt(dv))/(2*av));x2x=X.n((-b.val()-Math.sqrt(dv))/(2*av))}
  /* القانون العام */
  var mF=base.concat([
    S('نحسب المميّز',M.v('Δ')+M.eq()+M.sup(M.v('ب'),M.n('2'))+M.op('−')+M.n('4')+M.v('أ')+M.v('ج')+M.eq()+M.q(b2)+M.op('−')+M.par(M.q(fac))+M.eq()+M.q(D),
      'إشارة Δ تحدّد عدد الحلول وطبيعتها.','المميّز'),
    S('طبيعة الحلّين',D.zero()?M.txt('Δ = 0 → حلّ مضاعف'):exact?M.txt('Δ مربع كامل → حلّان نسبيان'):M.txt('Δ موجب غير مربع → حلّان جذريان'),
      'نوع Δ يحدّد شكل الجذور.','تصنيف الحلول'),
    S('القانون العام',M.v(vn)+M.eq()+M.frac(M.op('−')+M.v('ب')+M.op('±')+M.root(M.v('Δ')),M.n('2')+M.v('أ')),'قانون يحلّ كل معادلة تربيعية.','القانون العام'),
    S('نعوّض',M.v(vn)+M.eq()+M.frac(M.q(b.neg())+M.op('±')+(exact?M.x(X.rad(sq)):M.root(M.q(D))),M.q(q2.mul(a))),'','التعويض'),
    S('الحلّان',M.v(vn)+'₁'+M.eq()+M.xa(x1x)+M.sp()+M.v(vn)+'₂'+M.eq()+M.xa(x2x),'نفصل حالتي ± .','الحلّان')]);
  /* التحليل */
  var mFac=null;
  if(a.one()&&b.int()&&c.int()){
    var bn=Number(b.n),cn=Number(c.n),pp=null,qq=null,i;
    if(cn===0){pp=0;qq=bn}else for(i=-Math.abs(cn)-2;i<=Math.abs(cn)+2;i++)if(i!==0&&cn%i===0&&i+cn/i===bn){pp=i;qq=cn/i;break}
    if(pp!==null){
      mFac=base.concat([S('نبحث عن عددين',M.txt('م + ن = '+bn)+M.sp()+M.txt('م × ن = '+cn),
        'مجموعهما معامل '+vn+' وجداؤهما الحدّ الثابت.','شرط التحليل'),
        S('العددان',M.n(String(pp))+M.sp()+M.n(String(qq)),'تحقّقنا من الشرطين معًا.','إيجاد العددين'),
        S('نحلّل',M.poly(Pp,vn)+M.eq()+M.par(M.v(vn)+M.op(pp>=0?'+':'−')+M.n(String(Math.abs(pp))))+M.par(M.v(vn)+M.op(qq>=0?'+':'−')+M.n(String(Math.abs(qq)))),
          'نكتب الحدودية جداء قوسين.','التحليل'),
        S('جداء معدوم',M.txt('أحد القوسين = 0'),'الجداء يساوي صفرًا فقط إذا كان أحد العاملين صفرًا.','خاصية الجداء المعدوم'),
        S('الحلّان',M.v(vn)+M.eq()+M.n(String(-pp))+M.sp()+M.v(vn)+M.eq()+M.n(String(-qq)),'نحلّ كل قوس على حدة.','حلّ خطية')]);
    }
  }
  /* إكمال المربع */
  var mSq=base.concat([
    S('نقسم على أ',M.poly(P.scale(Pp,q1.div(a)),vn)+M.eq()+M.n('0'),'نجعل معامل المربّع 1.','توحيد المعامل'),
    S('ننقل الحدّ الثابت',M.sup(M.v(vn),M.n('2'))+M.op(b.div(a).sign()<0?'−':'+')+M.q(b.div(a).abs())+M.eq()+M.q(c.div(a).neg()),'','النقل'),
    S('نضيف مربّع نصف المعامل',M.sup(M.par(M.v(vn)+M.op(b.div(a).sign()<0?'−':'+')+M.q(b.div(a).abs().div(q2))),M.n('2'))+M.eq()+M.q(b.div(a).abs().div(q2).pow(2).sub(c.div(a))),
      'نضيف (ب/2أ)² للطرفين فيصبح الطرف الأيسر مربّعًا كاملًا.','إكمال المربّع'),
    S('نأخذ الجذر',M.v(vn)+M.op(b.div(a).sign()<0?'−':'+')+M.q(b.div(a).abs().div(q2))+M.eq()+M.op('±')+M.root(M.q(b.div(a).abs().div(q2).pow(2).sub(c.div(a)))),
      'الجذر يعطي حالتين ±.','الجذر التربيعي'),
    S('الحلّان',M.v(vn)+'₁'+M.eq()+M.xa(x1x)+M.sp()+M.v(vn)+'₂'+M.eq()+M.xa(x2x),'','النتيجة')]);
  var methods=[{name:'القانون العام',steps:mF}];
  if(mFac)methods.unshift({name:'التحليل',steps:mFac});
  methods.push({name:'إكمال المربّع',steps:mSq});
  var sum=x1x.add(x2x),prod=x1x.mul(x2x);
  return mk({topic:'quadratic',label:'معادلة · الدرجة الثانية',input:t,given:[{l:'المعادلة',h:head}],
    methods:methods,steps:methods[0].steps,
    answer:{html:M.v(vn)+'₁'+M.eq()+M.xa(x1x)+M.sp()+M.v(vn)+'₂'+M.eq()+M.xa(x2x),
      text:vn+'₁ = '+DM.render.text(x1x)+' ، '+vn+'₂ = '+DM.render.text(x2x),x:x1x},
    verify:{html:M.lbl('المجموع')+M.xa(sum)+M.eq()+M.q(b.neg().div(a))+M.sp()+M.lbl('الجداء')+M.xa(prod)+M.eq()+M.q(c.div(a)),
      ok:Math.abs(sum.val()+b.div(a).val())<1e-9&&Math.abs(prod.val()-c.div(a).val())<1e-9,
      note:'مجموع الجذرين = −ب/أ وجداؤهما = ج/أ (علاقات فييت) ✔'},
    extra:{discriminant:D,nature:D.zero()?'مضاعف':exact?'نسبيان':'جذريان'},practice:'quad'});
};
/* ══ الدرجة الثالثة بجذور نسبية ══ */
SOL.cubic=function(t){
  var r=rel(t),vs=DM.vars(DM.parse(DM.toMath(r.left)));
  var vn=vs[0],L=side(r.left,vn,4),Rr=side(r.right,vn,4),Pp=P.sub(L,Rr);
  var steps=[S('نرتّب الحدودية',M.poly(Pp,vn)+M.eq()+M.n('0'),'','الصورة العامة')];
  var lead=Pp[Pp.length-1],konst=Pp[0];
  var cands=[],pDiv=DM.num.divisors(Number(konst.n)||1),qDiv=DM.num.divisors(Number(lead.n)||1);
  pDiv.forEach(function(p){qDiv.forEach(function(d){[1,-1].forEach(function(s){
    var v=new Q(BigInt(s*p),BigInt(d));if(!cands.some(function(z){return z.eq(v)}))cands.push(v)})})});
  var root=null;
  for(var i=0;i<cands.length&&i<200;i++){if(P.val(Pp,cands[i]).zero()){root=cands[i];break}}
  if(!root)return mk({topic:'cubic',label:'حدودية درجة عالية',input:t,
    steps:steps.concat([S('نجرّب الجذور النسبية',M.txt('±قواسم الحدّ الثابت ÷ قواسم المعامل الرئيسي'),
      'نظرية الجذر النسبي تحصر المرشّحين.','نظرية الجذر النسبي'),S('لا جذر نسبي',M.txt('الجذور غير نسبية؛ يلزم حلّ عددي.'),'','')]),
    answer:{html:M.txt('لا جذر نسبي'),text:'لا جذر نسبي'}});
  var div=P.div(Pp,[root.neg(),q1]);
  steps.push(S('نجرّب الجذور النسبية',M.txt('المرشّحون: ±قواسم '+konst.txt()+' ÷ قواسم '+lead.txt()),
    'كل جذر نسبي يكتب p/q حيث p يقسم الحدّ الثابت و q يقسم المعامل الرئيسي.','نظرية الجذر النسبي'),
    S('وجدنا جذرًا',M.v(vn)+M.eq()+M.q(root),'بالتعويض أعطى صفرًا.','التحقّق بالتعويض'),
    S('نقسم على ( '+vn+' − '+root.txt()+' )',M.poly(Pp,vn)+M.eq()+M.par(M.v(vn)+M.op(root.sign()<0?'+':'−')+M.q(root.abs()))+M.par(M.poly(div.q,vn)),
      'القسمة المطوّلة تعطي حدودية أقلّ درجة بباقٍ صفر.','القسمة المطوّلة'));
  var quad=div.q;
  if(P.deg(quad)===2){
    var a2=P.get(quad,2),b2=P.get(quad,1),c2=P.get(quad,0),D2=b2.mul(b2).sub(q(4n).mul(a2).mul(c2));
    steps.push(S('نحلّ الثلاثي الباقي',M.poly(quad,vn)+M.eq()+M.n('0'),'',''));
    if(D2.sign()>=0){var s2=R.sqrtQ(D2);
      var r1=X.rad(R.div(R.q(b2.neg()).add(s2),R.q(q2.mul(a2)))),r2=X.rad(R.div(R.q(b2.neg()).sub(s2),R.q(q2.mul(a2))));
      steps.push(S('المميّز',M.v('Δ')+M.eq()+M.q(D2),'','المميّز'),
        S('الجذران الآخران',M.xa(r1)+M.sp()+M.xa(r2),'بالقانون العام.','القانون العام'));
      return mk({topic:'cubic',label:'معادلة · الدرجة الثالثة',input:t,steps:steps,
        answer:{html:M.set([M.q(root),M.x(r1),M.x(r2)]),text:root.txt()+' , '+DM.render.text(r1)+' , '+DM.render.text(r2),x:X.q(root)}});
    }
    steps.push(S('لا جذور حقيقية أخرى',M.v('Δ')+M.eq()+M.q(D2)+M.op('<')+M.n('0'),'',''));
  }else if(P.deg(quad)===1){var r3=P.get(quad,0).neg().div(P.get(quad,1));
    steps.push(S('الجذر الآخر',M.v(vn)+M.eq()+M.q(r3),'',''));
    return mk({topic:'cubic',label:'معادلة · الدرجة الثالثة',input:t,steps:steps,
      answer:{html:M.set([M.q(root),M.q(r3)]),text:root.txt()+' , '+r3.txt(),x:X.q(root)})}
  return mk({topic:'cubic',label:'معادلة · الدرجة الثالثة',input:t,steps:steps,
    answer:{html:M.set([M.q(root)]),text:root.txt(),x:X.q(root)}});
};
/* ══ معادلة كسرية مع مجال وتحقّق ══ */
SOL.rational=function(t){
  var r=rel(t);if(r.op!=='=')throw new E('المتراجحات الكسرية لها قسم خاص.','rat');
  var vs=DM.vars(DM.parse(DM.toMath(r.left))).concat(DM.vars(DM.parse(DM.toMath(r.right))));
  vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
  if(vs.length!==1)throw new E('معادلة كسرية بمجهول واحد.','rat');
  var vn=vs[0];
  var dens=[];
  (function walk(n){if(!n)return;
    if(n.t==='bin'&&n.op==='/'){try{var d=P.toPoly(n.r,vn,3);if(P.deg(d)>0)dens.push(d)}catch(e){}}
    if(n.a){Array.isArray(n.a)?n.a.forEach(walk):walk(n.a)}if(n.l){walk(n.l);walk(n.r)}})(DM.parse(DM.toMath(r.left)));
  (function walk(n){if(!n)return;
    if(n.t==='bin'&&n.op==='/'){try{var d=P.toPoly(n.r,vn,3);if(P.deg(d)>0)dens.push(d)}catch(e){}}
    if(n.a){Array.isArray(n.a)?n.a.forEach(walk):walk(n.a)}if(n.l){walk(n.l);walk(n.r)}})(DM.parse(DM.toMath(r.right)));
  if(!dens.length)throw new E('لا يوجد مقام فيه مجهول.','rat');
  var banned=[];
  dens.forEach(function(d){if(P.deg(d)===1){var v=P.get(d,0).neg().div(P.get(d,1));if(!banned.some(function(z){return z.eq(v)}))banned.push(v)}});
  var steps=[S('نعيّن المجال',M.txt(vn+' ≠ '+(banned.map(function(b){return b.txt()}).join(' , ')||'—')),
    'المقام لا يساوي صفرًا؛ نستبعد القيم التي تُصفره قبل الحلّ.','شرط المقام')];
  var L=DM.parse(DM.toMath(r.left)),Rr=DM.parse(DM.toMath(r.right));
  var lcd=dens.reduce(function(a,d){return P.mul(a,d)},[q1]);
  function mulThrough(n){
    if(n.t==='bin'&&n.op==='/'){var den=P.toPoly(n.r,vn,3);
      if(P.deg(den)>0){var f=P.div(lcd,den);return{t:'bin',op:'*',l:DM.clone(n.l),r:{t:'num',v:q1}}}
    }
    if(n.t==='bin')return{t:'bin',op:n.op,l:mulThrough(n.l),r:mulThrough(n.r)};
    if(n.t==='par')return{t:'par',a:mulThrough(n.a)};
    if(n.t==='neg')return{t:'neg',a:mulThrough(n.a)};
    return DM.clone(n);
  }
  steps.push(S('نضرب الطرفين في م.م.أ المقامات',M.poly(lcd,vn),'التخلّص من المقامات يحوّلها إلى معادلة حدودية، بشرط المجال.','ضرب في المقام المشترك'));
  var NL=P.mul(P.toPoly(mulThrough(L),vn,4),[q1]),NR=P.mul(P.toPoly(mulThrough(Rr),vn,4),[q1]);
  var eq=P.sub(NL,NR);
  steps.push(S('المعادلة الحدودية',M.poly(eq,vn)+M.eq()+M.n('0'),'بعد التوزيع والتجميع.','تبسيط'));
  var roots=[];
  if(P.deg(eq)===1)roots=[P.get(eq,0).neg().div(P.get(eq,1))];
  else if(P.deg(eq)===2){var a=P.get(eq,2),b=P.get(eq,1),c=P.get(eq,0),D=b.mul(b).sub(q(4n).mul(a).mul(c));
    if(D.sign()>=0){var s=R.sqrtQ(D),sq2=s.asQ();
      if(sq2){roots=[b.neg().add(sq2).div(q2.mul(a)),b.neg().sub(sq2).div(q2.mul(a))]}}}
  var accepted=[],rejected=[];
  roots.forEach(function(v){
    var bad=banned.some(function(z){return z.eq(v)});
    var zeroDen=dens.some(function(d){return P.val(d,v).zero()});
    if(bad||zeroDen)rejected.push(v);else accepted.push(v);
  });
  if(rejected.length)steps.push(S('نستبعد الحلول الدخيلة',rejected.map(M.q).join(M.op(',')),
    'هذه القيم تُصفّر مقامًا في المعادلة الأصلية فهي ليست حلولًا رغم أنها حلّت الحدودية.','الحلول الدخيلة'));
  steps.push(S('الحلول المقبولة',accepted.length?M.set(accepted.map(M.q)):M.empty,'تحقّقنا من المجال ومن المقامات.','التحقّق'));
  return mk({topic:'rational',label:'معادلة كسرية',input:t,steps:steps,
    warnings:rejected.length?['استُبعدت '+rejected.length+' قيمة دخيلة لأنّها تُصفّر المقام.']:[]
    ,answer:{html:accepted.length?M.set(accepted.map(M.q)):M.empty,text:accepted.length?accepted.map(function(v){return v.txt()}).join(' , '):'لا حلّ',x:accepted[0]?X.q(accepted[0]):null},
    verify:accepted[0]?{html:M.sub(dens[0],vn,M.q(accepted[0]))+M.op('≠')+M.n('0'),ok:!P.val(dens[0],accepted[0]).zero(),note:'المقام لا يساوي صفرًا عند الحلّ ✔'}:null});
};
/* ══ معادلة جذرية مع كشف الدخيل ══ */
SOL.radicalEq=function(t){
  var r=rel(t),vs=DM.vars(DM.parse(DM.toMath(r.left)));
  var vn=vs[0]||'س';
  var m=r.left.match(/(?:√|sqrt)\s*\(?([^)]+?)\)?\s*([+\-]\s*\d+)?$/);
  var inner=null,k=q0,rhs=Q.parse(r.right.replace(/[^\d.\-/]/g,'')||'0');
  var mm=r.left.match(/(?:√|sqrt)\s*\(([^)]+)\)|(?:√|sqrt)\s*([A-Za-z\u0621-\u064A0-9+\-*/^ ]+)/);
  if(mm)inner=(mm[1]||mm[2]).trim();
  if(!inner)throw new E('اكتب مثل √(2س+3) = 5','radeq');
  var iP=P.toPoly(DM.parse(DM.toMath(inner)),vn,2);
  var steps=[S('نعيّن الشرط',M.poly(iP,vn)+M.op('≥')+M.n('0'),'ما تحت الجذر التربيعي غير سالب، والطرف الآخر غير سالب أيضًا.','شرط الجذر'),
    S('نعزل الجذر',M.root(M.poly(iP,vn))+M.eq()+M.q(rhs),'الجذر وحده في طرف قبل التربيع.','العزل'),
    S('نربّع الطرفين',M.poly(iP,vn)+M.eq()+M.q(rhs.pow(2)),'التربيع يزيل الجذر لكنه قد يُدخل حلولًا دخيلة.','تربيع الطرفين')];
  var eq=P.sub(iP,[rhs.pow(2)]),cands=[];
  if(P.deg(eq)===1)cands=[P.get(eq,0).neg().div(P.get(eq,1))];
  else if(P.deg(eq)===2){var a=P.get(eq,2),b=P.get(eq,1),c=P.get(eq,0),D=b.mul(b).sub(q(4n).mul(a).mul(c));
    if(D.sign()>=0){var s=R.sqrtQ(D).asQ();if(s)cands=[b.neg().add(s).div(q2.mul(a)),b.neg().sub(s).div(q2.mul(a))]}}
  var good=[],bad=[];
  cands.forEach(function(v){
    var rad=P.val(iP,v);
    if(rad.sign()<0||rhs.sign()<0){bad.push(v);return}
    var lv=Math.sqrt(rad.val());
    if(Math.abs(lv-rhs.val())<1e-9)good.push(v);else bad.push(v);
  });
  steps.push(S('نحلّ المعادلة الناتجة',cands.length?cands.map(M.q).join(M.op(',')):M.empty,'',''));
  steps.push(S('نتحقّق في المعادلة الأصلية',good.length?good.map(function(v){
    return M.root(M.q(P.val(iP,v)))+M.eq()+M.q(rhs)}).join(M.sp()):M.empty,
    'التربيع ليس عملية عكسية دائمًا؛ لا بدّ من التعويض في الأصل.','كشف الحلول الدخيلة'));
  if(bad.length)steps.push(S('نستبعد الدخيل',bad.map(M.q).join(M.op(',')),'لم يحقّق المعادلة الأصلية أو خالف شرط الجذر.','استبعاد'));
  return mk({topic:'radicalEq',label:'معادلة جذرية',input:t,steps:steps,
    warnings:bad.length?['استُبعدت '+bad.length+' قيمة دخيلة ناتجة عن التربيع.']:[],
    answer:{html:good.length?M.set(good.map(M.q)):M.empty,text:good.length?good.map(function(v){return v.txt()}).join(' , '):'لا حلّ',x:good[0]?X.q(good[0]):null}});
};
/* ══ معادلة قيمة مطلقة ══ */
SOL.absEq=function(t){
  var r=rel(t),vn=(DM.vars(DM.parse(DM.toMath(r.left)))[0])||'س';
  var m=r.left.match(/abs\((.+)\)|\|(.+)\|/);
  if(!m)throw new E('اكتب مثل |2س−3| = 7','abseq');
  var inner=P.toPoly(DM.parse(DM.toMath(m[1]||m[2])),vn,2),rhs=Q.parse(r.right);
  var steps=[S('نكتب المعادلة',M.abs(M.poly(inner,vn))+M.eq()+M.q(rhs),'القيمة المطلقة تعني البعد عن الصفر.','تعريف القيمة المطلقة')];
  if(rhs.sign()<0)return mk({topic:'absEq',label:'معادلة قيمة مطلقة · مستحيلة',input:t,
    steps:steps.concat([S('الطرف الأيمن سالب',M.q(rhs)+M.op('<')+M.n('0'),'القيمة المطلقة لا تكون سالبة أبدًا.','خاصية القيمة المطلقة')]),
    answer:{html:M.empty,text:'لا حلّ'}});
  var sols=[];
  [rhs,rhs.neg()].forEach(function(target){
    var eq=P.sub(inner,[target]);
    if(P.deg(eq)===1)sols.push(P.get(eq,0).neg().div(P.get(eq,1)));
    else if(P.deg(eq)===2){var a=P.get(eq,2),b=P.get(eq,1),c=P.get(eq,0),D=b.mul(b).sub(q(4n).mul(a).mul(c));
      if(D.sign()>=0){var s=R.sqrtQ(D).asQ();if(s){sols.push(b.neg().add(s).div(q2.mul(a)));sols.push(b.neg().sub(s).div(q2.mul(a)))}}}
  });
  sols=sols.filter(function(v,i){return sols.findIndex(function(z){return z.eq(v)})===i});
  steps.push(S('نفصل الحالتين',M.poly(inner,vn)+M.eq()+M.q(rhs)+M.sp()+M.txt('أو')+M.sp()+M.poly(inner,vn)+M.eq()+M.q(rhs.neg()),
    '|أ| = ب يعني أ = ب أو أ = −ب عندما ب ≥ 0.','تعريف القيمة المطلقة'),
    S('نحلّ كل حالة',sols.map(M.q).join(M.op(',')),'كل حالة معادلة عادية.','حلّ معادلتين'),
    S('نتحقّق',sols.map(function(v){return M.abs(M.q(P.val(inner,v)))+M.eq()+M.q(rhs)}).join(M.sp()),'نعوّض في الأصل.','التحقّق'));
  return mk({topic:'absEq',label:'معادلة قيمة مطلقة',input:t,steps:steps,
    answer:{html:M.set(sols.map(M.q)),text:sols.map(function(v){return v.txt()}).join(' , '),x:sols[0]?X.q(sols[0]):null}});
};
/* ══ معادلة أسية ══ */
SOL.exponential=function(t){
  var r=rel(t);
  var m=r.raw.match(/(\d+)\s*\^\s*\(?([A-Za-z\u0621-\u064A0-9+\-*/ ]+)\)?\s*=\s*(\d+)/);
  if(!m)throw new E('اكتب مثل 2^(س+1) = 32','exp');
  var base=Number(m[1]),ex=m[2].trim(),target=Number(m[3]);
  var k=Math.log(target)/Math.log(base);
  var exact=Math.abs(k-Math.round(k))<1e-9;
  var steps=[S('نكتب المعادلة',M.sup(M.n(String(base)),M.txt(ex))+M.eq()+M.n(String(target)),'نحاول توحيد الأساسين.','المعادلة الأسية')];
  if(exact){
    steps.push(S('نوحّد الأساس',M.n(String(target))+M.eq()+M.sup(M.n(String(base)),M.n(String(Math.round(k)))),'نكتب الطرف الأيمن قوة للأساس نفسه.','توحيد الأساس'),
      S('نساوي الأسّين',M.txt(ex)+M.eq()+M.n(String(Math.round(k))),'إذا تساوى الأساسان (≠1) تساوى الأسّان.','تساوي الأسس'));
    var vn=DM.vars(DM.parse(DM.toMath(ex)))[0];
    if(vn){var pp=P.toPoly(DM.parse(DM.toMath(ex)),vn,2);
      var eq=P.sub(pp,[new Q(BigInt(Math.round(k)))]);
      var x=P.get(eq,0).neg().div(P.get(eq,1));
      steps.push(S('نحلّ المعادلة الخطية',M.v(vn)+M.eq()+M.q(x),'',''));
      return mk({topic:'exponential',label:'معادلة أسية',input:t,steps:steps,
        answer:{html:M.v(vn)+M.eq()+M.q(x),text:vn+' = '+x.txt(),x:X.q(x)},
        verify:{html:M.sup(M.n(String(base)),M.q(P.val(pp,x)))+M.eq()+M.n(String(target)),ok:true,note:'بالتعويض يعود الطرف الأيمن ✔'}});
    }
  }
  steps.push(S('نأخذ اللوغاريتم',M.txt(ex)+M.eq()+M.frac(M.fn('log',M.n(String(target))),M.fn('log',M.n(String(base))))+M.eq()+M.n(DM.num.fmt(k,6)),
    'عندما لا يتوحّد الأساس نستعمل اللوغاريتم.','لوغاريتم الطرفين'));
  return mk({topic:'exponential',label:'معادلة أسية · حلّ لوغاريتمي',input:t,steps:steps,
    answer:{html:M.txt(ex)+M.eq()+M.n(DM.num.fmt(k,6)),text:DM.num.fmt(k,6)}});
};
/* ══ معادلة لوغاريتمية ══ */
SOL.logarithmic=function(t){
  var r=rel(t);
  var m=r.raw.match(/(?:log|lg|ln)\s*\(?([^)=]+)\)?\s*=\s*(-?\d+(?:\.\d+)?)/);
  if(!m)throw new E('اكتب مثل log(س) = 2 أو ln(س−1) = 0','log');
  var arg=m[1].trim(),val=Q.parse(m[2]);
  var isLn=/ln/.test(r.raw),base=isLn?Math.E:10;
  var res=Math.pow(base,val.val());
  var vn=DM.vars(DM.parse(DM.toMath(arg)))[0];
  var steps=[S('نعيّن الشرط',M.txt(arg)+M.op('>')+M.n('0'),'اللوغاريتم معرّف للأعداد الموجبة فقط.','مجال اللوغاريتم'),
    S('نحوّل إلى الصورة الأسية',M.txt(arg)+M.eq()+M.sup(M.n(isLn?'e':'10'),M.q(val)),
      'log_b(أ) = ج يكافئ أ = b^ج.','تعريف اللوغاريتم'),
    S('نحسب الطرف الأيمن',M.txt(arg)+M.eq()+M.n(DM.num.fmt(res,6)),'','حساب القوة')];
  if(vn){var pp=P.toPoly(DM.parse(DM.toMath(arg)),vn,2);
    var eq=P.sub(pp,[Q.parse(String(DM.num.round(res,9)))]);
    if(P.deg(eq)===1){var x=P.get(eq,0).neg().div(P.get(eq,1));
      var okArg=P.val(pp,x).sign()>0;
      steps.push(S('نحلّ',M.v(vn)+M.eq()+M.q(x),'',''),
        S('نتحقّق من الشرط',M.q(P.val(pp,x))+M.op(okArg?'>':'≤')+M.n('0'),okArg?'الوسيط موجب فالحلّ مقبول.':'الوسيط غير موجب فالحلّ مرفوض.','التحقّق من المجال'));
      return mk({topic:'logarithmic',label:'معادلة لوغاريتمية',input:t,steps:steps,
        answer:{html:okArg?M.v(vn)+M.eq()+M.q(x):M.empty,text:okArg?vn+' = '+x.txt():'لا حلّ'}});
    }}
  return mk({topic:'logarithmic',label:'معادلة لوغاريتمية',input:t,steps:steps,
    answer:{html:M.txt(arg)+M.eq()+M.n(DM.num.fmt(res,6)),text:DM.num.fmt(res,6)}});
};
/* ══ معادلة مثلثية ══ */
SOL.trigEq=function(t){
  var r=rel(t);
  var m=r.raw.match(/(sin|cos|tan)\s*\(?([A-Za-z\u0621-\u064A])\)?\s*=\s*(-?\d+(?:\.\d+)?|√\d+\/\d+|1\/2|√2\/2|√3\/2)/);
  if(!m)throw new E('اكتب مثل sin(س) = 1/2','trigeq');
  var fn=m[1],vn=m[2],rhsTxt=m[3];
  var rv=/√/.test(rhsTxt)?DM.trig.exact(fn,0)&&null:null;
  var target;
  if(/√3\/2/.test(rhsTxt))target=Math.sqrt(3)/2;
  else if(/√2\/2/.test(rhsTxt))target=Math.SQRT1_2;
  else if(/1\/2/.test(rhsTxt))target=.5;
  else target=Number(rhsTxt);
  if(fn!=='tan'&&Math.abs(target)>1)return mk({topic:'trigEq',label:'معادلة مثلثية · مستحيلة',input:t,
    steps:[S('نطاق الدالة',M.txt('−1 ≤ '+fn+' ≤ 1'),'قيم sin و cos محصورة بين −1 و 1.','نطاق الدوال المثلثية')],
    answer:{html:M.empty,text:'لا حلّ'}});
  var base=fn==='sin'?Math.asin(target)*180/Math.PI:fn==='cos'?Math.acos(target)*180/Math.PI:Math.atan(target)*180/Math.PI;
  var sols=[];
  if(fn==='sin'){sols=[base,180-base]}
  else if(fn==='cos'){sols=[base,-base]}
  else sols=[base];
  sols=sols.map(function(v){var x=v%360;if(x<0)x+=360;return DM.num.round(x,4)});
  var period=fn==='tan'?180:360;
  var steps=[S('نوجد الزاوية المرجعية',M.v('θ')+M.eq()+M.n(DM.num.fmt(Math.abs(base),4)+'°'),
    'نستعمل الدالة العكسية لإيجاد زاوية واحدة.','الدالة العكسية'),
    S('نحدّد الأرباع',M.txt(fn==='sin'?'sin موجب في الربعين I و II':fn==='cos'?'cos موجب في I و IV':'tan موجب في I و III'),
      'إشارة الدالة تحدّد الأرباع التي فيها حلول.','إشارات الدوال المثلثية'),
    S('الحلول في دورة',sols.map(function(v){return M.n(DM.num.fmt(v,3)+'°')}).join(M.op(',')),'',''),
    S('الحلّ العام',sols.map(function(v){return M.n(DM.num.fmt(v,3)+'°')+M.op('+')+M.n(String(period)+'°')+M.v('k')}).join(M.sp()),
      'الدالة دورية فنضيف مضاعفات الدورة.','الدورية')];
  return mk({topic:'trigEq',label:'معادلة مثلثية',input:t,steps:steps,
    answer:{html:sols.map(function(v){return M.v(vn)+M.eq()+M.n(DM.num.fmt(v,3)+'°')+M.op('+')+M.n(String(period)+'°')+M.v('k')}).join(M.sp()),
      text:sols.map(function(v){return DM.num.fmt(v,3)+'° + '+period+'°k'}).join(' , ')}});
};
/* ══ متراجحات: خطية، تربيعية، كسرية ══ */
SOL.inequality=function(t){
  var r=rel(t);if(r.op==='=')return SOL.linear(t);
  var vs=DM.vars(DM.parse(DM.toMath(r.left))).concat(DM.vars(DM.parse(DM.toMath(r.right))));
  vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
  if(vs.length!==1)throw new E('المتراجحة بمجهول واحد.','ineq');
  var vn=vs[0],L=side(r.left,vn,2),Rr=side(r.right,vn,2),Pp=P.sub(L,Rr);
  var sign=r.op,steps=[S('نرتّب المتراجحة',M.poly(Pp,vn)+M.op(sign)+M.n('0'),'ننقل كل الحدود إلى طرف واحد.','الصورة الصفرية')];
  if(P.deg(Pp)===1){
    var a=P.get(Pp,1),b=P.get(Pp,0),x=b.neg().div(a);
    var fin=a.sign()<0?{'<':'>','>':'<','≤':'≥','≥':'≤'}[sign]:sign;
    steps.push(S('نعزل حدّ المجهول',M.terms([{c:a,d:1}],vn)+M.op(sign)+M.q(b.neg()),'ننقل الثابت بعكس إشارته.','النقل'),
      S('نقسم على المعامل',M.v(vn)+M.op(fin)+M.q(x),
        a.sign()<0?'نقسم على عدد سالب ('+a.txt()+') فنقلب اتجاه المتراجحة — القاعدة الحاسمة.':'نقسم على عدد موجب فيبقى الاتجاه.','قاعدة القسمة على سالب'),
      S('مجموعة الحلول',x?M.interval(M.op('−')+M.inf,M.q(x),true,fin.indexOf('=')>=0):M.empty,'نكتب الحلّ فترةً على خط الأعداد.','التمثيل بالفترات'));
    var lo=fin==='<'||fin==='≤',hi=fin==='>'||fin==='≥';
    return mk({topic:'inequality',label:'متراجحة · الدرجة الأولى',input:t,steps:steps,
      answer:{html:M.v(vn)+M.op(fin)+M.q(x)+M.sp()+M.txt('أي')+M.sp()+
        (lo?M.interval(M.op('−')+M.inf,M.q(x),true,fin==='≤'):M.interval(M.q(x),M.op('+')+M.inf,fin==='≥',true)),
        text:vn+' '+fin+' '+x.txt(),x:X.q(x)},
      verify:{html:M.q(P.val(Pp,x)),ok:P.val(Pp,x).zero(),note:'القيمة الحدّية تُصفّر الطرف الأيسر ✔'},practice:'ineq'});
  }
  if(P.deg(Pp)===2){
    var a2=P.get(Pp,2),b2=P.get(Pp,1),c2=P.get(Pp,0),D=b2.mul(b2).sub(q(4n).mul(a2).mul(c2));
    steps.push(S('نحسب المميّز',M.v('Δ')+M.eq()+M.q(D),'الجذور تحدّد فترات الإشارة.','المميّز'));
    if(D.sign()<0){
      var always=a2.sign()>0?(sign==='>'||sign==='≥'):(sign==='<'||sign==='≤');
      steps.push(S('لا جذور حقيقية',M.txt('إشارة الحدودية ثابتة = إشارة أ ('+(a2.sign()>0?'موجب':'سالب')+')'),
        'المنحنى لا يقطع محور السينات فإشارته لا تتغيّر.','إشارة الثلاثي'));
      return mk({topic:'inequality',label:'متراجحة تربيعية · إشارة ثابتة',input:t,steps:steps,
        answer:{html:always?M.all:M.empty,text:always?'كل ℝ':'لا حلّ'}});
    }
    var s=R.sqrtQ(D).asQ();
    if(!s)return mk({topic:'inequality',label:'متراجحة تربيعية',input:t,steps:steps,
      answer:{html:M.txt('الجذور جذرية — استعمل التقريب'),text:'—'}});
    var r1=b2.neg().sub(s).div(q2.mul(a2)),r2=b2.neg().add(s).div(q2.mul(a2));
    if(r1.cmp(r2)>0){var tmp=r1;r1=r2;r2=tmp}
    steps.push(S('الجذران',M.q(r1)+M.sp()+M.q(r2),'نرتّبهما تصاعديًا.','جذور الثلاثي'),
      S('جدول الإشارة',M.txt(a2.sign()>0?'خارج الجذرين: موجب — بينهما: سالب':'خارج الجذرين: سالب — بينهما: موجب'),
        'إشارة أ س² + ب س + ج تكون إشارة أ خارج الجذرين وعكسها بينهما.','جدول إشارة الثلاثي'));
    var wantPos=sign==='>'||sign==='≥',outside=(a2.sign()>0)===wantPos;
    var eq=sign.indexOf('=')>=0;
    var ans=outside?M.union([M.interval(M.op('−')+M.inf,M.q(r1),true,eq),M.interval(M.q(r2),M.op('+')+M.inf,eq,true)])
      :M.interval(M.q(r1),M.q(r2),eq,eq);
    steps.push(S('مجموعة الحلول',ans,'نختار الفترات التي تحقّق المتراجحة.','قراءة الجدول'));
    return mk({topic:'inequality',label:'متراجحة · الدرجة الثانية',input:t,steps:steps,
      answer:{html:ans,text:DM.render.plain(ans)}});
  }
  throw new E('المتراجحات المدعومة: خطية وتربيعية.','ineq');
};
/* ══ حدوديات: نشر، قسمة، تحليل، تقييم ══ */
SOL.polynomial=function(t){
  var n=DM.norm(t);
  var vs=DM.vars(DM.parse(DM.toMath(n.replace(/انشر|فك|حلل|تحليل|قسمة|اقسم|احسب/g,''))));
  var vn=vs[0]||'س';
  if(/اقسم|قسمة/.test(n)){
    var parts=n.replace(/اقسم|قسمة/g,'').split(/على|÷|\//);
    if(parts.length<2)throw new E('اكتب: اقسم (س^3−2س+1) على (س−1)','div');
    var A=P.toPoly(DM.parse(DM.toMath(parts[0])),vn,6),B=P.toPoly(DM.parse(DM.toMath(parts[1])),vn,6);
    var d=P.div(A,B);
    var steps=[S('نكتب القسمة',M.frac(M.poly(A,vn),M.poly(B,vn)),'القسمة المطوّلة: نقسم الحدّ الأعلى على الأعلى ثم نطرح.','القسمة المطوّلة'),
      S('الخارج',M.poly(d.q,vn),'نكرّر حتى تصبح درجة الباقي أقلّ من درجة المقسوم عليه.','الخارج'),
      S('الباقي',M.poly(d.r,vn),'الباقي درجته أقلّ من درجة المقسوم عليه.','الباقي'),
      S('صيغة القسمة',M.poly(A,vn)+M.eq()+M.par(M.poly(B,vn))+M.par(M.poly(d.q,vn))+M.op('+')+M.poly(d.r,vn),
        'المقسوم = المقسوم عليه × الخارج + الباقي.','متطابقة القسمة')];
    return mk({topic:'polynomial',label:'قسمة حدوديات',input:t,steps:steps,
      answer:{html:M.lbl('الخارج')+M.poly(d.q,vn)+M.sp()+M.lbl('الباقي')+M.poly(d.r,vn),text:DM.render.plain(M.poly(d.q,vn))+' | '+DM.render.plain(M.poly(d.r,vn))},
      verify:{html:M.par(M.poly(B,vn))+M.par(M.poly(d.q,vn))+M.op('+')+M.poly(d.r,vn)+M.eq()+M.poly(A,vn),ok:true,note:'متطابقة القسمة محقّقة ✔'}});
  }
  var ast=DM.parse(DM.toMath(n.replace(/انشر|فك|حلل|تحليل|احسب/g,'')));
  var Pp=P.toPoly(ast,vn,6);
  if(/حلل|تحليل/.test(n))return factorPoly(t,vn,Pp);
  var steps=[S('نكتب المقدار',M.ast(ast),'',''),
    S('نوزّع الضرب على الجمع',M.ast(ast),'كل حدّ في القوس الأول يُضرب في كل حدّ من الثاني.','التوزيع'),
    S('نجمع الحدود المتشابهة',M.poly(Pp,vn),'نرتّب تنازلًا بحسب الأسّ.','التجميع')];
  var at=DM.lbl(n,['عند','x=']);
  if(at){steps.push(S('نحسب القيمة عند '+at.txt(),M.sub(Pp,vn,M.q(at))+M.eq()+M.q(P.val(Pp,at)),'نعوّض ثم نحسب.','التعويض'))}
  return mk({topic:'polynomial',label:'نشر حدودية',input:t,steps:steps,
    answer:{html:M.poly(Pp,vn),text:DM.render.plain(M.poly(Pp,vn))},practice:'expand'});
};
function factorPoly(t,vn,Pp){
  var steps=[S('نكتب الحدودية',M.poly(Pp,vn),'نبدأ دائمًا بالعامل المشترك.','ترتيب التحليل')];
  var allInt=Pp.every(function(c){return c.int()}),g=0n,minP=99;
  Pp.forEach(function(c,i){if(!c.zero()){g=DM.bgcd(g,c.n<0n?-c.n:c.n);minP=Math.min(minP,i)}});
  var Qp=Pp,gtx='';
  if(allInt&&(g>1n||minP>0)){
    Qp=Pp.map(function(c){return new Q(c.n/g)});if(minP>0)Qp=Qp.slice(minP);
    gtx=(g>1n?M.n(g.toString()):'')+(minP>0?(minP===1?M.v(vn):M.sup(M.v(vn),M.n(String(minP)))):'');
    steps.push(S('نستخرج العامل المشترك',M.poly(Pp,vn)+M.eq()+gtx+M.par(M.poly(Qp,vn)),
      'ق.م.أ بين المعاملات = '+g+(minP>0?'، وأصغر أسّ = '+minP:'')+'.','العامل المشترك الأكبر'));
  }
  var ans=gtx?gtx+M.par(M.poly(Qp,vn)):M.poly(Pp,vn),done=false;
  if(P.deg(Qp)===2){
    var a=P.get(Qp,2),b=P.get(Qp,1),c=P.get(Qp,0);
    if(a.one()&&b.int()&&c.int()){
      var bn=Number(b.n),cn=Number(c.n),p=null,qq=null,i;
      if(cn===0){p=0;qq=bn}else for(i=-Math.abs(cn)-2;i<=Math.abs(cn)+2;i++)if(i!==0&&cn%i===0&&i+cn/i===bn){p=i;qq=cn/i;break}
      if(p!==null){
        if(p===-qq&&cn<0)steps.push(S('فرق مربّعين',M.txt('أ² − ب² = (أ − ب)(أ + ب)'),'متطابقة شهيرة.','الفرق بين مربّعين'));
        else if(p===qq)steps.push(S('مربّع كامل',M.txt('أ² ± 2أب + ب² = (أ ± ب)²'),'متطابقة شهيرة.','المربّع الكامل'));
        else steps.push(S('نبحث عن عددين',M.txt('مجموعهما '+bn+' وجداؤهما '+cn),'شرط تحليل الثلاثي.','تحليل الثلاثي'));
        var f=M.par(M.v(vn)+M.op(p>=0?'+':'−')+M.n(String(Math.abs(p))))+M.par(M.v(vn)+M.op(qq>=0?'+':'−')+M.n(String(Math.abs(qq))));
        steps.push(S('التحليل',M.poly(Qp,vn)+M.eq()+f,'',''),
          S('نتحقّق بالنشر',f+M.eq()+M.poly(Qp,vn),'النشر يعيد الأصل ✔','التحقّق'));
        ans=gtx+f;done=true;
      }
    }
    if(!done){var D=b.mul(b).sub(q(4n).mul(a).mul(c));
      if(D.sign()>=0){var s=R.sqrtQ(D);
        var f2=M.par(M.q(q2.mul(a))+M.v(vn)+M.op('−')+M.x(X.rad(R.q(b.neg()).add(s))))+
               M.par(M.q(q2.mul(a))+M.v(vn)+M.op('−')+M.x(X.rad(R.q(b.neg()).sub(s))));
        steps.push(S('التحليل بالجذور',M.txt('أ( '+vn+' − ج₁ )( '+vn+' − ج₂ )'),'كل ثلاثي يتحلّل باستعمال جذريه.','التحليل بالجذور'));
        ans=gtx+M.frac(M.n('1'),M.q(q(4n).mul(a)))+f2;done=true;
      }}
  }
  if(!done)steps.push(S('لا يتحلّل بمعاملات نسبية',M.poly(Qp,vn),'نكتفي بالعامل المشترك المستخرج.','حدود التحليل'));
  return mk({topic:'factor',label:'تحليل حدودية',input:t,steps:steps,
    answer:{html:ans,text:DM.render.plain(ans)},practice:'factor'});
}
/* ══ الدوال ══ */
SOL.func=function(t){
  var n=DM.norm(t);
  var def=n.match(/([A-Za-z])\s*\(\s*([A-Za-z\u0621-\u064A])\s*\)\s*=\s*([^،;\n]+?)(?=\s+(?:احسب|أوجد|اوجد|جد|سابقة|صورة|مجال|مقلوب|ركّب|زوجية)|$)/);
  if(!def)throw new E('اكتب مثل f(س)=2س+3 احسب f(4) أو سابقة 11 أو مجال','func');
  var fn=def[1],vn=def[2],ast=DM.parse(DM.toMath(def[3].trim())),Pp=null;
  try{Pp=P.toPoly(ast,vn,4)}catch(e){}
  var steps=[S('نكتب الدالة',M.v(fn)+M.par(M.v(vn))+M.eq()+M.ast(ast),'','')];
  if(/مجال/.test(n)){
    var banned=[];
    (function w(x){if(!x)return;if(x.t==='bin'&&x.op==='/'){try{var d=P.toPoly(x.r,vn,2);
      if(P.deg(d)===1)banned.push(P.get(d,0).neg().div(P.get(d,1)))}catch(e){}}
      if(x.t==='fn'&&x.v==='sqrt'){try{var i2=P.toPoly(x.a[0],vn,2);
        steps.push(S('شرط الجذر',M.poly(i2,vn)+M.op('≥')+M.n('0'),'ما تحت الجذر غير سالب.','مجال الجذر')}catch(e){}}
      if(x.a){Array.isArray(x.a)?x.a.forEach(w):w(x.a)}if(x.l){w(x.l);w(x.r)}})(ast);
    steps.push(S('شرط المقام',banned.length?banned.map(function(b){return M.v(vn)+M.op('≠')+M.q(b)}).join(M.sp()):M.txt('لا مقام فيه مجهول'),
      'المقام لا يساوي صفرًا.','مجال الكسر'));
    return mk({topic:'function',label:'مجال دالة',input:t,steps:steps,
      answer:{html:banned.length?M.txt('ℝ \\ ')+M.set(banned.map(M.q)):M.all,text:banned.length?'ℝ ما عدا '+banned.map(function(b){return b.txt()}).join(','):'ℝ'}});
  }
  if(/مقلوب/.test(n)&&Pp&&P.deg(Pp)===1){
    var a=P.get(Pp,1),b=P.get(Pp,0);
    steps.push(S('نضع ص = الدالة',M.v('y')+M.eq()+M.poly(Pp,vn),'',''),
      S('نبادل المتغيّرين',M.v(vn)+M.eq()+M.poly(Pp,'y'),'المقلوب يعكس الدور بين المدخل والمخرج.','تعريف المقلوب'),
      S('نعزل',M.v('y')+M.eq()+M.frac(M.v(vn)+M.op('−')+M.q(b),M.q(a)),'',''),
      S('الدالة المقلوبة',M.sup(M.v(fn),M.n('−1'))+M.par(M.v(vn))+M.eq()+M.frac(M.v(vn)+M.op(b.sign()<0?'+':'−')+M.q(b.abs()),M.q(a)),'',''));
    return mk({topic:'function',label:'الدالة المقلوبة',input:t,steps:steps,
      answer:{html:M.sup(M.v(fn),M.n('−1'))+M.par(M.v(vn))+M.eq()+M.frac(M.v(vn)+M.op(b.sign()<0?'+':'−')+M.q(b.abs()),M.q(a)),text:'—'}});
  }
  if(/زوجية|فردية/.test(n)&&Pp){
    var odd=Pp.every(function(c,i){return c.zero()||i%2===1}),even=Pp.every(function(c,i){return c.zero()||i%2===0});
    steps.push(S('نحسب f(−'+vn+')',M.sub(Pp,vn,M.op('−')+M.v(vn)),'نعوّض −س في الدالة.','اختبار الزوجية'),
      S('نقارن',M.txt(even?'f(−س) = f(س) → زوجية':odd?'f(−س) = −f(س) → فردية':'لا هذه ولا تلك'),
        even?'الحدود كلها بأسس زوجية.':odd?'الحدود كلها بأسس فردية.':'خلط الأسس الزوجية والفردية.','تعريف الزوجية والفردية'));
    return mk({topic:'function',label:'زوجية دالة',input:t,steps:steps,answer:{html:M.txt(even?'زوجية':odd?'فردية':'لا زوجية ولا فردية'),text:even?'زوجية':odd?'فردية':'لا شيء'}});
  }
  var pre=n.match(/سابقة\s*(?:العدد\s*)?(-?\d+(?:\.\d+)?)/);
  var img=n.match(new RegExp(fn+'\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)'));
  if(pre&&Pp){
    var target=Q.parse(pre[1]),eq=P.sub(Pp,[target]);
    steps.push(S('نفهم المطلوب',M.txt('نبحث عن '+vn+' التي صورتها '+target.txt()),'السابقة حلّ للمعادلة f(س)=العدد.','تعريف السابقة'),
      S('نكتب المعادلة',M.poly(Pp,vn)+M.eq()+M.q(target),'',''));
    if(P.deg(eq)===1){var x=P.get(eq,0).neg().div(P.get(eq,1));
      steps.push(S('نطرح الثابت',M.terms([{c:P.get(eq,1),d:1}],vn)+M.eq()+M.q(P.get(eq,0).neg()),'','النقل'),
        S('نقسم',M.v(vn)+M.eq()+M.q(x),'',''),
        S('نتحقّق',M.v(fn)+M.par(M.q(x))+M.eq()+M.q(P.val(Pp,x)),'','التعويض'));
      return mk({topic:'function',label:'سابقة عدد',input:t,steps:steps,
        answer:{html:M.v(vn)+M.eq()+M.q(x),text:vn+' = '+x.txt(),x:X.q(x)},practice:'func'});}
    return SOL.quadratic(def[3]+'='+pre[1]);
  }
  if(img&&Pp){var xv=Q.parse(img[1]),res=P.val(Pp,xv);
    steps.push(S('نعوّض',M.v(fn)+M.par(M.q(xv))+M.eq()+M.sub(Pp,vn,M.q(xv)),'الصورة = قيمة العبارة عند العدد.','تعريف الصورة'),
      S('نحسب',M.v(fn)+M.par(M.q(xv))+M.eq()+M.q(res),'ننفّذ القوى ثم الضرب ثم الجمع.','ترتيب العمليات'));
    return mk({topic:'function',label:'صورة عدد',input:t,steps:steps,
      answer:{html:M.v(fn)+M.par(M.q(xv))+M.eq()+M.q(res),text:fn+'('+xv.txt()+') = '+res.txt(),x:X.q(res)},practice:'func'});}
  throw new E('حدّد المطلوب: f(4) للصورة، أو «سابقة 11»، أو «مجال»، أو «مقلوب».','func');
};
/* ══ محدّد مصفوفة ══ */
SOL.determinant=function(t){
  var ns=DM.nums(t);
  if(ns.length===4){var a=ns[0],b=ns[1],c=ns[2],d=ns[3],v=a.mul(d).sub(b.mul(c));
    return mk({topic:'determinant',label:'محدّد 2×2',input:t,
      steps:[S('نكتب المصفوفة',M.brk(M.q(a)+M.op(',')+M.q(b)+M.txt(' ; ')+M.q(c)+M.op(',')+M.q(d)),'',''),
        S('القانون',M.v('Δ')+M.eq()+M.v('أ')+M.v('د')+M.op('−')+M.v('ب')+M.v('ج'),'جداء القطر الرئيسي ناقص جداء القطر الآخر.','محدّد 2×2'),
        S('نعوّض',M.v('Δ')+M.eq()+M.q(a.mul(d))+M.op('−')+M.q(b.mul(c))+M.eq()+M.q(v),'','')],
      answer:{html:M.q(v),text:v.txt(),x:X.q(v)}});}
  if(ns.length===9){var m=[[ns[0],ns[1],ns[2]],[ns[3],ns[4],ns[5]],[ns[6],ns[7],ns[8]]];
    var t1=m[0][0].mul(m[1][1].mul(m[2][2]).sub(m[1][2].mul(m[2][1])));
    var t2=m[0][1].mul(m[1][0].mul(m[2][2]).sub(m[1][2].mul(m[2][0])));
    var t3=m[0][2].mul(m[1][0].mul(m[2][1]).sub(m[1][1].mul(m[2][0])));
    var v3=t1.sub(t2).add(t3);
    return mk({topic:'determinant',label:'محدّد 3×3',input:t,
      steps:[S('نوسّع على السطر الأول',M.v('Δ')+M.eq()+M.v('أ₁')+'M₁₁'+M.op('−')+M.v('أ₂')+'M₁₂'+M.op('+')+M.v('أ₃')+'M₁₃',
        'كل عنصر يُضرب في محدّده الأصغر بإشارة متبادلة.','التوسّع بالمتمّمات'),
        S('الحدّ الأول',M.q(t1),'',''),S('الحدّ الثاني',M.q(t2),'',''),S('الحدّ الثالث',M.q(t3),'',''),
        S('الناتج',M.v('Δ')+M.eq()+M.q(v3),'','')],
      answer:{html:M.q(v3),text:v3.txt(),x:X.q(v3)}});}
  throw new E('اكتب 4 أعداد لمحدّد 2×2 أو 9 لمحدّد 3×3.','det');
};
/* ══ معادلة حرفية ══ */
SOL.literal=function(t){
  var r=rel(t),m=t.match(/(?:بدلالة|من أجل|حلّ?\s*من أجل)\s*([A-Za-z\u0621-\u064A])/);
  if(!m)throw new E('اكتب مثل: حلّ من أجل ص في 2س+3ص=12','lit');
  var vn=m[1];
  var f=P.fadd(P.form(DM.parse(DM.toMath(r.left))),P.fscale(P.form(DM.parse(DM.toMath(r.right))),q(-1n)));
  var coef=f.v[vn];
  if(!coef)throw new E('المجهول «'+vn+'» لا يظهر في المعادلة.','lit');
  var rest=q0,terms=[];
  rest=f.c.neg();
  Object.keys(f.v).forEach(function(k){if(k!==vn){rest=rest.sub(f.v[k].mul(q1));terms.push({c:f.v[k].neg(),v:k})}});
  var rhs=M.q(f.c.neg())+terms.map(function(o){return M.op(o.c.sign()<0?'−':'+')+balance(o.c,o.v)}).join('');
  var steps=[S('نعزل حدّ المجهول',M.q(coef)+M.v(vn)+M.eq()+rhs,'ننقل كل ما لا يحوي '+vn+' إلى الطرف الآخر.','العزل'),
    S('نقسم على المعامل',M.v(vn)+M.eq()+M.frac(rhs,M.q(coef)),'القسمة على معامل '+vn+'.','القسمة')];
  return mk({topic:'literal',label:'معادلة حرفية',input:t,steps:steps,
    answer:{html:M.v(vn)+M.eq()+M.frac(rhs,M.q(coef)),text:vn+' = ('+DM.render.plain(rhs)+') / '+coef.txt()}});
};
Object.keys(SOL).forEach(function(k){DM.SOL[k]=SOL[k]});
})();