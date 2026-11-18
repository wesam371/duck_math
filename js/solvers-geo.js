/* js/solvers-geo.js — الهندسة: أشكال، مجسمات، فيثاغورس، طاليس، مثلثات، إحداثيات، أشعة، تحويلات */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X,M=DM.M,q=DM.q,q0=DM.q0,q1=DM.q1,q2=DM.q2,E=DM.E,P=DM.P;
var S=M.step,mk=DM.mk,SOL={},nums=DM.nums,lbl=DM.lbl;
function pi(){return X.pi()}
function area(u){return u+'²'}function vol(u){return u+'³'}
function unitOf(t){return /متر|\bm\b/.test(t)?'م':'سم'}

/* ══ الأشكال المستوية ══ */
SOL.shape=function(t){
  var n=DM.norm(t),want=/محيط/.test(n)?'per':'area',u=unitOf(n);
  var shapes=[{re:/شبه\s*منحرف/,n:'شبه منحرف'},{re:/متوازي\s*أضلاع|متوازي\s*اضلاع/,n:'متوازي أضلاع'},
   {re:/معيّن|معين/,n:'معيّن'},{re:/مستطيل/,n:'مستطيل'},{re:/مربع/,n:'مربع'},
   {re:/دائرة|قرص/,n:'دائرة'},{re:/مثلث/,n:'مثلث'},{re:/سداسي/,n:'سداسي منتظم'},{re:/مضلع/,n:'مضلع منتظم'}];
  var sh=null,i;for(i=0;i<shapes.length;i++)if(shapes[i].re.test(n)){sh=shapes[i];break}
  if(!sh)throw new E('حدّد الشكل: مربع، مستطيل، مثلث، دائرة، متوازي أضلاع، شبه منحرف، معيّن، مضلع منتظم.','shape');
  var ns=nums(n);if(!ns.length)throw new E('اكتب الأبعاد، مثل: مساحة مستطيل طوله 8 وعرضه 5.','dims');
  var L=lbl(n,['ال?طول(?:ه)?','ل']),W=lbl(n,['ال?عرض(?:ه)?','ع']),H=lbl(n,['ال?ارتفاع(?:ه)?','هـ','ه']),
   Rr=lbl(n,['نصف\\s*ال?قطر(?:ها|ه)?','نق','r']),D=lbl(n,['ال?قطر(?:ها|ه)?','ق']),
   B=lbl(n,['ال?قاعدة','قاعدة']),S1=lbl(n,['ال?ضلع(?:ه)?','ض']),Nn=lbl(n,['عدد\\s*الأضلاع','ن']);
  var steps=[],val,uu=want==='per'?u:area(u),f;
  function push(formula,sub,res,why){steps.push(S('نكتب القانون',formula,why||'','قانون '+sh.n));
    steps.push(S('نعوّض',sub,'نستبدل الرموز بالقيم المعطاة.','التعويض'));
    steps.push(S('نحسب',res,'ننفّذ العمليات مع الاحتفاظ بـ π رمزيًا.','حساب'))}
  if(sh.n==='مربع'){var a=S1||ns[0];
    if(want==='per'){f=M.v('P')+M.eq()+M.n('4')+M.v('أ');val=X.q(a.mul(q(4n)));
      push(f,M.v('P')+M.eq()+M.n('4')+M.op('×')+M.q(a),M.q(val),'المربع أضلاعه الأربعة متساوية.')}
    else{f=M.v('A')+M.eq()+M.sup(M.v('أ'),M.n('2'));val=X.q(a.mul(a));
      push(f,M.v('A')+M.eq()+M.sup(M.q(a),M.n('2')),M.q(val),'المساحة = الضلع × الضلع.')}}
  else if(sh.n==='مستطيل'){var l=L||ns[0],w=W||ns[1]||ns[0];
    if(want==='per'){f=M.v('P')+M.eq()+M.n('2')+M.par(M.v('ل')+M.op('+')+M.v('ع'));val=X.q(l.add(w).mul(q2));
      push(f,M.n('2')+M.par(M.q(l)+M.op('+')+M.q(w)),M.q(val),'المحيط مجموع الأضلاع الأربعة.')}
    else{f=M.v('A')+M.eq()+M.v('ل')+M.op('×')+M.v('ع');val=X.q(l.mul(w));
      push(f,M.q(l)+M.op('×')+M.q(w),M.q(val),'المسافة الطول في العرض.')}}
  else if(sh.n==='مثلث'){
    if(want==='per'&&ns.length>=3){val=X.q(ns[0].add(ns[1]).add(ns[2]));
      push(M.v('P')+M.eq()+M.v('أ')+M.op('+')+M.v('ب')+M.op('+')+M.v('ج'),ns.slice(0,3).map(M.q).join(M.op('+')),M.q(val),'المحيط مجموع الأضلاع.')}
    else{var b=B||ns[0],h=H||ns[1]||ns[0];val=X.q(b.mul(h).div(q2));
      push(M.v('A')+M.eq()+M.frac(M.n('1'),M.n('2'))+M.op('×')+M.v('القاعدة')+M.op('×')+M.v('الارتفاع'),
        M.frac(M.n('1'),M.n('2'))+M.op('×')+M.q(b)+M.op('×')+M.q(h),M.q(val),'الارتفاع عمودي على القاعدة وليس الضلع المائل.')}}
  else if(sh.n==='دائرة'){
    var r=Rr||(D?D.div(q2):ns[0]);
    if(D&&!Rr)steps.push(S('نوجد نصف القطر',M.v('r')+M.eq()+M.frac(M.v('ق'),M.n('2'))+M.eq()+M.q(r),'القطر ضعف نصف القطر.','علاقة القطر'));
    if(want==='per'){f=M.v('C')+M.eq()+M.n('2')+M.pi+M.v('r');val=pi().mul(X.q(q2.mul(r)));
      push(f,M.n('2')+M.op('×')+M.pi+M.op('×')+M.q(r),M.xa(val),'المحيط يتناسب مع نصف القطر بثابت 2π.')}
    else{f=M.v('A')+M.eq()+M.pi+M.sup(M.v('r'),M.n('2'));val=pi().mul(X.q(r.mul(r)));
      push(f,M.pi+M.op('×')+M.sup(M.q(r),M.n('2')),M.xa(val),'نُبقي π رمزيًا للقيمة المضبوطة ثم نقرّب.')}}
  else if(sh.n==='متوازي أضلاع'){var b2=B||ns[0],h2=H||ns[1]||ns[0];
    if(want==='per'){val=X.q(b2.add(h2).mul(q2));push(M.v('P')+M.eq()+M.n('2')+M.par(M.v('أ')+M.op('+')+M.v('ب')),M.n('2')+M.par(M.q(b2)+M.op('+')+M.q(h2)),M.q(val),'كل ضلعين متقابلين متساويان.')}
    else{val=X.q(b2.mul(h2));push(M.v('A')+M.eq()+M.v('القاعدة')+M.op('×')+M.v('الارتفاع'),M.q(b2)+M.op('×')+M.q(h2),M.q(val),'نستعمل الارتفاع العمودي.')}}
  else if(sh.n==='معيّن'){var d1=ns[0],d2=ns[1]||ns[0];
    val=X.q(d1.mul(d2).div(q2));
    push(M.v('A')+M.eq()+M.frac(M.n('1'),M.n('2'))+M.v('ق₁')+M.v('ق₂'),M.frac(M.n('1'),M.n('2'))+M.op('×')+M.q(d1)+M.op('×')+M.q(d2),M.q(val),'قطرا المعيّن متعامدان فينقسم إلى أربعة مثلثات.')}
  else if(sh.n==='شبه منحرف'){var b1=ns[0],bb=ns[1]||ns[0],hh=H||ns[2]||ns[0];
    val=X.q(b1.add(bb).mul(hh).div(q2));
    push(M.v('A')+M.eq()+M.frac(M.n('1'),M.n('2'))+M.par(M.v('ب₁')+M.op('+')+M.v('ب₂'))+M.v('هـ'),
      M.frac(M.n('1'),M.n('2'))+M.par(M.q(b1)+M.op('+')+M.q(bb))+M.op('×')+M.q(hh),M.q(val),'متوسط القاعدتين في الارتفاع.')}
  else{var nn=Nn?Number(Nn.n):6,ss=S1||ns[0];
    var ap=ss.div(q2).mul(X.n(1/Math.tan(Math.PI/nn)));
    val=ap.mul(X.q(ss.mul(q(BigInt(nn)))).div(X.q(q2)));
    push(M.v('A')+M.eq()+M.frac(M.n('1'),M.n('2'))+M.v('P')+M.v('a'),
      M.frac(M.n('1'),M.n('2'))+M.op('×')+M.q(ss.mul(q(BigInt(nn))))+M.op('×')+M.n(DM.num.fmt(ap.val(),4)),M.xa(val),
      'المضلع المنتظم ينقسم إلى ن مثلثات متطابقة، a هو العمود من المركز.')}
  steps.push(S(want==='per'?'المحيط':'المساحة',M.xa(val),'الوحدة: '+uu,'الوحدة'));
  return mk({topic:'shape',label:'مستويات · '+sh.n,input:t,steps:steps,
    answer:{html:M.xa(val)+M.sp()+M.txt(uu),text:DM.render.text(val)+' '+uu,x:val,unit:uu},practice:'shape'});
};
/* ══ المجسمات ══ */
SOL.solid=function(t){
  var n=DM.norm(t),want=/مساحة/.test(n)?'area':'vol',u=unitOf(n),ns=nums(n);
  if(!ns.length)throw new E('اكتب الأبعاد، مثل: حجم مخروط نصف قطره 3 وارتفاعه 4.','dims');
  var Rr=lbl(n,['نصف\\s*ال?قطر(?:ها|ه)?','نق','r']),H=lbl(n,['ال?ارتفاع(?:ه)?','هـ','ه']),
   B=lbl(n,['مساحة\\s*ال?قاعدة','ال?قاعدة']),S1=lbl(n,['ال?ضلع(?:ه)?','ض']),
   L=lbl(n,['ال?طول(?:ه)?','ل']),W=lbl(n,['ال?عرض(?:ه)?','ع']),SL=lbl(n,['ال?راسم','ال?المائل','ل']);
  var name,steps=[],val,uu=want==='vol'?vol(u):area(u),f;
  function push(a,b,c,w){steps.push(S('نكتب القانون',a,w||'','قانون الحجم/المساحة'));
    steps.push(S('نعوّض',b,'','التعويض'));steps.push(S('نحسب',c,'نُبقي π مضبوطة ثم نقرّب.','حساب'))}
  if(/كرة/.test(n)){name='كرة';var r=Rr||ns[0];
    if(want==='vol'){f=M.v('V')+M.eq()+M.frac(M.n('4'),M.n('3'))+M.pi+M.sup(M.v('r'),M.n('3'));
      val=pi().mul(X.q(r.pow(3).mul(q(4n,3n))));
      push(f,M.frac(M.n('4'),M.n('3'))+M.op('×')+M.pi+M.op('×')+M.sup(M.q(r),M.n('3')),M.xa(val),'حجم الكرة يتناسب مع مكعّب نصف القطر.')}
    else{f=M.v('A')+M.eq()+M.n('4')+M.pi+M.sup(M.v('r'),M.n('2'));val=pi().mul(X.q(r.mul(r).mul(q(4n))));
      push(f,M.n('4')+M.op('×')+M.pi+M.op('×')+M.sup(M.q(r),M.n('2')),M.xa(val),'مساحة سطح الكرة أربعة أضعاف مساحة قرصها.')}}
  else if(/مخروط/.test(n)){name='مخروط دوراني';var r2=Rr||ns[0],h2=H||ns[1]||ns[0];
    if(want==='vol'){f=M.v('V')+M.eq()+M.frac(M.n('1'),M.n('3'))+M.pi+M.sup(M.v('r'),M.n('2'))+M.v('هـ');
      val=pi().mul(X.q(r2.mul(r2).mul(h2).div(q(3n))));
      push(f,M.frac(M.n('1'),M.n('3'))+M.op('×')+M.pi+M.op('×')+M.sup(M.q(r2),M.n('2'))+M.op('×')+M.q(h2),M.xa(val),
        'المخروط ثلث الأسطوانة التي لها القاعدة والارتفاع نفسه.')}
    else{var sl=SL||X.n(Math.sqrt(r2.val()*r2.val()+h2.val()*h2.val()));
      var slq=SL||null;
      if(!slq)steps.push(S('نحسب الراسم بفيثاغورس',M.v('ل')+M.eq()+M.root(M.sup(M.q(r2),M.n('2'))+M.op('+')+M.sup(M.q(h2),M.n('2')))+M.eq()+M.n(DM.num.fmt(sl.val(),4)),
        'الراسم وتر المثلث القائم نصف القطر/الارتفاع.','فيثاغورس'));
      var lat=pi().mul(X.q(r2)).mul(slq?X.q(slq):sl);
      var base=pi().mul(X.q(r2.mul(r2)));
      val=lat.add(base);
      push(M.v('A')+M.eq()+M.pi+M.v('r')+M.v('ل')+M.op('+')+M.pi+M.sup(M.v('r'),M.n('2')),
        M.pi+M.op('×')+M.q(r2)+M.op('×')+M.n(DM.num.fmt(slq?slq.val():sl.val(),4))+M.op('+')+M.pi+M.op('×')+M.sup(M.q(r2),M.n('2')),
        M.xa(val),'المساحة الكلية = الجانبية + القاعدة.')}}
  else if(/هرم/.test(n)){name='هرم';var bb=B||ns[0],hh=H||ns[1]||ns[0];
    val=X.q(bb.mul(hh).div(q(3n)));
    push(M.v('V')+M.eq()+M.frac(M.n('1'),M.n('3'))+M.v('B')+M.v('هـ'),
      M.frac(M.n('1'),M.n('3'))+M.op('×')+M.q(bb)+M.op('×')+M.q(hh),M.q(val),'الهرم ثلث المنشور المكافئ في القاعدة والارتفاع.')}
  else if(/أسطوانة|اسطوانة/.test(n)){name='أسطوانة دورانية';var r3=Rr||ns[0],h3=H||ns[1]||ns[0];
    if(want==='vol'){f=M.v('V')+M.eq()+M.pi+M.sup(M.v('r'),M.n('2'))+M.v('هـ');val=pi().mul(X.q(r3.mul(r3).mul(h3)));
      push(f,M.pi+M.op('×')+M.sup(M.q(r3),M.n('2'))+M.op('×')+M.q(h3),M.xa(val),'مساحة القاعدة × الارتفاع.')}
    else{f=M.v('A')+M.eq()+M.n('2')+M.pi+M.v('r')+M.par(M.v('r')+M.op('+')+M.v('هـ'));
      val=pi().mul(X.q(q2.mul(r3).mul(r3.add(h3))));
      push(f,M.n('2')+M.op('×')+M.pi+M.op('×')+M.q(r3)+M.par(M.q(r3)+M.op('+')+M.q(h3)),M.xa(val),'الجانبية مستطيل عند فرد السطح.')}}
  else if(/مكعب/.test(n)){name='مكعب';var a=S1||ns[0];
    if(want==='vol'){val=X.q(a.pow(3));push(M.v('V')+M.eq()+M.sup(M.v('أ'),M.n('3')),M.sup(M.q(a),M.n('3')),M.q(val),'ثلاثة أبعاد متساوية.')}
    else{val=X.q(a.mul(a).mul(q(6n)));push(M.v('A')+M.eq()+M.n('6')+M.sup(M.v('أ'),M.n('2')),M.n('6')+M.op('×')+M.sup(M.q(a),M.n('2')),M.q(val),'ستة أوجه مربّعة متطابقة.')}}
  else{name='متوازي مستطيلات';var l=L||ns[0],w=W||ns[1]||ns[0],h=H||ns[2]||ns[0];
    if(want==='vol'){val=X.q(l.mul(w).mul(h));push(M.v('V')+M.eq()+M.v('ل')+M.v('ع')+M.v('هـ'),M.q(l)+M.op('×')+M.q(w)+M.op('×')+M.q(h),M.q(val),'جداء الأبعاد الثلاثة.')}
    else{val=X.q(l.mul(w).add(l.mul(h)).add(w.mul(h)).mul(q2));
      push(M.v('A')+M.eq()+M.n('2')+M.par(M.v('لع')+M.op('+')+M.v('لهـ')+M.op('+')+M.v('عهـ')),
        M.n('2')+M.par(M.q(l.mul(w))+M.op('+')+M.q(l.mul(h))+M.op('+')+M.q(w.mul(h))),M.q(val),'ثلاثة أزواج من الأوجه المتطابقة.')}}
  steps.push(S(want==='vol'?'الحجم':'المساحة الكلية',M.xa(val),'الوحدة: '+uu,'الوحدة'));
  return mk({topic:'solid',label:'مجسمات · '+name,input:t,steps:steps,
    answer:{html:M.xa(val)+M.sp()+M.txt(uu),text:DM.render.text(val)+' '+uu,x:val,unit:uu},practice:'solid'});
};
/* ══ فيثاغورس + العكس + ثلاثيات ══ */
SOL.pythagoras=function(t){
  var n=DM.norm(t),ns=nums(n);
  if(/عكس|قائم؟\?|هل/.test(n)&&ns.length>=3){
    var s=ns.slice(0,3).sort(function(a,b){return a.cmp(b)});
    var lhs=s[0].mul(s[0]).add(s[1].mul(s[1])),rhs=s[2].mul(s[2]);
    return mk({topic:'pythagoras',label:'عكس فيثاغورس',input:t,
      steps:[S('نرتّب الأضلاع',s.map(M.q).join(M.op(',')),'الوتر هو الأطول إن وُجد.','ترتيب'),
        S('نقارن',M.sup(M.q(s[0]),M.n('2'))+M.op('+')+M.sup(M.q(s[1]),M.n('2'))+M.eq()+M.q(lhs)+M.sp()+M.sup(M.q(s[2]),M.n('2'))+M.eq()+M.q(rhs),'',''),
        S('الاستنتاج',M.txt(lhs.eq(rhs)?'المثلث قائم':lhs.cmp(rhs)>0?'المثلث حادّ الزوايا':'المثلث منفرج'),
          'عكس فيثاغورس: المساواة تعني زاوية قائمة.','عكس النظرية')],
      answer:{html:M.txt(lhs.eq(rhs)?'قائم ✔':'غير قائم'),text:lhs.eq(rhs)?'قائم':'غير قائم'}});
  }
  if(ns.length<2)throw new E('اكتب ضلعين، مثل: مثلث قائم ضلعاه 6 و 8.','dims');
  var hyp=lbl(n,['ال?وتر(?:ه)?','BC','ج']);
  var steps=[S('نكتب النظرية',M.sup(M.v('أ'),M.n('2'))+M.op('+')+M.sup(M.v('ب'),M.n('2'))+M.eq()+M.sup(M.v('ج'),M.n('2')),
    'في المثلث القائم فقط: مجموع مربّعي الضلعين القائمين = مربّع الوتر.','نظرية فيثاغورس')];
  var val,ans;
  if(hyp){var other=ns.filter(function(v){return !v.eq(hyp)})[0]||ns[0];
    var b2=hyp.mul(hyp).sub(other.mul(other));
    if(b2.sign()<0)throw new E('الوتر يجب أن يكون أطول ضلع.','domain');
    var sr=R.sqrtQ(b2);val=X.rad(sr);
    steps.push(S('نعوّض',M.sup(M.q(other),M.n('2'))+M.op('+')+M.sup(M.v('ب'),M.n('2'))+M.eq()+M.sup(M.q(hyp),M.n('2')),'','التعويض'),
      S('نحسب المربّعات',M.q(other.mul(other))+M.op('+')+M.sup(M.v('ب'),M.n('2'))+M.eq()+M.q(hyp.mul(hyp)),'','حساب'),
      S('نطرح',M.sup(M.v('ب'),M.n('2'))+M.eq()+M.q(hyp.mul(hyp))+M.op('−')+M.q(other.mul(other))+M.eq()+M.q(b2),'نعزل مربّع الضلع المجهول.','العملية المعاكسة'),
      S('نأخذ الجذر',M.v('ب')+M.eq()+M.xa(val),'الطول موجب فنأخذ الجذر الموجب فقط.','الجذر'));
    ans=M.v('ب')+M.eq()+M.xa(val);
  }else{var a=ns[0],b=ns[1],c2=a.mul(a).add(b.mul(b));
    val=X.rad(R.sqrtQ(c2));
    steps.push(S('نعوّض',M.sup(M.q(a),M.n('2'))+M.op('+')+M.sup(M.q(b),M.n('2'))+M.eq()+M.sup(M.v('ج'),M.n('2')),'','التعويض'),
      S('نحسب المربّعات',M.q(a.mul(a))+M.op('+')+M.q(b.mul(b))+M.eq()+M.sup(M.v('ج'),M.n('2')),'','حساب'),
      S('نجمع',M.sup(M.v('ج'),M.n('2'))+M.eq()+M.q(c2),'','حساب'),
      S('نأخذ الجذر',M.v('ج')+M.eq()+M.xa(val),'','الجذر'));
    ans=M.v('ج')+M.eq()+M.xa(val);
    var trip=[[3,4,5],[5,12,13],[8,15,17],[7,24,25]].some(function(tr){
      return (a.val()===tr[0]&&b.val()===tr[1])||(a.val()===tr[1]&&b.val()===tr[0])});
    if(trip)steps.push(S('ثلاثية فيثاغورية',M.txt('هذه ثلاثية شهيرة (مضاعفات 3,4,5 أو 5,12,13 …)'),'حفظ الثلاثيات يسرّع الحلّ.','ثلاثيات فيثاغورس'));
  }
  return mk({topic:'pythagoras',label:'نظرية فيثاغورس',input:t,steps:steps,
    answer:{html:ans+M.sp()+M.txt('سم'),text:DM.render.text(val),x:val,unit:'سم'},
    verify:{html:M.sup(M.x(val),M.n('2'))+M.eq()+M.q(hyp?hyp.mul(hyp).sub(nums(n).filter(function(v){return !v.eq(hyp)})[0].pow(2)):ns[0].pow(2).add(ns[1].pow(2))),
      ok:true,note:'بتربيع الناتج نعود إلى مربّع الضلع المطلوب ✔'},practice:'pyth'});
};
/* ══ طاليس + العكس ══ */
SOL.thales=function(t){
  var n=DM.norm(t);
  var AM=lbl(n,['AM']),AB=lbl(n,['AB']),AN=lbl(n,['AN']),AC=lbl(n,['AC']),MN=lbl(n,['MN']),BC=lbl(n,['BC']);
  var pairs=[[AM,AB,'AM','AB'],[AN,AC,'AN','AC'],[MN,BC,'MN','BC']];
  var kn=pairs.filter(function(p){return p[0]&&p[1]}),ms=pairs.filter(function(p){return p[0]&&!p[1]});
  if(!kn.length||!ms.length)throw new E('اكتب ثلاث قيم ومجهولًا، مثل: طاليس AM=3 AB=9 AN=4','thales');
  var k=kn[0],m=ms[0],ratio=k[0].div(k[1]),val=ratio.mul(m[0]);
  return mk({topic:'thales',label:'نظرية طاليس',input:t,
    steps:[S('نكتب النظرية',M.frac(M.n('AM'),M.n('AB'))+M.eq()+M.frac(M.n('AN'),M.n('AC'))+M.eq()+M.frac(M.n('MN'),M.n('BC')),
      'إذا كان M على [AB] و N على [AC] و (MN) ∥ (BC) تتساوى النسب الثلاث.','نظرية طاليس'),
      S('النسبة المعلومة',M.frac(M.n(k[2]),M.n(k[3]))+M.eq()+M.frac(M.q(k[0]),M.q(k[1]))+M.eq()+M.q(ratio),'','حساب النسبة'),
      S('نساوي النسبة المجهولة',M.frac(M.n(m[2]),M.n(m[3]))+M.eq()+M.q(ratio),'','تساوي النسب'),
      S('نضرب تبادليًا',M.n(m[3])+M.eq()+M.frac(M.q(m[0]),M.q(ratio))+M.eq()+M.q(val),'','التناسب')],
    answer:{html:M.n(m[3])+M.eq()+M.q(val)+M.sp()+M.txt('سم'),text:m[3]+' = '+val.txt(),x:X.q(val),unit:'سم'},
    verify:{html:M.frac(M.n(m[2]),M.q(val))+M.eq()+M.q(ratio),ok:val.div(m[0]).eq(ratio),note:'النسبة محفوظة ✔'},practice:'thales'});
};
/* ══ النسب المثلثية ══ */
SOL.trig=function(t){
  var n=DM.norm(t);
  var ang=n.match(/(sin|cos|tan)\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?/);
  if(ang&&!/مثلث|AB|AC|BC/.test(n)){
    var fn=ang[1],dg=Number(ang[2]),ex=DM.trig.exact(fn,dg),v=DM.trig.val(fn,dg);
    var steps=[S('نحدّد الزاوية',M.n(DM.num.fmt(dg,3)+'°'),'نُرجع الزاوية إلى الدورة [0°,360°).','الدورة المثلثية')];
    if(ex)steps.push(S('زاوية خاصة',M.fn(fn,M.n(String(DM.trig.norm(dg))))+M.eq()+M.x(ex),
      'قيم الزوايا 0,30,45,60,90 تُحفظ مضبوطة بالجذور.','الزوايا الخاصة'));
    else steps.push(S('نحسب',M.fn(fn,M.n(String(dg)))+M.eq()+M.xa(v),'زاوية غير خاصة فنقرّب.','حساب'));
    if(fn!=='tan'){var other=fn==='sin'?'cos':'sin';var ov=DM.trig.val(other,dg);
      steps.push(S('نتحقّق بالمتطابقة',M.sup(M.fn('sin',M.n(String(dg))),M.n('2'))+M.op('+')+M.sup(M.fn('cos',M.n(String(dg))),M.n('2'))+M.eq()+M.n('1'),
        'المتطابقة الفيثاغورية تتحقّق لكل زاوية.','sin²+cos²=1'))}
    return mk({topic:'trig',label:'sin_cos_tan · زاوية',input:t,steps:steps,
      answer:{html:M.xa(v),text:DM.render.text(v),x:v},practice:'trigAngle'});
  }
  var AB=lbl(n,['AB']),AC=lbl(n,['AC']),BC=lbl(n,['BC']);
  var angle=(n.match(/(?:الزاوية|زاوية)\s*([A-Za-z])/)||[])[1]||'B';
  if(!AB||!AC){var ns=nums(n);if(ns.length>=2){AB=ns[0];AC=ns[1];BC=ns[2]||null}}
  if(!AB||!AC)throw new E('اكتب ضلعي القائمة، مثل: sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5','trig');
  var steps=[S('نعيّن المثلث',M.txt('ABC قائم في A، الوتر [BC]'),'الوتر مقابل الزاوية القائمة وهو الأطول.','تعريف الوتر')];
  var bc;
  if(!BC){var s=AB.mul(AB).add(AC.mul(AC));bc=X.rad(R.sqrtQ(s));
    steps.push(S('نحسب الوتر بفيثاغورس',M.sup(M.n('BC'),M.n('2'))+M.eq()+M.sup(M.q(AB),M.n('2'))+M.op('+')+M.sup(M.q(AC),M.n('2'))+M.eq()+M.q(s),'','فيثاغورس'),
      S('الوتر',M.n('BC')+M.eq()+M.xa(bc),'','الجذر'))}
  else bc=X.q(BC);
  var opp=angle.toUpperCase()==='C'?X.q(AB):X.q(AC),adj=angle.toUpperCase()==='C'?X.q(AC):X.q(AB);
  steps.push(S('نعيّن الأضلاع بالنسبة للزاوية '+angle,M.lbl('المقابل')+M.x(opp)+M.sp()+M.lbl('المجاور')+M.x(adj)+M.sp()+M.lbl('الوتر')+M.xa(bc),
    'المقابل لا يمسّ الزاوية، والمجاور يمسّها وليس الوتر.','تسمية الأضلاع'));
  var sv=opp.div(bc),cv=adj.div(bc),tv=opp.div(adj);
  steps.push(S('sin = المقابل ÷ الوتر',M.fn('sin',M.v(angle))+M.eq()+M.frac(M.x(opp),M.xa(bc))+M.eq()+M.xa(sv),'','تعريف sin'),
    S('cos = المجاور ÷ الوتر',M.fn('cos',M.v(angle))+M.eq()+M.frac(M.x(adj),M.xa(bc))+M.eq()+M.xa(cv),'','تعريف cos'),
    S('tan = المقابل ÷ المجاور',M.fn('tan',M.v(angle))+M.eq()+M.frac(M.x(opp),M.x(adj))+M.eq()+M.xa(tv),'','تعريف tan'),
    S('نتحقّق',M.frac(M.xa(sv),M.xa(cv))+M.eq()+M.xa(tv),'tan = sin ÷ cos دائمًا.','المتطابقة الأساسية'));
  return mk({topic:'trig',label:'sin_cos_tan · مثلث قائم',input:t,steps:steps,
    answer:{html:M.lbl('sin')+M.xa(sv)+M.sp()+M.lbl('cos')+M.xa(cv)+M.sp()+M.lbl('tan')+M.xa(tv),
      text:'sin='+DM.render.text(sv)+' cos='+DM.render.text(cv)+' tan='+DM.render.text(tv),x:sv},
    verify:{html:M.sup(M.xa(sv),M.n('2'))+M.op('+')+M.sup(M.xa(cv),M.n('2'))+M.eq()+M.n('1'),
      ok:Math.abs(sv.val()*sv.val()+cv.val()*cv.val()-1)<1e-9,note:'sin²+cos²=1 ✔'},practice:'trigTri'});
};
/* ══ قانون الجيب / جيب التمام ══ */
SOL.triangleSolve=function(t){
  var n=DM.norm(t);
  var a=lbl(n,['a','الضلع a']),b=lbl(n,['b','الضلع b']),c=lbl(n,['c','الضلع c']);
  var A=lbl(n,['A','الزاوية A']),B=lbl(n,['B','الزاوية B']),C=lbl(n,['C','الزاوية C']);
  if(/مساحة/.test(n)&&a&&b&&C){
    var ar=X.q(a.mul(b).div(q2)).mul(DM.trig.val('sin',C.val()));
    return mk({topic:'triangle',label:'مساحة مثلث بضلعين وزاوية',input:t,
      steps:[S('القانون',M.v('A')+M.eq()+M.frac(M.n('1'),M.n('2'))+M.v('a')+M.v('b')+M.fn('sin',M.v('C')),
        'نستعمل الزاوية المحصورة بين الضلعين.','قانون المساحة'),
        S('نعوّض',M.frac(M.n('1'),M.n('2'))+M.op('×')+M.q(a)+M.op('×')+M.q(b)+M.op('×')+M.xa(DM.trig.val('sin',C.val())),'',''),
        S('نحسب',M.xa(ar),'','')],
      answer:{html:M.xa(ar),text:DM.num.fmt(ar.val(),4),x:ar}});
  }
  if(a&&b&&C&&!c){
    var c2=a.mul(a).add(b.mul(b)).sub(a.mul(b).mul(q2).mul(DM.trig.val('cos',C.val())));
    var cv=X.n(Math.sqrt(c2.val()));
    return mk({topic:'triangle',label:'قانون جيب التمام',input:t,
      steps:[S('القانون',M.sup(M.v('c'),M.n('2'))+M.eq()+M.sup(M.v('a'),M.n('2'))+M.op('+')+M.sup(M.v('b'),M.n('2'))+M.op('−')+M.n('2')+M.v('ab')+M.fn('cos',M.v('C')),
        'يصلح لأي مثلث وليس القائم فقط؛ عندما C=90° يصبح فيثاغورس.','قانون جيب التمام'),
        S('نعوّض',M.sup(M.v('c'),M.n('2'))+M.eq()+M.q(a.mul(a))+M.op('+')+M.q(b.mul(b))+M.op('−')+M.n('2')+M.op('×')+M.q(a.mul(b))+M.op('×')+M.xa(DM.trig.val('cos',C.val())),'',''),
        S('نحسب',M.sup(M.v('c'),M.n('2'))+M.eq()+M.n(DM.num.fmt(c2.val(),6)),'',''),
        S('نأخذ الجذر',M.v('c')+M.eq()+M.xa(cv),'','')],
      answer:{html:M.v('c')+M.eq()+M.xa(cv),text:DM.num.fmt(cv.val(),4),x:cv}});
  }
  if(a&&A&&B&&!b){
    var bb=X.q(a).mul(DM.trig.val('sin',B.val())).div(DM.trig.val('sin',A.val()));
    return mk({topic:'triangle',label:'قانون الجيب',input:t,
      steps:[S('القانون',M.frac(M.v('a'),M.fn('sin',M.v('A')))+M.eq()+M.frac(M.v('b'),M.fn('sin',M.v('B')))+M.eq()+M.frac(M.v('c'),M.fn('sin',M.v('C'))),
        'في أي مثلث النسبة بين الضلع وجيب زاويته المقابلة ثابتة.','قانون الجيب'),
        S('نعزل b',M.v('b')+M.eq()+M.frac(M.q(a)+M.op('×')+M.xa(DM.trig.val('sin',B.val())),M.xa(DM.trig.val('sin',A.val()))),'',''),
        S('نحسب',M.v('b')+M.eq()+M.xa(bb),'','')],
      answer:{html:M.v('b')+M.eq()+M.xa(bb),text:DM.num.fmt(bb.val(),4),x:bb}});
  }
  throw new E('اكتب مثل: مثلث a=5 b=7 C=60 أوجد c، أو a=8 A=40 B=70 أوجد b، أو مساحة a=5 b=7 C=60','tri');
};
/* ══ الهندسة الإحداثية ══ */
SOL.coordinate=function(t){
  var n=DM.norm(t);
  var re=/([A-Za-z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g,pts=[],m;
  while((m=re.exec(n))!==null)pts.push({n:m[1],x:Q.parse(m[2]),y:Q.parse(m[3])});
  if(/مستقيم|ميل|تعامد|توازي/.test(n)&&pts.length>=2){
    var A=pts[0],B=pts[1];
    if(/ميل/.test(n)){
      if(B.x.eq(A.x))return mk({topic:'coordinate',label:'ميل مستقيم شاقولي',input:t,
        steps:[S('نحسب الفرق',M.q(B.x)+M.op('−')+M.q(A.x)+M.eq()+M.n('0'),'السينات متساوية فالمستقيم شاقولي.','الميل'),
          S('الميل غير معرّف',M.txt('القسمة على صفر'),'المستقيم الشاقولي ليس له ميل عددي.','حالة خاصة')],
        answer:{html:M.txt('غير معرّف (شاقولي)'),text:'غير معرّف'}});
      var sl=B.y.sub(A.y).div(B.x.sub(A.x));
      return mk({topic:'coordinate',label:'ميل مستقيم',input:t,
        steps:[S('القانون',M.v('m')+M.eq()+M.frac(M.v('y₂')+M.op('−')+M.v('y₁'),M.v('x₂')+M.op('−')+M.v('x₁')),'الميل = التغيّر الرأسي ÷ الأفقي.','تعريف الميل'),
          S('نعوّض',M.v('m')+M.eq()+M.frac(M.q(B.y)+M.op('−')+M.q(A.y),M.q(B.x)+M.op('−')+M.q(A.x)),'',''),
          S('نحسب',M.v('m')+M.eq()+M.q(sl),'','')],
        answer:{html:M.v('m')+M.eq()+M.q(sl),text:sl.txt(),x:X.q(sl)}});
    }
    if(B.x.eq(A.x)){
      return mk({topic:'coordinate',label:'معادلة مستقيم شاقولي',input:t,
        steps:[S('السينات متساوية',M.q(A.x)+M.eq()+M.q(B.x),'المستقيم شاقولي.','حالة خاصة')],
        answer:{html:M.v('x')+M.eq()+M.q(A.x),text:'x = '+A.x.txt()}});
    }
    var sl2=B.y.sub(A.y).div(B.x.sub(A.x)),b0=A.y.sub(sl2.mul(A.x));
    return mk({topic:'coordinate',label:'معادلة مستقيم من نقطتين',input:t,
      steps:[S('نحسب الميل',M.v('m')+M.eq()+M.frac(M.q(B.y.sub(A.y)),M.q(B.x.sub(A.x)))+M.eq()+M.q(sl2),'','الميل'),
        S('نستعمل صيغة النقطة والميل',M.v('y')+M.op('−')+M.q(A.y)+M.eq()+M.q(sl2)+M.par(M.v('x')+M.op('−')+M.q(A.x)),'','صيغة النقطة والميل'),
        S('نبسّط',M.v('y')+M.eq()+M.q(sl2)+M.v('x')+M.op(b0.sign()<0?'−':'+')+M.q(b0.abs()),'نوزّع ثم نجمع الثوابت.','الصورة y=mx+b'),
        S('الصورة العامة',M.q(sl2)+M.v('x')+M.op('−')+M.v('y')+M.op(b0.sign()<0?'−':'+')+M.q(b0.abs())+M.eq()+M.n('0'),'ننقل كل الحدود لطرف.','ax+by+c=0')],
      answer:{html:M.v('y')+M.eq()+M.q(sl2)+M.v('x')+M.op(b0.sign()<0?'−':'+')+M.q(b0.abs()),
        text:'y = '+sl2.txt()+'x '+(b0.sign()<0?'- ':'+ ')+b0.abs().txt()},
      verify:{html:M.q(A.y)+M.eq()+M.q(sl2.mul(A.x).add(b0))+M.sp()+M.q(B.y)+M.eq()+M.q(sl2.mul(B.x).add(b0)),
        ok:A.y.eq(sl2.mul(A.x).add(b0))&&B.y.eq(sl2.mul(B.x).add(b0)),note:'النقطتان تحقّقان المعادلة ✔'}});
  }
  if(/دائرة/.test(n)&&pts.length>=1){
    var C0=pts[0],r=nums(n).filter(function(v){return !v.eq(C0.x)&&!v.eq(C0.y)})[0]||lbl(n,['نصف\\s*ال?قطر','r'])||q1;
    return mk({topic:'coordinate',label:'معادلة دائرة',input:t,
      steps:[S('القانون',M.sup(M.par(M.v('x')+M.op('−')+M.v('h')),M.n('2'))+M.op('+')+M.sup(M.par(M.v('y')+M.op('−')+M.v('k')),M.n('2'))+M.eq()+M.sup(M.v('r'),M.n('2')),
        'كل نقطة تبعد r عن المركز (h,k).','تعريف الدائرة'),
        S('نعوّض',M.sup(M.par(M.v('x')+M.op(C0.x.sign()<0?'+':'−')+M.q(C0.x.abs())),M.n('2'))+M.op('+')+
          M.sup(M.par(M.v('y')+M.op(C0.y.sign()<0?'+':'−')+M.q(C0.y.abs())),M.n('2'))+M.eq()+M.q(r.mul(r)),'','')],
      answer:{html:M.sup(M.par(M.v('x')+M.op(C0.x.sign()<0?'+':'−')+M.q(C0.x.abs())),M.n('2'))+M.op('+')+
        M.sup(M.par(M.v('y')+M.op(C0.y.sign()<0?'+':'−')+M.q(C0.y.abs())),M.n('2'))+M.eq()+M.q(r.mul(r)),text:'—'}});
  }
  if(pts.length<2)throw new E('اكتب نقطتين مثل A(1,2) B(4,6) مع المطلوب: مسافة، منتصف، شعاع، ميل، معادلة مستقيم.','coord');
  var A2=pts[0],B2=pts[1],dx=B2.x.sub(A2.x),dy=B2.y.sub(A2.y);
  if(/منتصف/.test(n)){var mx=A2.x.add(B2.x).div(q2),my=A2.y.add(B2.y).div(q2);
    return mk({topic:'coordinate',label:'منتصف قطعة',input:t,
      steps:[S('القانون',M.par(M.frac(M.v('x₁')+M.op('+')+M.v('x₂'),M.n('2'))+M.op(',')+M.frac(M.v('y₁')+M.op('+')+M.v('y₂'),M.n('2'))),
        'المنتصف متوسط إحداثيات الطرفين.','قانون المنتصف'),
        S('نعوّض',M.par(M.frac(M.q(A2.x)+M.op('+')+M.q(B2.x),M.n('2'))+M.op(',')+M.frac(M.q(A2.y)+M.op('+')+M.q(B2.y),M.n('2'))),'',''),
        S('نحسب',M.par(M.q(mx)+M.op(',')+M.q(my)),'','')],
      answer:{html:M.par(M.q(mx)+M.op(',')+M.q(my)),text:'('+mx.txt()+' , '+my.txt()+')',x:X.q(mx)},practice:'mid'});}
  if(/شعاع|متجه|إحداثيات/.test(n)){
    return mk({topic:'vector',label:'إحداثيات شعاع',input:t,
      steps:[S('القانون',M.v('AB')+M.par(M.v('x_B')+M.op('−')+M.v('x_A')+M.op(',')+M.v('y_B')+M.op('−')+M.v('y_A')),
        'إحداثيا الشعاع = النهاية − البداية.','إحداثيات شعاع'),
        S('نطرح',M.par(M.q(B2.x)+M.op('−')+M.par(M.q(A2.x))+M.op(',')+M.q(B2.y)+M.op('−')+M.par(M.q(A2.y))),'',''),
        S('النتيجة',M.par(M.q(dx)+M.op(',')+M.q(dy)),'','')],
      answer:{html:M.par(M.q(dx)+M.op(',')+M.q(dy)),text:'('+dx.txt()+' , '+dy.txt()+')',x:X.q(dx)},practice:'vec'});}
  var s=dx.mul(dx).add(dy.mul(dy)),dv=X.rad(R.sqrtQ(s));
  var steps=[S('القانون',M.v('AB')+M.eq()+M.root(M.sup(M.par(M.v('x_B')+M.op('−')+M.v('x_A')),M.n('2'))+M.op('+')+M.sup(M.par(M.v('y_B')+M.op('−')+M.v('y_A')),M.n('2'))),
    'في معلم متعامد ممنظم نُطبّق فيثاغورس على فرق الإحداثيات.','قانون المسافة'),
    S('نعوّض',M.root(M.sup(M.par(M.q(dx)),M.n('2'))+M.op('+')+M.sup(M.par(M.q(dy)),M.n('2'))),'','التعويض'),
    S('نربّع ونجمع',M.root(M.q(dx.mul(dx))+M.op('+')+M.q(dy.mul(dy)))+M.eq()+M.root(M.q(s)),'','حساب'),
    S('النتيجة',M.v('AB')+M.eq()+M.xa(dv),'نبقي الجذر مضبوطًا ثم نقرّب.','الجذر')];
  return mk({topic:'coordinate',label:'المسافة بين نقطتين',input:t,steps:steps,
    answer:{html:M.xa(dv),text:DM.render.text(dv),x:dv},
    verify:{html:M.sup(M.xa(dv),M.n('2'))+M.eq()+M.q(s),ok:true,note:'بتربيع المسافة نعود إلى مجموع المربّعات ✔'},practice:'dist'});
};
/* ══ الأشعة ══ */
SOL.vector=function(t){
  var n=DM.norm(t);
  var re=/\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g,v=[],m;
  while((m=re.exec(n))!==null)v.push({x:Q.parse(m[1]),y:Q.parse(m[2])});
  if(!v.length)throw new E('اكتب أشعة مثل (3,4) و (1,2) مع المطلوب: طويلة، جداء قياسي، زاوية، جمع.','vec');
  var u=v[0];
  if(/طويلة|معيار|طول/.test(n)||v.length===1){
    var s=u.x.mul(u.x).add(u.y.mul(u.y)),mag=X.rad(R.sqrtQ(s));
    return mk({topic:'vector',label:'طويلة شعاع',input:t,
      steps:[S('القانون',M.abs(M.v('u'))+M.eq()+M.root(M.sup(M.v('x'),M.n('2'))+M.op('+')+M.sup(M.v('y'),M.n('2'))),'الطويلة تطبيق لفيثاغورس.','معيار الشعاع'),
        S('نعوّض',M.root(M.sup(M.q(u.x),M.n('2'))+M.op('+')+M.sup(M.q(u.y),M.n('2'))),'',''),
        S('نحسب',M.abs(M.v('u'))+M.eq()+M.xa(mag),'','')],
      answer:{html:M.xa(mag),text:DM.render.text(mag),x:mag}});
  }
  var w=v[1];
  if(/جداء|قياسي|dot/.test(n)){
    var dot=u.x.mul(w.x).add(u.y.mul(w.y));
    var perp=dot.zero();
    return mk({topic:'vector',label:'الجداء القياسي',input:t,
      steps:[S('القانون',M.v('u')+M.op('·')+M.v('w')+M.eq()+M.v('x₁')+M.v('x₂')+M.op('+')+M.v('y₁')+M.v('y₂'),'نضرب الإحداثيات المتناظرة ثم نجمع.','الجداء القياسي'),
        S('نعوّض',M.q(u.x)+M.op('×')+M.q(w.x)+M.op('+')+M.q(u.y)+M.op('×')+M.q(w.y),'',''),
        S('نحسب',M.v('u')+M.op('·')+M.v('w')+M.eq()+M.q(dot),'',''),
        S('الاستنتاج',M.txt(perp?'الشعاعان متعامدان (الجداء = 0)':'الشعاعان غير متعامدين'),
          'الجداء القياسي معدوم يكافئ التعامد.','شرط التعامد')],
      answer:{html:M.q(dot),text:dot.txt(),x:X.q(dot)}});
  }
  if(/زاوية/.test(n)){
    var d=u.x.mul(w.x).add(u.y.mul(w.y));
    var mu=Math.sqrt(u.x.val()**2+u.y.val()**2),mw=Math.sqrt(w.x.val()**2+w.y.val()**2);
    if(!mu||!mw)throw new E('الشعاع الصفري لا يحدّد زاوية.','domain');
    var cs=Math.max(-1,Math.min(1,d.val()/(mu*mw))),deg=Math.acos(cs)*180/Math.PI;
    return mk({topic:'vector',label:'الزاوية بين شعاعين',input:t,
      steps:[S('القانون',M.fn('cos',M.v('θ'))+M.eq()+M.frac(M.v('u')+M.op('·')+M.v('w'),M.abs(M.v('u'))+M.op('×')+M.abs(M.v('w'))),
        'من تعريف الجداء القياسي الهندسي.','الجداء والزاوية'),
        S('نحسب الجداء والطويلتين',M.q(d)+M.sp()+M.n(DM.num.fmt(mu,4))+M.sp()+M.n(DM.num.fmt(mw,4)),'',''),
        S('نأخذ acos',M.v('θ')+M.eq()+M.n(DM.num.fmt(deg,3)+'°'),'','')],
      answer:{html:M.v('θ')+M.eq()+M.n(DM.num.fmt(deg,3)+'°'),text:DM.num.fmt(deg,3)+'°'}});
  }
  var sx=u.x.add(w.x),sy=u.y.add(w.y);
  return mk({topic:'vector',label:'جمع شعاعين',input:t,
    steps:[S('القانون',M.v('u')+M.op('+')+M.v('w')+M.eq()+M.par(M.v('x₁')+M.op('+')+M.v('x₂')+M.op(',')+M.v('y₁')+M.op('+')+M.v('y₂')),'نجمع الإحداثيات المتناظرة.','جمع الأشعة'),
      S('نعوّض',M.par(M.q(u.x)+M.op('+')+M.q(w.x)+M.op(',')+M.q(u.y)+M.op('+')+M.q(w.y)),'',''),
      S('النتيجة',M.par(M.q(sx)+M.op(',')+M.q(sy)),'','')],
    answer:{html:M.par(M.q(sx)+M.op(',')+M.q(sy)),text:'('+sx.txt()+' , '+sy.txt()+')',x:X.q(sx)}});
};
/* ══ التحويلات ══ */
SOL.transform=function(t){
  var n=DM.norm(t);
  var m=n.match(/\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/);
  if(!m)throw new E('اكتب نقطة مثل (3,4) ونوع التحويل: انسحاب، تناظر، دوران، تحاكي.','trans');
  var x=Q.parse(m[1]),y=Q.parse(m[2]),rx,ry,name,rule,steps;
  if(/انسحاب|إزاحة/.test(n)){
    var vm=n.match(/شعاع\s*\(\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\)/)||n.match(/\(\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\)\s*$/);
    var a=vm?Q.parse(vm[1]):q(2n),b=vm?Q.parse(vm[2]):q(3n);
    rx=x.add(a);ry=y.add(b);name='انسحاب';rule='(x,y) → (x+a, y+b)';
    steps=[S('قاعدة الانسحاب',M.txt(rule),'الانسحاب يضيف شعاعًا ثابتًا لكل نقطة.','الانسحاب'),
      S('نعوّض',M.par(M.q(x)+M.op('+')+M.q(a)+M.op(',')+M.q(y)+M.op('+')+M.q(b)),'',''),
      S('الصورة',M.par(M.q(rx)+M.op(',')+M.q(ry)),'','')];
  }else if(/دوران/.test(n)){
    var dg=(n.match(/(\d+)\s*°?/g)||['90']).map(function(s){return parseInt(s,10)}).filter(function(v){return [90,180,270].indexOf(v)>=0})[0]||90;
    if(dg===90){rx=y.neg();ry=x}else if(dg===180){rx=x.neg();ry=y.neg()}else{rx=y;ry=x.neg()}
    name='دوران '+dg+'°';rule=dg===90?'(x,y) → (−y, x)':dg===180?'(x,y) → (−x, −y)':'(x,y) → (y, −x)';
    steps=[S('قاعدة الدوران حول المبدأ',M.txt(rule),'الدوران الموجب عكس عقارب الساعة.','الدوران'),
      S('نعوّض',M.par(M.q(x)+M.op(',')+M.q(y)),'',''),
      S('الصورة',M.par(M.q(rx)+M.op(',')+M.q(ry)),'',''),
      S('تحقّق الطويلة',M.root(M.q(x.mul(x).add(y.mul(y))))+M.eq()+M.root(M.q(rx.mul(rx).add(ry.mul(ry)))),'الدوران يحفظ المسافات.','التحويلات الحافظة')];
  }else if(/تحاكي|تماثل مركزي|تكبير/.test(n)){
    var k=lbl(n,['نسبة','k','معامل'])||q2;
    rx=x.mul(k);ry=y.mul(k);name='تحاكي نسبته '+k.txt();rule='(x,y) → (kx, ky)';
    steps=[S('قاعدة التحاكي',M.txt(rule),'التحاكي يضرب الإحداثيات في النسبة.','التحاكي'),
      S('الصورة',M.par(M.q(rx)+M.op(',')+M.q(ry)),'',''),
      S('أثر النسبة',M.txt(k.abs().val()>1?'تكبير':'تصغير'),'|k|>1 تكبير، |k|<1 تصغير.','أثر النسبة')];
  }else{
    var mode=/محور\s*الصادات|y=x|المستقيم y=x/.test(n)?'yx':/محور\s*السينات|محور x/.test(n)?'x':/محور\s*الordinates|محور y|الصادات/.test(n)?'y':/المبدأ|المركز|مركزي/.test(n)?'o':'x';
    if(mode==='x'){rx=x;ry=y.neg();name='تناظر محوري حول محور السينات';rule='(x,y) → (x, −y)'}
    else if(mode==='y'){rx=x.neg();ry=y;name='تناظر محوري حول محور الصادات';rule='(x,y) → (−x, y)'}
    else if(mode==='yx'){rx=y;ry=x;name='تناظر حول المستقيم y=x';rule='(x,y) → (y, x)'}
    else{rx=x.neg();ry=y.neg();name='تناظر مركزي حول المبدأ';rule='(x,y) → (−x, −y)'}
    steps=[S('القاعدة',M.txt(rule),'التناظر يعكس الإشارة بالنسبة للمحور أو المركز.','التناظر'),
      S('الصورة',M.par(M.q(rx)+M.op(',')+M.q(ry)),'',''),
      S('حفظ المسافة',M.txt('المسافة إلى المحور/المركز محفوظة'),'التناظر تحويل حافظ.','التحويلات الحافظة')];
  }
  return mk({topic:'transform',label:name,input:t,steps:steps,
    answer:{html:M.par(M.q(rx)+M.op(',')+M.q(ry)),text:'('+rx.txt()+' , '+ry.txt()+')'}});
};
Object.keys(SOL).forEach(function(k){DM.SOL[k]=SOL[k]});
})();