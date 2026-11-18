/* js/solvers-num.js — الأعداد والعمليات: كسور، نسب، قوى، جذور، متتاليات، توافيق، احتمالات، إحصاء */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X,M=DM.M,q=DM.q,q0=DM.q0,q1=DM.q1,q2=DM.q2,E=DM.E,P=DM.P;
var S=M.step,SOL={};DM.SOL=DM.SOL||{};
function mk(o){o.steps=o.steps||[];o.methods=o.methods||null;o.verify=o.verify||null;o.warnings=o.warnings||[];
  o.answer=o.answer||{html:M.txt('—'),text:'—'};return o}
function nums(t){var m=t.match(/-?\d+(?:\.\d+)?/g);return m?m.map(function(v){return Q.parse(v)}):[]}
function lbl(t,keys){for(var i=0;i<keys.length;i++){
  var m=t.match(new RegExp(keys[i]+'\\s*(?:=|:)?\\s*(-?\\d+(?:\\.\\d+)?)'));if(m)return Q.parse(m[1])}return null}
DM.nums=nums;DM.lbl=lbl;DM.mk=mk;

/* ══ 1) العمليات الحسابية بترتيب مضبوط ══ */
function ready(n,path,d,out,par){
  if(n.t==='bin'){ready(n.l,path.concat('l'),d+1,out,par);ready(n.r,path.concat('r'),d+1,out,par);
    if(n.l.t==='num'&&n.r.t==='num')out.push({p:path,d:d,pr:n.op==='+'||n.op==='-'?1:n.op==='*'||n.op==='/'?2:3,i:out.length,n:n,par:par})}
  else if(n.t==='par')ready(n.a,path.concat('a'),d+1,out,true);
  else if(n.t==='neg'){ready(n.a,path.concat('a'),d+1,out,par);
    if(n.a.t==='num')out.push({p:path,d:d,pr:5,i:out.length,n:n,par:par})}
  else if(n.t==='pct'||n.t==='fact'){ready(n.a,path.concat('a'),d+1,out,par);
    if(n.a.t==='num')out.push({p:path,d:d,pr:6,i:out.length,n:n,par:par})}
  else if(n.t==='fn'){var allNum=n.a.every(function(x){return x.t==='num'});
    n.a.forEach(function(x,i){ready(x,path.concat('a',i),d+1,out,par)});
    if(allNum)out.push({p:path,d:d,pr:7,i:out.length,n:n,par:par})}
}
SOL.arithmetic=function(t){
  var raw=t.replace(/[^\d+\-*/^().√%!πa-z]/gi,' ').trim();
  var ast=DM.parse(DM.toMath(DM.norm(t)));
  if(DM.vars(ast).length)throw new E('هذا التعبير يحوي مجهولًا؛ استعمل قسم المعادلات.','vars');
  var start=M.ast(ast),steps=[],guard=0,cur=ast;
  steps.push(S('نكتب العملية',start,'نطبّق ترتيب العمليات: الأقواس ← القوى والجذور ← الضرب والقسمة ← الجمع والطرح.','ترتيب العمليات'));
  while(guard++<120){
    var out=[];ready(cur,[],0,out,false);
    if(!out.length)break;
    out.sort(function(a,b){return b.d-a.d||b.pr-a.pr||a.i-b.i});
    var pick=out[0],node=pick.n,before=M.ast(cur),val,title,why='',rule='';
    if(node.t==='neg'){val=node.a.v.neg();title='نعالج الإشارة';why='سالب العدد هو معاكسه على خط الأعداد.';rule='الأعداد النسبية'}
    else if(node.t==='pct'){val=node.a.v.div(q(100n));title='نحوّل النسبة إلى كسر';why='الرمز ٪ يعني «من كل مائة».';rule='النسبة المئوية'}
    else if(node.t==='fact'){val=new Q(DM.num.fact(Number(node.a.v.n)));title='نحسب المضروب';why='ن! = ن×(ن−1)×…×1.';rule='المضروب'}
    else if(node.t==='fn'){val=DM.eval(node).asQ();
      if(!val)val=null;
      if(val===null){var xv=DM.eval(node);val=xv.asQ()||q(BigInt(Math.round(xv.val())));why='قيمة الدالة محسوبة.'}
      title='نحسب '+node.v;rule='الدوال'}
    else{
      var A=node.l.v,B=node.r.v,op=node.op;
      title=(pick.par?'داخل الأقواس — ':'')+({'+':'نجمع','-':'نطرح','*':'نضرب','/':'نقسم','^':'نحسب القوة'}[op]);
      rule={' +':'','+':'جمع الأعداد النسبية','-':'طرح الأعداد النسبية','*':'الضرب','/':'القسمة','^':'قوانين الأسس'}[op];
      if(op==='+'){val=A.add(B);
        why=(A.d!==1n||B.d!==1n)?'نوحّد المقامات على م.م.أ ثم نجمع البسوط.':(A.sign()!==B.sign()?'مختلفا الإشارة: نطرح القيمتين ونأخذ إشارة الأكبر قيمة.':'نجمع القيمتين.');}
      else if(op==='-'){val=A.sub(B);why='طرح عدد = جمع معاكسه؛ لهذا تنعكس الإشارة عند طرح سالب.'}
      else if(op==='*'){val=A.mul(B);why=(A.d!==1n||B.d!==1n)?'بسط×بسط ومقام×مقام، ثم نختصر.':'الضرب يسبق الجمع والطرح.'}
      else if(op==='/'){val=A.div(B);why='القسمة على عدد = الضرب في مقلوبه.'}
      else{if(!B.int()||Math.abs(Number(B.n))>32)throw new E('الأس كبير أو غير صحيح.','deg');
        val=A.pow(Number(B.n));why='القوة تكرار ضرب الأساس في نفسه '+B.txt()+' مرة.'}
    }
    var next=DM.clone(cur);
    if(pick.p.length===0){Object.keys(next).forEach(function(k){delete next[k]});next.t='num';next.v=val}
    else{var ptr=next,i;for(i=0;i<pick.p.length-1;i++){var key=pick.p[i];ptr=(key==='a'&&Array.isArray(ptr.a))?ptr.a:ptr[key]}
      var last=pick.p[pick.p.length-1];
      if(Array.isArray(ptr))ptr[last]={t:'num',v:val};else ptr[last]={t:'num',v:val}}
    cur=next;
    steps.push(S(title,before+M.eq()+M.ast(cur),why,rule));
    if(cur.t==='num')break;
  }
  var res=DM.eval(ast);
  var rq=res.asQ();
  return mk({topic:'arithmetic',label:'الأعداد · ترتيب العمليات',input:t,given:[{l:'العملية',h:start}],
    steps:steps,answer:{html:M.xa(res),text:rq?rq.txt():DM.num.fmt(res.val(),6),x:res},
    verify:{html:M.xa(res),ok:true,note:'أُعيد الحساب بالطريقة نفسها على شجرة التعبير مستقلّة عن الخطوات.'},
    practice:'arith'});
};
/* ══ 2) الكسور ══ */
SOL.fraction=function(t){
  var n=DM.norm(t),ast=DM.parse(DM.toMath(n));
  var val=DM.eval(ast),qv=val.asQ();
  if(!qv)throw new E('الناتج ليس كسرًا نسبيًا.','frac');
  var steps=[S('نكتب العملية',M.ast(ast),'كل كسر بسط ومقام؛ المقام لا يساوي صفرًا.','تعريف الكسر')];
  var fr=n.match(/(-?\d+)\/(\d+)\s*([+\-*/])\s*(-?\d+)\/(\d+)/);
  if(fr){
    var a=new Q(BigInt(fr[1]),BigInt(fr[2])),b=new Q(BigInt(fr[4]),BigInt(fr[5])),op=fr[3];
    if(op==='+'||op==='-'){
      var L=DM.blcm(a.d,b.d),A=a.n*(L/a.d),B=b.n*(L/b.d);
      steps.push(S('نوجد م.م.أ للمقامات',M.n('lcm('+a.d+','+b.d+')')+M.eq()+M.n(L.toString()),'أصغر عدد يقبل القسمة على المقامين معًا.','المضاعف المشترك الأصغر'));
      steps.push(S('نوحّد المقامات',M.frac(M.n(A.toString()),M.n(L.toString()))+M.op(op==='+'?'+':'−')+M.frac(M.n(B.toString()),M.n(L.toString())),
        'نضرب بسط ومقام كل كسر فيما يجعل مقامه '+L+'.','الكسور المتكافئة'));
      steps.push(S(op==='+'?'نجمع البسوط':'نطرح البسوط',M.frac(M.n(A.toString())+M.op(op==='+'?'+':'−')+M.n(B.toString()),M.n(L.toString()))+M.eq()+M.q(op==='+'?a.add(b):a.sub(b)),
        'المقام لا يتغيّر عند الجمع أو الطرح.','جمع الكسور'));
    }else if(op==='*'){
      steps.push(S('نضرب بسطًا في بسط ومقامًا في مقام',M.frac(M.n(a.n.toString())+M.op('×')+M.n(b.n.toString()),M.n(a.d.toString())+M.op('×')+M.n(b.d.toString())),
        'ضرب الكسور مباشر بلا توحيد مقامات.','ضرب الكسور'));
    }else{
      steps.push(S('نقلب الكسر الثاني ونضرب',M.q(a)+M.op('×')+M.q(b.inv()),'القسمة على كسر = الضرب في مقلوبه.','قسمة الكسور'));
    }
    var r=op==='+'?a.add(b):op==='-'?a.sub(b):op==='*'?a.mul(b):a.div(b);
    steps.push(S('نختصر إلى أبسط صورة',M.q(r),'نقسم البسط والمقام على ق.م.أ = '+DM.bgcd(r.n,r.d)+'.','اختصار الكسور'));
    qv=r;
  }else{
    steps.push(S('نحسب العملية',M.ast(ast)+M.eq()+M.q(qv),'نُنفّذ العمليات بترتيبها المضبوط.','ترتيب العمليات'));
    steps.push(S('أبسط صورة',M.q(qv),'ق.م.أ بين البسط والمقام = '+DM.bgcd(qv.n,qv.d)+'.','اختصار الكسور'));
  }
  return mk({topic:'fraction',label:'الأعداد · الكسور',input:t,given:[{l:'العملية',h:M.ast(ast)}],steps:steps,
    answer:{html:M.q(qv)+M.sp()+M.op('≈')+M.n(DM.num.fmt(qv.val(),5)),text:qv.txt(),x:X.q(qv)},
    verify:{html:M.q(qv)+M.eq()+M.n(DM.num.fmt(qv.val(),8)),ok:true,note:'اختصرنا بق.م.أ فالقيمة لم تتغيّر.'},practice:'frac'});
};
/* ══ 3) النسبة المئوية (٦ أنماط) ══ */
SOL.percent=function(t){
  var n=DM.norm(t),m;
  function pct(a){return a.div(q(100n))}
  if((m=n.match(/(\d+(?:\.\d+)?)\s*%\s*(?:من|of)\s*(\d+(?:\.\d+)?)/))){
    var p=Q.parse(m[1]),N=Q.parse(m[2]),r=pct(p).mul(N);
    return mk({topic:'percent',label:'نسبة من عدد',input:t,given:[{l:'النسبة',h:M.n(p.txt()+'%')},{l:'العدد',h:M.q(N)}],
      steps:[S('نفهم المطلوب',M.txt('نسبة من عدد = النسبة × العدد'),'«من» تعني ضربًا.','معنى النسبة'),
        S('نحوّل النسبة إلى كسر',M.n(p.txt()+'%')+M.eq()+M.frac(M.n(p.txt()),M.n('100'))+M.eq()+M.q(pct(p)),'النسبة المئوية جزء من مائة.','تحويل النسبة'),
        S('نضرب في العدد',M.q(pct(p))+M.op('×')+M.q(N)+M.eq()+M.q(r),'ننفّذ الضرب ثم نختصر.','ضرب الكسور')],
      answer:{html:M.q(r),text:r.txt(),x:X.q(r)},
      verify:{html:M.q(r)+M.op('÷')+M.q(N)+M.op('×')+M.n('100')+M.eq()+M.n(p.txt()+'%'),ok:true,note:'عكسنا العملية فعُدنا إلى النسبة الأصلية ✔'},practice:'pctOf'});
  }
  if((m=n.match(/(زيادة|خصم|تخفيض|نقصان)\s*(\d+(?:\.\d+)?)\s*%\s*(?:من|على)?\s*(\d+(?:\.\d+)?)/))){
    var up=m[1]==='زيادة',p2=Q.parse(m[2]),N2=Q.parse(m[3]),d=pct(p2).mul(N2),fin=up?N2.add(d):N2.sub(d);
    var factor=up?q1.add(pct(p2)):q1.sub(pct(p2));
    return mk({topic:'percent',label:up?'زيادة بالنسبة':'خصم بالنسبة',input:t,
      given:[{l:'الأصل',h:M.q(N2)},{l:'النسبة',h:M.n(p2.txt()+'%')}],
      steps:[S('نحسب قيمة النسبة',M.q(pct(p2))+M.op('×')+M.q(N2)+M.eq()+M.q(d),'نضرب الأصل في النسبة ككسر.','قيمة النسبة'),
        S(up?'نضيف الزيادة':'نطرح الخصم',M.q(N2)+M.op(up?'+':'−')+M.q(d)+M.eq()+M.q(fin),'نعدّل الأصل بمقدار النسبة.','التغيّر بالنسبة'),
        S('طريقة المعامل (أسرع)',M.q(N2)+M.op('×')+M.q(factor)+M.eq()+M.q(fin),'الزيادة بنسبة p تعني الضرب في (1+p)، والخصم في (1−p).','معامل التغيّر')],
      answer:{html:M.q(fin),text:fin.txt(),x:X.q(fin)},
      verify:{html:M.q(fin)+M.op('÷')+M.q(N2)+M.eq()+M.q(factor),ok:true,note:'النسبة بين الجديد والأصل تساوي المعامل ✔'},practice:'pctChange'});
  }
  if((m=n.match(/(\d+(?:\.\d+)?)\s*(?:من|out of)\s*(\d+(?:\.\d+)?)/))&&/نسبة|مئوية|%/i.test(n)){
    var a=Q.parse(m[1]),b=Q.parse(m[2]),r2=a.div(b).mul(q(100n));
    return mk({topic:'percent',label:'إيجاد النسبة',input:t,given:[{l:'الجزء',h:M.q(a)},{l:'الكل',h:M.q(b)}],
      steps:[S('الجزء على الكل',M.frac(M.q(a),M.q(b)),'النسبة = الجزء ÷ الكل.','تعريف النسبة'),
        S('نضرب في 100',M.frac(M.q(a),M.q(b))+M.op('×')+M.n('100')+M.eq()+M.q(r2),'للتحويل من كسر إلى نسبة مئوية.','تحويل إلى مئوية')],
      answer:{html:M.q(r2)+M.n('%'),text:r2.txt()+'%',x:X.q(r2)},practice:'pctFind'});
  }
  if((m=n.match(/(\d+(?:\.\d+)?)\s*%\s*(?:منه|منها|=)?\s*(\d+(?:\.\d+)?)/))&&/أصل|الأصل|قبل/.test(n)){
    var p3=Q.parse(m[1]),v=Q.parse(m[2]),orig=v.div(pct(p3));
    return mk({topic:'percent',label:'إيجاد الأصل',input:t,given:[{l:'النسبة',h:M.n(p3.txt()+'%')},{l:'قيمتها',h:M.q(v)}],
      steps:[S('نكتب العلاقة',M.q(pct(p3))+M.op('×')+M.v('الأصل')+M.eq()+M.q(v),'النسبة × الأصل = القيمة المعطاة.','معادلة النسبة'),
        S('نقسم على النسبة',M.v('الأصل')+M.eq()+M.q(v)+M.op('÷')+M.q(pct(p3))+M.eq()+M.q(orig),'نعزل الأصل بالقسمة.','حلّ معادلة')],
      answer:{html:M.q(orig),text:orig.txt(),x:X.q(orig)},practice:'pctOrig'});
  }
  if(/فائدة|بسيطة|مركبة/.test(n)){
    var P0=lbl(n,['رأس\\s*المال','المبلغ','P'])||nums(n)[0]||q(1000n);
    var rr=lbl(n,['النسبة','معدل','r'])||q(5n);
    var yy=lbl(n,['سنوات','مدة','n','زمن'])||q(2n);
    var comp=/مركبة/.test(n);
    var f=q1.add(pct(rr)),total=comp?P0.mul(f.pow(Number(yy.n))):P0.mul(q1.add(pct(rr).mul(yy)));
    var steps=[S('نحدّد المعطيات',M.lbl('رأس المال')+M.q(P0)+M.sp()+M.lbl('النسبة')+M.n(rr.txt()+'%')+M.sp()+M.lbl('المدة')+M.q(yy),'نقرأ المعطيات قبل اختيار القانون.','معطيات المسألة'),
      S('نكتب القانون',comp?M.v('J')+M.eq()+M.v('P')+M.sup(M.par(M.n('1')+M.op('+')+M.v('r')),M.v('n'))
        :M.v('F')+M.eq()+M.v('P')+M.op('×')+M.v('r')+M.op('×')+M.v('n'),
        comp?'الفائدة المركبة تُحسب على المبلغ المتراكم كل سنة.':'الفائدة البسيطة تُحسب على رأس المال دائمًا.','قانون الفائدة')];
    if(comp){var acc=P0,i;for(i=1;i<=Number(yy.n);i++){acc=acc.mul(f);
      steps.push(S('نهاية السنة '+i,M.q(P0)+M.op('×')+M.sup(M.q(f),M.n(String(i)))+M.eq()+M.q(acc),'نضرب في المعامل مرة كل سنة.','التراكم'))}}
    else steps.push(S('نحسب الفائدة',M.q(P0)+M.op('×')+M.q(pct(rr))+M.op('×')+M.q(yy)+M.eq()+M.q(total.sub(P0)),'نضرب المعطيات الثلاثة.','الفائدة البسيطة'));
    steps.push(S('المبلغ النهائي',M.q(total),'رأس المال + الفائدة.','المبلغ'));
    return mk({topic:'interest',label:comp?'فائدة مركبة':'فائدة بسيطة',input:t,steps:steps,
      answer:{html:M.q(total),text:total.txt(),x:X.q(total)},practice:null});
  }
  throw new E('اكتب النسبة هكذا: 15% من 80، أو خصم 20% من 350، أو 12 من 40 نسبة، أو فائدة بسيطة رأس المال 1000 النسبة 5 سنوات 3.','percent');
};
/* ══ 4) النسبة والتناسب والقسمة التناسبية ══ */
SOL.proportion=function(t){
  var n=DM.norm(t);
  var div=n.match(/قسمة?\s*تناسبية|وزّع|قسم/);
  var ratio=n.match(/(\d+(?:\.\d+)?)\s*[:إلى]\s*(\d+(?:\.\d+)?)(?:\s*[:إلى]\s*(\d+(?:\.\d+)?))?/);
  if(div&&ratio){
    var total=nums(n).filter(function(v){return v.txt()!==ratio[1]&&v.txt()!==ratio[2]})[0]||lbl(n,['المجموع','العدد','مبلغ'])||q(100n);
    var parts=[Q.parse(ratio[1]),Q.parse(ratio[2])];if(ratio[3])parts.push(Q.parse(ratio[3]));
    var sum=parts.reduce(function(a,b){return a.add(b)},q0);
    var steps=[S('نجمع أجزاء النسبة',parts.map(M.q).join(M.op('+'))+M.eq()+M.q(sum),'كل جزء يمثّل حصة من المجموع.','القسمة التناسبية'),
      S('نحسب قيمة الجزء الواحد',M.q(total)+M.op('÷')+M.q(sum)+M.eq()+M.q(total.div(sum)),'نقسم المجموع على عدد الأجزاء.','قيمة الوحدة')];
    var shares=parts.map(function(p,i){var v=total.div(sum).mul(p);
      steps.push(S('الحصة '+(i+1),M.q(p)+M.op('×')+M.q(total.div(sum))+M.eq()+M.q(v),'نضرب قيمة الجزء في عدد أجزاء هذه الحصة.','الحصة'));return v});
    return mk({topic:'proportion',label:'قسمة تناسبية',input:t,steps:steps,
      answer:{html:M.set(shares.map(M.q)),text:shares.map(function(v){return v.txt()}).join(' , '),x:shares[0]?X.q(shares[0]):X.q(q0)},
      verify:{html:shares.map(M.q).join(M.op('+'))+M.eq()+M.q(total),ok:true,note:'مجموع الحصص يساوي المجموع الأصلي ✔'},practice:null});
  }
  var m=n.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\s*\/\s*([A-Za-z\u0621-\u064A])/)
    ||n.match(/(\d+(?:\.\d+)?)\s*\/\s*([A-Za-z\u0621-\u064A])\s*=\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if(m){
    var a,b,c,vn;
    if(/[A-Za-z\u0621-\u064A]/.test(m[4])){a=Q.parse(m[1]);b=Q.parse(m[2]);c=Q.parse(m[3]);vn=m[4]}
    else{a=Q.parse(m[1]);b=Q.parse(m[3]);c=Q.parse(m[4]);vn=m[2]}
    var x=c.mul(b).div(a);
    return mk({topic:'proportion',label:'النسبة والتناسب',input:t,
      given:[{l:'التناسب',h:M.frac(M.q(a),M.q(b))+M.eq()+M.frac(M.q(c),M.v(vn))}],
      steps:[S('نكتب التناسب',M.frac(M.q(a),M.q(b))+M.eq()+M.frac(M.q(c),M.v(vn)),'نسبتان متساويتان.','تعريف التناسب'),
        S('نضرب ضربًا تبادليًا (المقص)',M.q(a)+M.op('×')+M.v(vn)+M.eq()+M.q(b)+M.op('×')+M.q(c),'جداء الطرفين = جداء الوسطين.','خاصية التناسب'),
        S('نحسب الطرف المعلوم',M.q(a)+M.v(vn)+M.eq()+M.q(b.mul(c)),'نضرب العددين المعلومين.','ضرب'),
        S('نقسم على معامل المجهول',M.v(vn)+M.eq()+M.q(b.mul(c))+M.op('÷')+M.q(a)+M.eq()+M.q(x),'نعزل المجهول.','حلّ معادلة')],
      answer:{html:M.v(vn)+M.eq()+M.q(x),text:vn+' = '+x.txt(),x:X.q(x)},
      verify:{html:M.frac(M.q(a),M.q(b))+M.eq()+M.frac(M.q(c),M.q(x)),ok:a.mul(x).eq(b.mul(c)),note:'جداء الطرفين = جداء الوسطين ✔'},practice:'prop'});
  }
  throw new E('اكتب تناسبًا مثل 3/5 = 12/س، أو «قسمة تناسبية 600 بنسبة 2:3».','prop');
};
/* ══ 5) القوى والأسس ══ */
SOL.power=function(t){
  var n=DM.norm(t),ast=DM.parse(DM.toMath(n)),v=DM.eval(ast);
  var steps=[S('نكتب المقدار',M.ast(ast),'نطبّق قوانين الأسس قبل الحساب.','قوانين الأسس')];
  var laws=[];
  if(/(\d+)\^(-?\d+)\s*\*\s*\1\^(-?\d+)/.test(n))laws.push(['الضرب نجمع الأسس','aᵐ × aⁿ = aᵐ⁺ⁿ']);
  if(/(\d+)\^(-?\d+)\s*\/\s*\1\^(-?\d+)/.test(n))laws.push(['القسمة نطرح الأسس','aᵐ ÷ aⁿ = aᵐ⁻ⁿ']);
  if(/\((\d+)\^(-?\d+)\)\^(-?\d+)/.test(n))laws.push(['قوة القوة نضرب الأسس','(aᵐ)ⁿ = aᵐⁿ']);
  if(/\^-/.test(n))laws.push(['الأس السالب مقلوب','a⁻ⁿ = 1/aⁿ']);
  if(/\^0/.test(n))laws.push(['الأس صفر','a⁰ = 1 لكل a ≠ 0']);
  laws.forEach(function(l){steps.push(S(l[0],M.txt(l[1]),'قانون يوفّر خطوات الحساب.','قوانين الأسس'))});
  var qv=v.asQ();
  steps.push(S('نحسب القيمة',M.ast(ast)+M.eq()+M.xa(v),'ننفّذ القوى ثم العمليات.','حساب القوى'));
  return mk({topic:'power',label:'الأعداد · القوى والأسس',input:t,steps:steps,
    answer:{html:M.xa(v),text:qv?qv.txt():DM.num.fmt(v.val(),6),x:v},practice:'pow'});
};
/* ══ 6) الجذور: تبسيط، جمع، ضرب، ترشيد ══ */
SOL.radical=function(t){
  var n=DM.norm(t);
  var single=n.match(/^(?:√|جذر|sqrt)\s*(\d+)$/);
  if(single){
    var N=BigInt(single[1]),ex=DM.extract(N),pf=DM.perfectSq(N);
    var steps=[S('نكتب المطلوب',M.root(M.n(N.toString())),'نبحث عن أكبر مربع كامل يقسم العدد.','تبسيط الجذور')];
    if(pf!==null){steps.push(S('مربع كامل',M.n(N.toString())+M.eq()+M.sup(M.n(pf.toString()),M.n('2')),'الجذر يخرج عددًا صحيحًا.','مربع كامل'),
      S('النتيجة',M.root(M.n(N.toString()))+M.eq()+M.n(pf.toString()),'',''));
      return mk({topic:'radical',label:'جذر مربع كامل',input:t,steps:steps,
        answer:{html:M.n(pf.toString()),text:pf.toString(),x:X.q(new Q(pf))},practice:'rad'})}
    if(ex.out===1n){steps.push(S('لا عامل مربّع',M.root(M.n(N.toString())),'لا يقبل القسمة على مربع كامل غير 1، فهو أبسط صورة.','أبسط صورة'));
      return mk({topic:'radical',label:'جذر في أبسط صورة',input:t,steps:steps,
        answer:{html:M.root(M.n(N.toString())),text:'√'+N,x:X.rad(new R([{c:q1,k:N}]))},practice:'rad'})}
    var res=X.rad(new R([{c:new Q(ex.out),k:ex.in}]));
    steps.push(S('نحلّل العدد',M.n(N.toString())+M.eq()+M.n((ex.out*ex.out).toString())+M.op('×')+M.n(ex.in.toString()),
      'أكبر مربع كامل يقسم العدد هو '+(ex.out*ex.out)+'.','التحليل'),
      S('نفصل الجذر',M.root(M.n(N.toString()))+M.eq()+M.root(M.n((ex.out*ex.out).toString()))+M.op('×')+M.root(M.n(ex.in.toString())),
        '√(أ×ب) = √أ × √ب للأعداد غير السالبة.','جذر الجداء'),
      S('نبسّط',M.root(M.n(N.toString()))+M.eq()+M.x(res),'نخرج جذر المربع الكامل.','التبسيط'));
    return mk({topic:'radical',label:'تبسيط جذر',input:t,steps:steps,
      answer:{html:M.x(res),text:DM.render.text(res),x:res},
      verify:{html:M.sup(M.par(M.x(res)),M.n('2'))+M.eq()+M.n(N.toString()),ok:true,note:'بتربيع الناتج نعود إلى العدد الأصلي ✔'},practice:'rad'});
  }
  var rat=n.match(/(\d+(?:\.\d+)?)\s*\/\s*(?:√|sqrt)\s*(\d+)/);
  if(rat){
    var a=Q.parse(rat[1]),k=BigInt(rat[2]);
    var num=new R([{c:a,k:1n}]),den=new R([{c:q1,k:k}]);
    var r=R.div(num,den);
    return mk({topic:'radical',label:'ترشيد المقام',input:t,
      steps:[S('نكتب الكسر',M.frac(M.q(a),M.root(M.n(k.toString()))),'المقام يحوي جذرًا؛ نرشّده.','ترشيد المقام'),
        S('نضرب البسط والمقام في الجذر',M.frac(M.q(a)+M.op('×')+M.root(M.n(k.toString())),M.root(M.n(k.toString()))+M.op('×')+M.root(M.n(k.toString()))),
          'نضرب في صورة الواحد فلا تتغيّر القيمة.','الكسور المتكافئة'),
        S('المقام يصبح نسبيًا',M.root(M.n(k.toString()))+M.op('×')+M.root(M.n(k.toString()))+M.eq()+M.n(k.toString()),'√ك × √ك = ك.','جذر الجداء'),
        S('نبسّط',M.x(X.rad(r)),'نختصر إن أمكن.','اختصار')],
      answer:{html:M.x(X.rad(r)),text:DM.render.text(X.rad(r)),x:X.rad(r)},practice:'rad'});
  }
  var ast=DM.parse(DM.toMath(n)),val=DM.eval(ast);
  return mk({topic:'radical',label:'عمليات على الجذور',input:t,
    steps:[S('نكتب المقدار',M.ast(ast),'نبسّط كل جذر ثم نجمع الحدود المتشابهة (نفس الجذر).','الجذور المتشابهة'),
      S('نحسب',M.ast(ast)+M.eq()+M.xa(val),'الجذور المتشابهة تُجمع معاملاتها؛ المختلفة تبقى منفصلة.','جمع الجذور')],
    answer:{html:M.xa(val),text:DM.render.text(val),x:val},practice:'rad'});
};
/* ══ 7) القيمة المطلقة ══ */
SOL.absval=function(t){
  var ast=DM.parse(DM.toMath(DM.norm(t))),v=DM.eval(ast);
  return mk({topic:'absval',label:'القيمة المطلقة',input:t,
    steps:[S('نكتب المقدار',M.ast(ast),'القيمة المطلقة هي البعد عن الصفر، وهي غير سالبة دائمًا.','تعريف القيمة المطلقة'),
      S('نطبّق التعريف',M.abs(M.ast(ast))+M.eq()+M.xa(v),'|س| = س إن كانت س ≥ 0، و = −س إن كانت س < 0.','تعريف القيمة المطلقة')],
    answer:{html:M.xa(v),text:DM.render.text(v),x:v},practice:'abs'});
};
/* ══ 8) ق.م.أ / م.م.أ / التحليل الأولي ══ */
SOL.divisibility=function(t){
  var n=DM.norm(t),ns=nums(n).map(function(x){return Number(x.n)});
  if(!ns.length)throw new E('اكتب أعدادًا، مثل: ق.م.أ 24 و 36، أو حلل 84 عوامل أولية.','gcd');
  if(/حلل|عوامل|أولية/.test(n)){
    var N=ns[0],f=DM.num.factorize(N),grp={};f.forEach(function(p){grp[p]=(grp[p]||0)+1});
    var pow=Object.keys(grp).map(function(p){return grp[p]>1?M.sup(M.n(p),M.n(String(grp[p]))):M.n(p)});
    return mk({topic:'divisibility',label:'تحليل إلى عوامل أولية',input:t,
      steps:[S('نقسم على الأصغر تباعًا',M.n(String(N))+M.eq()+f.map(function(p){return M.n(String(p))}).join(M.op('×')),
        'نبدأ بـ 2 ثم 3 ثم 5… حتى يصبح الخارج 1.','التحليل الأولي'),
        S('نكتب بالقوى',M.n(String(N))+M.eq()+pow.join(M.op('×')),'نجمع العوامل المتكرّرة في قوة.','صورة القوى'),
        S('عدد القواسم',M.n(String(Object.keys(grp).reduce(function(a,p){return a*(grp[p]+1)},1))),'نضرب (أس+1) لكل عامل أولي.','عدد القواسم')],
      answer:{html:pow.join(M.op('×')),text:f.join('×')},
      verify:{html:pow.join(M.op('×'))+M.eq()+M.n(String(N)),ok:true,note:'جداء العوامل يعيد العدد ✔'}});
  }
  var g=ns.reduce(function(a,b){return DM.num.gcd(a,b)}),l=ns.reduce(function(a,b){return DM.num.lcm(a,b)});
  var wantL=/مضاعف|م\.م\.أ|lcm/i.test(n);
  return mk({topic:'divisibility',label:wantL?'المضاعف المشترك الأصغر':'القاسم المشترك الأكبر',input:t,
    steps:[S('نحلّل كل عدد',ns.map(function(v){return M.n(String(v))+M.eq()+DM.num.factorize(v).map(function(p){return M.n(String(p))}).join(M.op('×'))}).join(M.sp()),
      'التحليل الأولي يكشف العوامل المشتركة.','التحليل الأولي'),
      S(wantL?'م.م.أ':'ق.م.أ',M.n((wantL?l:g).toString()),
        wantL?'نأخذ كل عامل بأكبر أس ظهر في أي عدد.':'نأخذ العوامل المشتركة بأصغر أس.','قاعدة ق.م.أ / م.م.أ'),
      S('علاقة تحقّق',M.n('ق.م.أ × م.م.أ')+M.eq()+M.n(String(g*l))+M.eq()+M.n(String(ns.length===2?ns[0]*ns[1]:g*l)),
        'لعددين: ق.م.أ × م.م.أ = جداء العددين.','علاقة ق.م.أ وم.م.أ')],
    answer:{html:M.n((wantL?l:g).toString()),text:String(wantL?l:g)},
    verify:ns.length===2?{html:M.n(String(g))+M.op('×')+M.n(String(l))+M.eq()+M.n(String(ns[0]*ns[1])),ok:g*l===ns[0]*ns[1],note:'العلاقة محقّقة ✔'}:null});
};
/* ══ 9) المتتاليات ══ */
SOL.sequence=function(t){
  var n=DM.norm(t),ns=nums(n);
  var geo=/هندسية|أساس/.test(n),idx=lbl(n,['الحد','ن','n']),N=idx?Number(idx.n):10;
  if(ns.length<2)throw new E('اكتب حدودًا مثل: متتالية حسابية 3، 7، 11 … أوجد الحد 20 والمجموع.','seq');
  var a=ns[0],steps,ans,formula,sum;
  if(geo){
    var r=ns[1].div(ns[0]);
    steps=[S('نحسب الأساس',M.v('r')+M.eq()+M.q(ns[1])+M.op('÷')+M.q(ns[0])+M.eq()+M.q(r),'في المتتالية الهندسية نقسم كل حدّ على سابقه.','تعريف المتتالية الهندسية'),
      S('الحد العام',M.v('u')+M.n('ₙ')+M.eq()+M.q(a)+M.op('×')+M.sup(M.q(r),M.n('n−1')),'uₙ = u₁ · rⁿ⁻¹.','الحد العام')];
    var uN=a.mul(r.pow(N-1));sum=r.eq(q1)?a.mul(q(BigInt(N))):a.mul(q1.sub(r.pow(N))).div(q1.sub(r));
    steps.push(S('الحد رقم '+N,M.q(a)+M.op('×')+M.sup(M.q(r),M.n(String(N-1)))+M.eq()+M.q(uN),'نعوّض ن في الحد العام.','التعويض'),
      S('مجموع أول '+N+' حدًّا',M.v('S')+M.eq()+M.q(a)+M.op('×')+M.frac(M.n('1')+M.op('−')+M.sup(M.q(r),M.n(String(N))),M.n('1')+M.op('−')+M.q(r))+M.eq()+M.q(sum),
        'Sₙ = u₁(1−rⁿ)/(1−r) عند r ≠ 1.','مجموع الهندسية'));
    ans=uN;formula=M.q(a)+M.op('×')+M.sup(M.q(r),M.n('n−1'));
  }else{
    var d=ns[1].sub(ns[0]);
    steps=[S('نحسب الأساس (الفرق)',M.v('d')+M.eq()+M.q(ns[1])+M.op('−')+M.q(ns[0])+M.eq()+M.q(d),'في المتتالية الحسابية نطرح كل حدّ من سابقه.','تعريف المتتالية الحسابية'),
      S('الحد العام',M.v('u')+M.n('ₙ')+M.eq()+M.q(a)+M.op('+')+M.par(M.n('n')+M.op('−')+M.n('1'))+M.op('×')+M.q(d),'uₙ = u₁ + (n−1)d.','الحد العام')];
    var uN2=a.add(d.mul(q(BigInt(N-1))));sum=q(BigInt(N)).mul(a.add(uN2)).div(q2);
    steps.push(S('الحد رقم '+N,M.q(a)+M.op('+')+M.n(String(N-1))+M.op('×')+M.q(d)+M.eq()+M.q(uN2),'نعوّض ن في الحد العام.','التعويض'),
      S('مجموع أول '+N+' حدًّا',M.v('S')+M.eq()+M.frac(M.n(String(N)),M.n('2'))+M.par(M.q(a)+M.op('+')+M.q(uN2))+M.eq()+M.q(sum),
        'Sₙ = n(u₁+uₙ)/2.','مجموع الحسابية'));
    ans=uN2;formula=M.q(a)+M.op('+')+M.par(M.n('n')+M.op('−')+M.n('1'))+M.op('×')+M.q(d);
  }
  return mk({topic:'sequence',label:geo?'متتالية هندسية':'متتالية حسابية',input:t,steps:steps,
    answer:{html:M.lbl('الحد العام')+formula+M.sp()+M.lbl('u'+N)+M.eq()+M.q(ans)+M.sp()+M.lbl('S'+N)+M.eq()+M.q(sum),
      text:'u'+N+' = '+ans.txt()+' ، S'+N+' = '+sum.txt(),x:X.q(ans)}});
};
/* ══ 10) التوافيق والتباديل ══ */
SOL.combinatorics=function(t){
  var n=DM.norm(t),ns=nums(n).map(function(x){return Number(x.n)});
  var isC=/توافيق|اختيار|لجنة|فريق|combination|C/i.test(n)&&!/ترتيب|تباديل|permutation|P/i.test(n);
  if(/مضروب|!/.test(n)&&ns.length===1){
    var f=DM.num.fact(ns[0]);
    return mk({topic:'combinatorics',label:'المضروب',input:t,
      steps:[S('نكتب التعريف',M.n(ns[0]+'!')+M.eq()+Array.from({length:ns[0]},function(_,i){return M.n(String(ns[0]-i))}).join(M.op('×')),
        'ن! جداء الأعداد من ن إلى 1.','تعريف المضروب'),S('نحسب',M.n(ns[0]+'!')+M.eq()+M.n(f.toString()),'','')],
      answer:{html:M.n(f.toString()),text:f.toString()}});
  }
  if(ns.length<2)throw new E('اكتب مثل: توافيق 5 من 2، أو تباديل 6 من 3.','comb');
  var N2=Math.max(ns[0],ns[1]),K=Math.min(ns[0],ns[1]);
  if(K>N2)throw new E('لا يمكن اختيار '+K+' من '+N2+'.','domain');
  var fn=DM.num.fact,res=isC?fn(N2)/(fn(K)*fn(N2-K)):fn(N2)/fn(N2-K);
  var steps=[S('نميّز النوع',M.txt(isC?'الترتيب غير مهم → توافيق':'الترتيب مهم → تباديل'),
    isC?'اختيار لجنة أو فريق لا يعتمد على الترتيب.':'توزيع مراكز أو أرقام يعتمد على الترتيب.','الفرق بين التوافيق والتباديل'),
    S('نكتب القانون',isC?M.v('C')+M.par(M.n(String(N2))+M.op(',')+M.n(String(K)))+M.eq()+M.frac(M.n(N2+'!'),M.n(K+'!')+M.op('×')+M.n((N2-K)+'!'))
      :M.v('P')+M.par(M.n(String(N2))+M.op(',')+M.n(String(K)))+M.eq()+M.frac(M.n(N2+'!'),M.n((N2-K)+'!')),
    'القانون يزيل التكرارات غير المرغوبة.','قوانين العدّ'),
    S('نعوّض ونحسب',M.n(String(res)),'نحسب المضاريب ثم نختصر.','حساب')];
  return mk({topic:'combinatorics',label:isC?'توافيق':'تباديل',input:t,steps:steps,
    answer:{html:M.n(String(res)),text:String(res)}});
};
/* ══ 11) الاحتمالات ══ */
SOL.probability=function(t){
  var n=DM.norm(t),ns=nums(n);
  var and=/و\s*معًا|كلاهما|مستقل|متتالي|ثم/.test(n),or=/أو|أحد/.test(n),not=/ليس|عدم|متمم|لا/.test(n);
  if(ns.length<2)throw new E('اكتب مثل: احتمال 3 من 12، أو احتمالان مستقلان 1/2 و 1/3 معًا.','prob');
  var a=ns[0],b=ns[1];
  if(b.zero())throw new E('عدد الحالات لا يساوي صفرًا.','div0');
  var p=a.div(b),steps,ans,label;
  if(ns.length>=4){
    var p1=ns[0].div(ns[1]),p2=ns[2].div(ns[3]);
    if(and){ans=p1.mul(p2);label='حادثان مستقلان (و)';
      steps=[S('نتحقّق من الاستقلال',M.txt('سحب مع إرجاع أو حدثان لا يؤثّر أحدهما في الآخر'),'الاستقلال شرط ضرب الاحتمالين.','شرط الاستقلال'),
        S('نضرب الاحتمالين',M.q(p1)+M.op('×')+M.q(p2)+M.eq()+M.q(ans),'P(A∩B) = P(A)·P(B) عند الاستقلال.','جداء الاحتمالات')]}
    else{ans=p1.add(p2);label='حادثان متنافيان (أو)';
      steps=[S('نتحقّق من التنافي',M.txt('الحادثان لا يقعان معًا'),'التنافي شرط جمع الاحتمالين.','شرط التنافي'),
        S('نجمع الاحتمالين',M.q(p1)+M.op('+')+M.q(p2)+M.eq()+M.q(ans),'P(A∪B) = P(A)+P(B) عند التنافي.','جمع الاحتمالات')]}
  }else if(not){ans=q1.sub(p);label='احتمال المتمّم';
    steps=[S('نحسب احتمال الحادث',M.q(p),'عدد الحالات الملائمة ÷ عدد الحالات الممكنة.','تعريف الاحتمال'),
      S('نطرح من 1',M.n('1')+M.op('−')+M.q(p)+M.eq()+M.q(ans),'P(لا A) = 1 − P(A).','قاعدة المتمّم')]}
  else{ans=p;label='احتمال بسيط';
    steps=[S('نعدّ الحالات',M.lbl('ملائمة')+M.q(a)+M.sp()+M.lbl('ممكنة')+M.q(b),'الاحتمال نسبة الحالات الملائمة إلى الممكنة.','تعريف الاحتمال'),
      S('نحسب النسبة',M.frac(M.q(a),M.q(b))+M.eq()+M.q(p),'نختصر الكسر.','اختصار'),
      S('نتحقّق من المجال',M.n('0')+M.op('≤')+M.q(p)+M.op('≤')+M.n('1'),'كل احتمال بين 0 و 1.','خاصية الاحتمال')]}
  return mk({topic:'probability',label:label,input:t,steps:steps,
    answer:{html:M.q(ans)+M.sp()+M.op('≈')+M.n(DM.num.fmt(ans.val(),4))+M.sp()+M.n(DM.num.fmt(ans.val()*100,2)+'%'),text:ans.txt(),x:X.q(ans)}});
};
/* ══ 12) الإحصاء (بسيط ومجمّع) ══ */
SOL.statistics=function(t){
  var n=DM.norm(t),ns=nums(n);
  if(ns.length<2)throw new E('اكتب سلسلة مثل: المتوسط والوسيط والمنوال والمدى لـ 4، 8، 6، 10.','stats');
  var list=ns.slice(),N=list.length;
  var sorted=list.slice().sort(function(a,b){return a.cmp(b)});
  var sum=list.reduce(function(a,b){return a.add(b)},q0),mean=sum.div(q(BigInt(N)));
  var mid=Math.floor(N/2),median=N%2?sorted[mid]:sorted[mid-1].add(sorted[mid]).div(q2);
  var freq={};list.forEach(function(v){var k=v.txt();freq[k]=(freq[k]||0)+1});
  var maxF=Math.max.apply(null,Object.keys(freq).map(function(k){return freq[k]}));
  var modes=Object.keys(freq).filter(function(k){return freq[k]===maxF});
  var range=sorted[N-1].sub(sorted[0]);
  var variance=list.reduce(function(a,v){var d=v.sub(mean);return a.add(d.mul(d))},q0).div(q(BigInt(N)));
  var q1i=sorted[Math.floor((N-1)*0.25)],q3i=sorted[Math.floor((N-1)*0.75)];
  var steps=[S('نرتّب السلسلة',sorted.map(M.q).join(M.op(',')),'الترتيب لازم للوسيط والربيعيات.','ترتيب البيانات'),
    S('نحسب المجموع',list.map(M.q).join(M.op('+'))+M.eq()+M.q(sum),'نجمع كل القيم.','المجموع'),
    S('المتوسط الحسابي',M.v('x̄')+M.eq()+M.frac(M.q(sum),M.n(String(N)))+M.eq()+M.q(mean),'المجموع ÷ عدد القيم.','المتوسط'),
    S('الوسيط',M.q(median),N%2?'عدد القيم فردي: القيمة الوسطى بعد الترتيب.':'عدد القيم زوجي: متوسط القيمتين الوسطيتين.','الوسيط'),
    S('المنوال',maxF===1?M.txt('لا يوجد'):modes.map(function(m){return M.n(m)}).join(M.op(',')),
      maxF===1?'كل قيمة تكرّرت مرة واحدة.':'القيمة الأكثر تكرارًا ('+maxF+' مرة).','المنوال'),
    S('المدى',M.q(sorted[N-1])+M.op('−')+M.q(sorted[0])+M.eq()+M.q(range),'أكبر قيمة − أصغر قيمة.','المدى'),
    S('الربيعيات',M.lbl('Q1')+M.q(q1i)+M.sp()+M.lbl('Q3')+M.q(q3i)+M.sp()+M.lbl('IQR')+M.q(q3i.sub(q1i)),'تقسيم البيانات المرتّبة إلى أربعة أقسام.','الربيعيات'),
    S('التباين',M.v('σ²')+M.eq()+M.frac(M.txt('Σ(x−x̄)²'),M.n(String(N)))+M.eq()+M.q(variance),'متوسط مربّعات الانحرافات عن المتوسط.','التباين'),
    S('الانحراف المعياري',M.v('σ')+M.eq()+M.root(M.q(variance))+M.eq()+M.n(DM.num.fmt(Math.sqrt(variance.val()),4)),'جذر التباين يعيد الوحدة الأصلية.','الانحراف المعياري')];
  var want=/وسيط/.test(n)?median:/منوال/.test(n)?(maxF===1?null:Q.parse(modes[0])):/مدى/.test(n)?range:/تباين/.test(n)?variance:mean;
  return mk({topic:'statistics',label:'الإحصاء · مقاييس كاملة',input:t,steps:steps,
    answer:{html:(want?M.q(want):M.txt('لا منوال'))+M.sp()+M.lbl('σ')+M.n(DM.num.fmt(Math.sqrt(variance.val()),3)),
      text:want?want.txt():'لا منوال',x:want?X.q(want):null},practice:'stats'});
};
/* ══ 13) مسائل السرعة والعمل ══ */
SOL.rate=function(t){
  var n=DM.norm(t),ns=nums(n);
  if(/عمل|ينجز|أنبوب|عامل/.test(n)&&ns.length>=2){
    var a=ns[0],b=ns[1],tog=a.mul(b).div(a.add(b));
    return mk({topic:'rate',label:'العمل المشترك',input:t,
      steps:[S('نحسب معدّل كل عامل',M.lbl('الأول')+M.frac(M.n('1'),M.q(a))+M.sp()+M.lbl('الثاني')+M.frac(M.n('1'),M.q(b)),
        'من ينجز العمل في ن ساعات ينجز 1/ن منه في الساعة.','معدّل العمل'),
        S('نجمع المعدّلين',M.frac(M.n('1'),M.q(a))+M.op('+')+M.frac(M.n('1'),M.q(b))+M.eq()+M.q(q1.div(a).add(q1.div(b))),
          'العمل معًا يجمع المعدّلين.','جمع المعدّلات'),
        S('نقلب المعدّل الكلي',M.v('ز')+M.eq()+M.frac(M.q(a)+M.op('×')+M.q(b),M.q(a)+M.op('+')+M.q(b))+M.eq()+M.q(tog),
          'الزمن = 1 ÷ المعدّل الكلي.','مقلوب المعدّل')],
      answer:{html:M.q(tog)+M.sp()+M.txt('ساعة'),text:tog.txt(),x:X.q(tog)}});
  }
  if(ns.length>=2){
    var d=ns[0],tt=ns[1],v=d.div(tt);
    return mk({topic:'rate',label:'السرعة والزمن والمسافة',input:t,
      steps:[S('نكتب العلاقة',M.v('س')+M.eq()+M.frac(M.v('ف'),M.v('ز')),'السرعة = المسافة ÷ الزمن.','قانون الحركة'),
        S('نعوّض',M.v('س')+M.eq()+M.frac(M.q(d),M.q(tt))+M.eq()+M.q(v),'نقسم المسافة على الزمن.','التعويض')],
      answer:{html:M.q(v),text:v.txt(),x:X.q(v)}});
  }
  throw new E('اكتب مثل: سرعة قطع 120 كم في 3 ساعات، أو عمل ينجزه الأول في 6 والثاني في 3 معًا.','rate');
};
Object.keys(SOL).forEach(function(k){DM.SOL[k]=SOL[k]});
})();