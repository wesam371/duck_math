/* js/engine.js — تصنيف المسألة، التوجيه، التحقّق المستقلّ، مولّدات تمارين بتشخيص الأخطاء، سجلّ المواضيع */
(function(){'use strict';
var DM=window.DM,Q=DM.Q,R=DM.R,X=DM.X,M=DM.M,q=DM.q,q0=DM.q0,q1=DM.q1,E=DM.E,P=DM.P;
var ri=function(a,b){return Math.floor(Math.random()*(b-a+1))+a};
var pick=function(a){return a[ri(0,a.length-1)]};
DM.ri=ri;DM.pick=pick;

/* ═══ سجلّ المواضيع: يبني المنهاج والمساعد تلقائيًا ═══ */
var TOPICS=[
 {id:'arithmetic',u:1,n:'ترتيب العمليات',s:'arithmetic',ex:'12 + 5 × 3 − 4',d:'الأقواس ثم القوى ثم الضرب والقسمة ثم الجمع والطرح.',k:['ترتيب','عمليات','اقواس']},
 {id:'fraction',u:1,n:'الكسور: جمع وطرح وضرب وقسمة',s:'fraction',ex:'2/3 + 1/4',d:'توحيد المقامات، والضرب المباشر، والقسمة بالمقلوب.',k:['كسر','كسور','مقام','بسط']},
 {id:'percent',u:1,n:'النسبة المئوية بستة أنماط',s:'percent',ex:'15% من 80',d:'نسبة من عدد، زيادة، خصم، إيجاد النسبة، إيجاد الأصل، الفائدة.',k:['نسبة','مئوية','خصم','زيادة']},
 {id:'proportion',u:1,n:'النسبة والتناسب والقسمة التناسبية',s:'proportion',ex:'3/5 = 12/س',d:'الضرب التبادلي وتوزيع كمية على نسب.',k:['تناسب','نسبة','مقص']},
 {id:'power',u:1,n:'قوانين الأسس',s:'power',ex:'2^3 × 2^2',d:'الضرب نجمع، القسمة نطرح، قوة القوة نضرب، الأس السالب مقلوب.',k:['أس','أسس','قوى']},
 {id:'radical',u:1,n:'الجذور: تبسيط وجمع وترشيد',s:'radical',ex:'√72',d:'استخراج أكبر مربّع كامل، وجمع الجذور المتشابهة، وترشيد المقام.',k:['جذر','جذور','ترشيد']},
 {id:'absval',u:1,n:'القيمة المطلقة',s:'absval',ex:'abs(-7) + 3',d:'البعد عن الصفر، وغير سالبة دائمًا.',k:['مطلقة','قيمة']},
 {id:'divisibility',u:1,n:'ق.م.أ وم.م.أ والتحليل الأولي',s:'divisibility',ex:'ق.م.أ 24 و 36',d:'التحليل الأولي، عدد القواسم، وعلاقة ق.م.أ × م.م.أ.',k:['قاسم','مضاعف','أولية','تحليل']},
 {id:'sequence',u:1,n:'المتتاليات الحسابية والهندسية',s:'sequence',ex:'متتالية حسابية 3، 7، 11 الحد 20',d:'الحد العام والمجموع لكل نوع.',k:['متتالية','حسابية','هندسية','أساس']},
 {id:'combinatorics',u:1,n:'المضروب والتباديل والتوافيق',s:'combinatorics',ex:'توافيق 5 من 2',d:'الفرق بين الترتيب المهم وغير المهم.',k:['توافيق','تباديل','مضروب','عد']},
 {id:'probability',u:1,n:'الاحتمالات',s:'probability',ex:'احتمال 3 من 12',d:'بسيط، متمم، مستقلان، متنافيان.',k:['احتمال','حادث']},
 {id:'statistics',u:1,n:'الإحصاء الكامل',s:'statistics',ex:'المتوسط والوسيط والمنوال والمدى لـ 4، 8، 6، 10',d:'المتوسط، الوسيط، المنوال، المدى، الربيعيات، التباين، الانحراف المعياري.',k:['إحصاء','متوسط','وسيط','منوال','مدى','تباين']},
 {id:'rate',u:1,n:'السرعة والعمل المشترك',s:'rate',ex:'سرعة قطع 120 كم في 3 ساعات',d:'قانون الحركة ومعدّلات العمل.',k:['سرعة','مسافة','زمن','عمل']},
 {id:'linear',u:2,n:'معادلة الدرجة الأولى',s:'linear',ex:'3س + 7 = 22',d:'طريقتا الميزان والنقل، مع التحقّق بالتعويض.',k:['معادلة','خطية','نقل','ميزان']},
 {id:'system',u:2,n:'جملة معادلتين بثلاث طرق',s:'system',ex:'2س + 3ص = 12 ؛ س − ص = 1',d:'الحذف، التعويض، والمحدّدات.',k:['جملة','معادلتين','حذف','تعويض','كرامر']},
 {id:'system3',u:2,n:'جملة ثلاث معادلات',s:'system3',ex:'س+ص+ع=6 ؛ س−ص=0 ؛ ص−ع=0',d:'كرامر بمحدّد 3×3.',k:['ثلاث','جملة','3×3']},
 {id:'quadratic',u:2,n:'المعادلة التربيعية بثلاث طرق',s:'quadratic',ex:'س^2 − 5س + 6 = 0',d:'التحليل، إكمال المربّع، القانون العام، والمميّز.',k:['تربيعية','مميز','قانون عام','فييت']},
 {id:'cubic',u:2,n:'معادلات الدرجة الثالثة',s:'cubic',ex:'س^3 − 6س^2 + 11س − 6 = 0',d:'نظرية الجذر النسبي ثم القسمة المطوّلة.',k:['ثالثة','مكعب','جذر نسبي']},
 {id:'rational',u:2,n:'المعادلات الكسرية',s:'rational',ex:'1/س + 1/2 = 3/4',d:'المجال، ضرب في م.م.أ، وكشف الحلول الدخيلة.',k:['كسرية','مقام','دخيل']},
 {id:'radicalEq',u:2,n:'المعادلات الجذرية',s:'radicalEq',ex:'√(2س+3) = 5',d:'العزل، التربيع، والتحقّق من الدخيل.',k:['جذرية','تربيع','دخيل']},
 {id:'absEq',u:2,n:'معادلات القيمة المطلقة',s:'absEq',ex:'|2س − 3| = 7',d:'فصل الحالتين والتحقّق.',k:['مطلقة','حالتين']},
 {id:'exponential',u:2,n:'المعادلات الأسية',s:'exponential',ex:'2^(س+1) = 32',d:'توحيد الأساس أو اللوغاريتم.',k:['أسية','أساس','لوغاريتم']},
 {id:'logarithmic',u:2,n:'المعادلات اللوغاريتمية',s:'logarithmic',ex:'log(س) = 2',d:'التحويل للصورة الأسية والتحقّق من المجال.',k:['لوغاريتم','log','ln']},
 {id:'trigEq',u:2,n:'المعادلات المثلثية',s:'trigEq',ex:'sin(س) = 1/2',d:'الزاوية المرجعية، الأرباع، والحلّ العام بالدورة.',k:['مثلثية','sin','cos','tan','دورة']},
 {id:'inequality',u:2,n:'المتراجحات الخطية والتربيعية',s:'inequality',ex:'2س + 3 > 11',d:'قلب الاتجاه عند القسمة على سالب، وجدول إشارة الثلاثي.',k:['متراجحة','متباينة','إشارة','فترة']},
 {id:'polynomial',u:2,n:'الحدوديات: نشر وقسمة وتقييم',s:'polynomial',ex:'اقسم (س^3−2س+1) على (س−1)',d:'التوزيع، القسمة المطوّلة، ومتطابقة القسمة.',k:['حدودية','نشر','قسمة','خارج','باقي']},
 {id:'factor',u:2,n:'تحليل الحدوديات',s:'factor',ex:'حلل س^2 + 5س + 6',d:'العامل المشترك، المتطابقات الشهيرة، والتحليل بالجذور.',k:['تحليل','عامل مشترك','متطابقة']},
 {id:'function',u:2,n:'الدوال: صورة، سابقة، مجال، مقلوب، زوجية',s:'func',ex:'f(س)=2س+3 احسب f(4)',d:'كل عمليات الدوال الأساسية.',k:['دالة','صورة','سابقة','مجال','مقلوب','زوجية']},
 {id:'determinant',u:2,n:'المحدّدات 2×2 و 3×3',s:'determinant',ex:'محدد 2 3 1 4',d:'جداء القطرين والتوسّع بالمتمّمات.',k:['محدد','مصفوفة']},
 {id:'literal',u:2,n:'المعادلات الحرفية',s:'literal',ex:'حلّ من أجل ص في 2س+3ص=12',d:'عزل مجهول بدلالة الآخر.',k:['حرفية','بدلالة']},
 {id:'shape',u:3,n:'محيط ومساحة الأشكال المستوية',s:'shape',ex:'مساحة دائرة نصف قطرها 7',d:'مربع، مستطيل، مثلث، دائرة، متوازي أضلاع، معيّن، شبه منحرف، مضلع منتظم — مع π مضبوطة.',k:['مساحة','محيط','دائرة','مربع','مستطيل']},
 {id:'solid',u:3,n:'حجوم ومساحات المجسمات',s:'solid',ex:'حجم مخروط نصف قطره 3 وارتفاعه 4',d:'كرة، مخروط، هرم، أسطوانة، مكعب، متوازي مستطيلات.',k:['حجم','مجسم','كرة','مخروط','هرم','أسطوانة']},
 {id:'pythagoras',u:3,n:'فيثاغورس وعكسه',s:'pythagoras',ex:'مثلث قائم ضلعاه 6 و 8',d:'إيجاد الوتر أو ضلع قائم، واختبار قيام المثلث.',k:['فيثاغورس','قائم','وتر']},
 {id:'thales',u:3,n:'طاليس وعكسه',s:'thales',ex:'طاليس AM=3 AB=9 AN=4',d:'النسب الثلاث عند التوازي.',k:['طاليس','توازي']},
 {id:'trig',u:3,n:'sin_cos_tان والنسب المثلثية',s:'trig',ex:'sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5',d:'النسب في المثلث القائم، الزوايا الخاصة، والمتطابقات.',k:['sin','cos','tan','مثلثية']},
 {id:'triangle',u:3,n:'قانونا الجيب وجيب التمام',s:'triangleSolve',ex:'مثلث a=5 b=7 C=60 أوجد c',d:'حلّ أي مثلث ومساحته بضلعين وزاوية محصورة.',k:['جيب','جيب التمام','مثلث']},
 {id:'coordinate',u:4,n:'الهندسة الإحداثية',s:'coordinate',ex:'مسافة A(1,2) B(4,6)',d:'المسافة، المنتصف، الميل، معادلة مستقيم، معادلة دائرة.',k:['إحداثي','مسافة','منتصف','ميل','مستقيم','دائرة']},
 {id:'vector',u:4,n:'الأشعة في المستوي',s:'vector',ex:'طويلة الشعاع (3,4)',d:'الإحداثيات، الطويلة، الجمع، الجداء القياسي، الزاوية، والتعامد.',k:['شعاع','متجه','جداء','طويلة']},
 {id:'transform',u:4,n:'التحويلات الهندسية',s:'transform',ex:'دوران النقطة (3,4) بزاوية 90',d:'انسحاب، تناظر محوري ومركزي، دوران، تحاكي.',k:['تحويل','انسحاب','تناظر','دوران','تحاكي']}
];
TOPICS.forEach(function(t){if(t.n.indexOf('sin_cos_tان')>=0)t.n='sin_cos_tan والنسب المثلثية'});
DM.TOPICS=TOPICS;
DM.UNITS=[{u:1,n:'الوحدة ١ · الأعداد والعمليات'},{u:2,n:'الوحدة ٢ · الجبر والمعادلات'},
 {u:3,n:'الوحدة ٣ · الهندسة والقياس'},{u:4,n:'الوحدة ٤ · الإحداثيات والأشعة'}];

/* ═══ التصنيف والتوجيه ═══ */
function classify(text){
  var n=DM.norm(text),low=n.toLowerCase();
  var has=function(re){return re.test(n)};
  var rel=DM.relation(n);
  var parts=DM.parts(text).filter(function(s){return s.indexOf('=')>=0});
  if(parts.length>=3)return 'system3';
  if(parts.length===2)return 'system';
  if(/حلّ?\s*من أجل|بدلالة/.test(n))return 'literal';
  if(/طاليس/.test(n))return 'thales';
  if(/قانون\s*(الجيب|جيب التمام)|a=\d.*b=\d.*C=|مساحة.*a=.*b=.*C=/.test(n))return 'triangleSolve';
  if(/انسحاب|تناظر|دوران|تحاكي/.test(n))return 'transform';
  if(/جداء\s*قياسي|طويلة\s*(الشعاع|شعاع)|زاوية\s*بين/.test(n))return 'vector';
  if(/ميل|معادلة\s*مستقيم|معادلة\s*دائرة|تعامد|توازي/.test(n)&&/\(\s*-?\d/.test(n))return 'coordinate';
  if(/منتصف|مسافة|شعاع|إحداثيات/.test(n)&&/\(\s*-?\d/.test(n))return 'coordinate';
  if(/\(\s*-?\d+\s*[,;]\s*-?\d+\s*\)/.test(n)&&/طويلة|جداء|زاوية|جمع/.test(n))return 'vector';
  if(/محدد|مصفوفة/.test(n))return 'determinant';
  if(/f\s*\(|سابقة|صورة|مجال|مقلوب|زوجية|فردية/.test(n)&&/=/.test(n))return 'func';
  if(/log|ln|lg/.test(low)&&/=/.test(n))return 'logarithmic';
  if(/(sin|cos|tan)\s*\(?[A-Za-z\u0621-\u064A]\)?\s*=/.test(low))return 'trigEq';
  if(/\^/.test(n)&&/=/.test(n)&&/\^\s*\(?[A-Za-z\u0621-\u064A]/.test(n))return 'exponential';
  if(/abs\(|\|/.test(n)&&/=/.test(n))return 'absEq';
  if(/(√|sqrt)/.test(n)&&/=/.test(n))return 'radicalEq';
  if(/\/\s*[A-Za-z\u0621-\u064A]/.test(n)&&/=/.test(n)&&!/^\d+\/\d+\s*=/.test(n))return 'rational';
  if(rel&&/[<>≤≥]/.test(rel.op))return 'inequality';
  if(/حلل|تحليل/.test(n)&&/[A-Za-z\u0621-\u064A]/.test(n)&&!/عوامل أولية|ق\.م\.أ/.test(n))return 'factor';
  if(/اقسم|قسمة/.test(n)&&/[A-Za-z\u0621-\u064A]/.test(n))return 'polynomial';
  if(/انشر|فك|وسّع|متطابقة/.test(n))return 'polynomial';
  if(rel&&rel.op==='='){
    try{
      var vs=DM.vars(DM.parse(DM.toMath(rel.left))).concat(DM.vars(DM.parse(DM.toMath(rel.right))));
      vs=vs.filter(function(v,i){return vs.indexOf(v)===i});
      if(vs.length===1){var pp=P.sub(P.toPoly(DM.parse(DM.toMath(rel.left)),vs[0],4),P.toPoly(DM.parse(DM.toMath(rel.right)),vs[0],4));
        var d=P.deg(pp);if(d>=3)return 'cubic';if(d===2)return 'quadratic';return 'linear'}
      if(vs.length===0)return 'arithmetic';
    }catch(e){}
    return 'linear';
  }
  if(/احتمال/.test(n))return 'probability';
  if(/توافيق|تباديل|مضروب|!/.test(n))return 'combinatorics';
  if(/متتالية|حسابية|هندسية/.test(n))return 'sequence';
  if(/ق\.م\.أ|م\.م\.أ|قاسم|مضاعف|عوامل أولية/.test(n))return 'divisibility';
  if(/فائدة|رأس المال/.test(n))return 'percent';
  if(/سرعة|كم في|عمل مشترك|ينجز/.test(n))return 'rate';
  if(/%|٪|مئوية|نسبة.*من|خصم|زيادة|تخفيض/.test(n))return 'percent';
  if(/قسمة?\s*تناسبية|وزّع.*نسبة/.test(n))return 'proportion';
  if(/\d\s*[:]\s*\d/.test(n))return 'proportion';
  if(/حجم|مساحة\s*(السطح|الكلية)|كرة|مخروط|هرم|أسطوانة|اسطوانة|مكعب|متوازي مستطيلات/.test(n))return 'solid';
  if(/مساحة|محيط/.test(n)&&!/مثلث.*a=/.test(n))return 'shape';
  if(/فيثاغورس|قائم|الوتر/.test(n))return 'pythagoras';
  if(/(sin|cos|tan)/.test(low))return 'trig';
  if(/(√|جذر)/.test(n)&&!/[A-Za-z\u0621-\u064A]\s*=/.test(n))return 'radical';
  if(/abs\(|\|/.test(n))return 'absval';
  if(/\^/.test(n))return 'power';
  if(/\d\s*\/\s*\d/.test(n))return 'fraction';
  if(/[A-Za-z\u0621-\u064A]/.test(n)&&/[+\-*/]/.test(n))return 'polynomial';
  return 'arithmetic';
}
DM.classify=classify;
DM.solve=function(text){
  var raw=String(text==null?'':text).trim();
  if(!raw)throw new E('اكتب مسألة أولًا أو اختر قالبًا جاهزًا.','empty');
  var key=classify(raw);
  var fn=DM.SOL[key];
  if(!fn)throw new E('لا يوجد محلّل لهذا النوع بعد.','nosolver');
  var out;
  try{out=fn(raw)}
  catch(e){
    if(e&&e.name==='DMError')throw e;
    /* محاولة احتياطية: المعادلات ثم الحساب */
    var fallbacks=['linear','quadratic','arithmetic','shape','fraction'];
    for(var i=0;i<fallbacks.length;i++){
      if(fallbacks[i]===key)continue;
      try{out=DM.SOL[fallbacks[i]](raw);break}catch(e2){}
    }
    if(!out)throw new E('تعذّر تحليل المسألة: '+(e&&e.message?e.message:'صيغة غير مفهومة')+'. جرّب قالبًا جاهزًا من القائمة.','parse');
  }
  out.topicKey=key;
  var meta=TOPICS.filter(function(t){return t.id===out.topic})[0];
  if(meta){out.unitNo=meta.u;out.lesson=meta.n}
  out.verify=out.verify||autoVerify(out,raw);
  return out;
};
/* تحقّق مستقلّ: يعيد التقييم على الشجرة الأصلية بلا اعتماد على الخطوات */
function autoVerify(sol,raw){
  try{
    var r=DM.relation(raw);
    if(r&&r.op==='='&&sol.answer&&sol.answer.x){
      var vs=DM.vars(DM.parse(DM.toMath(r.left)));
      if(vs.length===1){
        var env={};env[vs[0]]=sol.answer.x;
        var L=DM.eval(DM.parse(DM.toMath(r.left)),env),Rr=DM.eval(DM.parse(DM.toMath(r.right)),env);
        var ok=Math.abs(L.val()-Rr.val())<1e-8;
        return{html:M.xa(L)+M.eq()+M.xa(Rr),ok:ok,
          note:ok?'عوّضنا الحلّ في الطرفين الأصليين فتساويا ✔':'التعويض لم يعطِ تساويًا — راجع الخطوات.'};
      }
    }
    if(sol.answer&&sol.answer.x){
      var v=sol.answer.x;
      return{html:M.xa(v)+M.sp()+M.op('≈')+M.n(DM.num.fmt(v.val(),8)),ok:true,note:'أُعيد حساب القيمة مباشرةً من التعبير الأصلي.'};
    }
  }catch(e){}
  return null;
}
/* ═══ مولّدات التمارين + تشخيص الأخطاء ═══ */
var GEN={
 arith:function(){var a=ri(2,12),b=ri(2,9),c=ri(2,9),d=ri(1,9);
  return{text:a+' + '+b+' × '+c+' − '+d,value:a+b*c-d,ask:'كم الناتج؟',
   mistakes:[{v:(a+b)*c-d,msg:'نفّذت الجمع قبل الضرب — الترتيب يبدأ بالضرب.'},{v:a+b*c+d,msg:'جمعت الحدّ الأخير بدل طرحه.'}]}},
 frac:function(){var d1=ri(2,8),d2=ri(2,9),n1=ri(1,d1-1),n2=ri(1,d2-1),op=pick(['+','−']);
  var a=new Q(BigInt(n1),BigInt(d1)),b=new Q(BigInt(n2),BigInt(d2)),v=op==='+'?a.add(b):a.sub(b);
  return{text:n1+'/'+d1+' '+op+' '+n2+'/'+d2,value:v.val(),exact:v.txt(),ask:'اكتب الناتج كسرًا في أبسط صورة.',
   mistakes:[{v:new Q(op==='+'?n1+n2:n1-n2,BigInt(d1+d2)).txt(),msg:'جمعت البسوط والمقامات — يجب توحيد المقامات أولًا.'}]}},
 pctOf:function(){var p=pick([5,10,15,20,25,40,50,75]),n=ri(2,12)*20;
  return{text:p+'% من '+n,value:p*n/100,ask:'كم الناتج؟',
   mistakes:[{v:n-p,msg:'طرحت النسبة كعدد لا كنسبة من العدد.'},{v:p*n,msg:'نسيت القسمة على 100.'}]}},
 pctChange:function(){var p=pick([10,20,25,50]),n=ri(2,10)*40,up=Math.random()<.5;
  return{text:(up?'زيادة ':'خصم ')+p+'% من '+n,value:up?n*(1+p/100):n*(1-p/100),ask:'كم المبلغ الجديد؟',
   mistakes:[{v:n*p/100,msg:'حسبت قيمة النسبة فقط ولم تعدّل الأصل.'}]}},
 prop:function(){var a=ri(2,9),b=ri(2,9),k=ri(2,6);
  return{text:a+'/'+b+' = '+(a*k)+'/س',value:b*k,ask:'ما قيمة س؟',
   mistakes:[{v:a*k*b,msg:'ضربت الأطراف الثلاثة بدل الضرب التبادلي.'}]}},
 pow:function(){var a=ri(2,5),m=ri(1,3),n=ri(1,3);
  return{text:a+'^'+m+' × '+a+'^'+n,value:Math.pow(a,m+n),ask:'كم الناتج؟',
   mistakes:[{v:Math.pow(a,m*n),msg:'ضربت الأسّين — في الضرب نجمع الأسّين.'}]}},
 rad:function(){var k=ri(2,7),m=pick([2,3,5,6,7]);
  return{text:'√'+(k*k*m),value:k,coeff:k,ask:'ما العدد الخارج خارج الجذر؟',
   mistakes:[{v:k*k,msg:'أخرجت المربّع الكامل نفسه لا جذره.'}]}},
 abs:function(){var a=ri(1,15);return{text:'abs(-'+a+') + '+ri(1,5),value:a+0,ask:'كم قيمة abs(−'+a+')؟',exact:String(a),
   mistakes:[{v:-a,msg:'القيمة المطلقة لا تكون سالبة.'}]}},
 linear:function(){var a=ri(2,9),x=ri(-6,12),b=ri(-12,12),v=pick(['س','ص','ع','n','y']);
  return{text:a+v+' '+(b>=0?'+':'−')+' '+Math.abs(b)+' = '+(a*x+b),value:x,ask:'ما قيمة '+v+'؟',
   mistakes:[{v:-x,msg:'عكست إشارة الناتج.'},{v:(a*x+b),msg:'نسيت القسمة على معامل المجهول.'},
     {v:(a*x+b+b)/a,msg:'جمعت الحدّ الثابت بدل طرحه عند النقل.'}]}},
 sys:function(){var x=ri(-4,6),y=ri(-4,6),a1=ri(1,5),b1=ri(1,5),a2=ri(1,5),b2=ri(1,5);
  if(a1*b2===a2*b1)b2+=1;
  return{text:a1+'س + '+b1+'ص = '+(a1*x+b1*y)+' ؛ '+a2+'س − '+b2+'ص = '+(a2*x-b2*y),value:x,ask:'ما قيمة س؟',
   mistakes:[{v:y,msg:'أعطيت قيمة ص بدل س.'}]}},
 quad:function(){var p=ri(-6,6),r=ri(-6,6),b=-(p+r),c=p*r;
  return{text:'س^2 '+(b>=0?'+':'−')+' '+Math.abs(b)+'س '+(c>=0?'+':'−')+' '+Math.abs(c)+' = 0',value:p,alt:r,
   ask:'اكتب أحد الجذرين.',mistakes:[{v:b,msg:'أخذت معامل س كجذر.'},{v:c,msg:'أخذت الحدّ الثابت كجذر.'}]}},
 ineq:function(){var a=ri(2,7),x=ri(-5,9),b=ri(-9,9),neg=Math.random()<.4;
  var A=neg?-a:a;
  return{text:A+'س '+(b>=0?'+':'−')+' '+Math.abs(b)+' > '+(A*x+b),value:x,ask:'الحدّ الحدي للمجهول؟ (اكتب العدد فقط)',
   mistakes:[{v:-x,msg:'قلبت الاتجاه وأنت تقسم على موجب، أو عكست الإشارة خطأً.'}]}},
 expand:function(){var a=ri(1,6),b=ri(1,6);
  return{text:'انشر (س+'+a+')(س+'+b+')',value:a*b,ask:'ما الحدّ الثابت بعد النشر؟',
   mistakes:[{v:a+b,msg:'جمعت العددين بدل ضربهما.'}]}},
 factor:function(){var p=ri(1,6),r=ri(1,6);
  return{text:'حلل س^2 + '+(p+r)+'س + '+(p*r),value:p,alt:r,ask:'اكتب أحد العددين في التحليل.'}},
 func:function(){var a=ri(2,6),b=ri(-6,6),x=ri(-4,6);
  return{text:'f(س)='+a+'س'+(b>=0?'+':'−')+Math.abs(b)+' احسب f('+x+')',value:a*x+b,ask:'ما صورة '+x+'؟',
   mistakes:[{v:a+b*x,msg:'بادلت المعامل والثابت.'}]}},
 pyth:function(){var t=pick([[3,4,5],[6,8,10],[5,12,13],[9,12,15],[8,15,17],[7,24,25]]);
  return{text:'مثلث قائم ضلعاه '+t[0]+' و '+t[1],value:t[2],ask:'كم طول الوتر؟',
   mistakes:[{v:t[0]+t[1],msg:'جمعت الضلعين بدل جمع مربّعيهما ثم أخذ الجذر.'},
     {v:t[0]*t[0]+t[1]*t[1],msg:'نسيت أخذ الجذر التربيعي في النهاية.'}]}},
 thales:function(){var k=ri(2,4),am=ri(2,5),an=ri(2,5);
  return{text:'طاليس AM='+am+' AB='+(am*k)+' AN='+an,value:an*k,ask:'ما طول AC؟',
   mistakes:[{v:an/k,msg:'قسمت على النسبة بدل الضرب فيها.'}]}},
 trigAngle:function(){var ang=pick([30,45,60]),fn=pick(['sin','cos']);
  var v=fn==='sin'?Math.sin(ang*Math.PI/180):Math.cos(ang*Math.PI/180);
  return{text:fn+' '+ang,value:v,ask:'اكتب القيمة عشريًا لأقرب جزء من مئة.',tol:.01}},
 trigTri:function(){var t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17]]);
  return{text:'sin_cos_tan مثلث قائم في A: AB='+t[0]+', AC='+t[1]+', BC='+t[2],value:t[1]/t[2],
   ask:'ما قيمة sin B؟',tol:.01,mistakes:[{v:t[0]/t[2],msg:'استعملت المجاور بدل المقابل — هذه cos لا sin.'},
     {v:t[1]/t[0],msg:'قسمت على المجاور — هذه tan لا sin.'}]}},
 shape:function(){var r=ri(2,9);return{text:'مساحة دائرة نصف قطرها '+r,value:Math.PI*r*r,ask:'كم المساحة؟ (π≈3.14)',tol:.6,
   mistakes:[{v:2*Math.PI*r,msg:'حسبت المحيط لا المساحة.'}]}},
 solid:function(){var r=ri(2,6),h=ri(3,9);
  return{text:'حجم أسطوانة نصف قطرها '+r+' وارتفاعها '+h,value:Math.PI*r*r*h,ask:'كم الحجم؟ (π≈3.14)',tol:2,
   mistakes:[{v:Math.PI*r*r*h/3,msg:'استعملت قانون المخروط (الثلث) بدل الأسطوانة.'}]}},
 dist:function(){var t=pick([[0,0,3,4],[1,1,4,5],[0,0,6,8],[-2,-1,1,3]]);
  return{text:'مسافة A('+t[0]+','+t[1]+') B('+t[2]+','+t[3]+')',value:Math.hypot(t[2]-t[0],t[3]-t[1]),ask:'كم المسافة؟',
   mistakes:[{v:(t[2]-t[0])**2+(t[3]-t[1])**2,msg:'نسيت أخذ الجذر التربيعي.'}]}},
 mid:function(){var ax=ri(-5,5),bx=ri(-5,5),ay=ri(-5,5),by=ri(-5,5);
  return{text:'منتصف A('+ax+','+ay+') B('+bx+','+by+')',value:(ax+bx)/2,ask:'ما الإحداثي السيني للمنتصف؟',
   mistakes:[{v:ax+bx,msg:'نسيت القسمة على 2.'}]}},
 vec:function(){var ax=ri(-5,5),ay=ri(-5,5),bx=ri(-5,5),by=ri(-5,5);
  return{text:'شعاع A('+ax+','+ay+') B('+bx+','+by+')',value:bx-ax,ask:'ما الإحداثي السيني للشعاع؟',
   mistakes:[{v:ax-bx,msg:'عكست الترتيب: البداية − النهاية بدل النهاية − البداية.'}]}},
 stats:function(){var a=[],i;for(i=0;i<4;i++)a.push(ri(2,20));
  var s=a.reduce(function(x,y){return x+y},0);
  return{text:'المتوسط الحسابي لـ '+a.join('، '),value:s/4,ask:'كم المتوسط؟',
   mistakes:[{v:s,msg:'حسبت المجموع ولم تقسم على العدد.'}]}},
 seq:function(){var a=ri(1,6),d=ri(2,6),n=ri(5,12);
  return{text:'متتالية حسابية '+a+'، '+(a+d)+'، '+(a+2*d)+' … الحد '+n,value:a+(n-1)*d,ask:'ما الحد رقم '+n+'؟',
   mistakes:[{v:a+n*d,msg:'استعملت n بدل (n−1) في الحد العام.'}]}}
};
DM.GEN=GEN;
/* تصحيح الإجابة: مقارنة مضبوطة + تشخيص الخطأ */
DM.grade=function(practice,raw){
  var t=DM.norm(raw).replace(/\s/g,'');
  var val=null,exactTxt=null;
  var fr=t.match(/^(-?\d+)\/(-?\d+)$/);
  if(fr){try{val=new Q(BigInt(fr[1]),BigInt(fr[2])).val();exactTxt=new Q(BigInt(fr[1]),BigInt(fr[2])).txt()}catch(e){}}
  if(val===null){
    var surd=t.match(/^(-?\d*)√(\d+)$/);
    if(surd){var co=surd[1]==='-'?-1:surd[1]===''?1:Number(surd[1]);val=co*Math.sqrt(Number(surd[2]))}
  }
  if(val===null){var num=Number(t);if(isFinite(num))val=num}
  if(val===null)return{ok:false,kind:'format',msg:'اكتب عددًا أو كسرًا مثل 3/4 أو جذرًا مثل 6√2.'};
  var target=practice.coeff!==undefined?practice.coeff:practice.value;
  var tol=practice.tol||1e-6;
  if(Math.abs(val-target)<=tol){
    var unsimplified=exactTxt&&practice.exact&&exactTxt!==practice.exact;
    return{ok:true,msg:unsimplified?'صحيح ✔ لكن يمكن اختصاره إلى '+practice.exact+'.':'إجابة صحيحة ✔',
      simplified:!unsimplified};
  }
  if(practice.alt!==undefined&&Math.abs(val-practice.alt)<=tol)return{ok:true,msg:'إجابة صحيحة ✔ (الجذر الآخر)'};
  var ms=practice.mistakes||[];
  for(var i=0;i<ms.length;i++){
    var mv=Number(ms[i].v);
    if(isFinite(mv)&&Math.abs(val-mv)<=Math.max(tol,1e-6))
      return{ok:false,kind:'diagnosed',msg:'خطأ شائع: '+ms[i].msg};
  }
  return{ok:false,kind:'wrong',msg:'ليست صحيحة بعد. راجع الخطوة الأولى ثم أعد المحاولة.'};
};
/* سلّم تلميحات ثلاثي */
DM.hints=function(practice,solution,level){
  if(!solution||!solution.steps||!solution.steps.length)return['ابدأ بترتيب المسألة وتحديد المطلوب.'];
  var s=solution.steps;
  if(level<=1)return[s[0].title+(s[0].why?' — '+s[0].why:'')];
  if(level===2)return s.slice(0,Math.min(2,s.length)).map(function(x){return x.title+(x.why?' — '+x.why:'')});
  return s.slice(0,Math.min(4,s.length)).map(function(x){return x.title+(x.rule?' ['+x.rule+']':'')});
};
/* قاعدة معرفة للمساعد مبنية على القواعد الفعلية */
DM.KB=TOPICS.map(function(t){return{k:t.k.concat([t.n]),a:'**'+t.n+'**\n'+t.d+'\nجرّب المثال: '+t.ex}});
})();