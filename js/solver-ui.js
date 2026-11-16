/* js/solver-ui.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$,esc=KH.esc,R=KH.R;
var state=KH.state;
function insert(ta,txt){
  var s=ta.selectionStart,e=ta.selectionEnd;
  ta.value=ta.value.slice(0,s)+txt+ta.value.slice(e);
  ta.setSelectionRange(s+txt.length,s+txt.length);
}
function stopPlay(){
  if(state.playing){clearInterval(state.playing);state.playing=null}
  var b=$('#playBtn');if(b)b.textContent='تشغيل تلقائي';
}
function renderEmpty(){
  var p=$('#stepsPanel');if(!p)return;
  p.innerHTML='<div class="empty-state">'+
    '<svg viewBox="0 0 96 96" fill="none"><rect x="8" y="8" width="80" height="80" stroke="#101010" stroke-width="3"/>'+
    '<path d="M36 66V44C36 38 41 33 47 33C53 33 58 38 58 44C58 50 53 54 47 54V66Z" fill="#E3270E"/>'+
    '<path d="M56 41L65 45L56 49Z" fill="#E3270E"/><circle cx="51" cy="42" r="2" fill="#FBFBF8"/></svg>'+
    '<h3>جاهز لأول خطوة</h3><p>اكتب مسألتك في اللوحة المجاورة أو اضغط قالبًا جاهزًا. كل حلّ يظهر خطوة خطوة مع شرح السبب، ثم تحقّق نهائي. المجهول بأي حرف تختاره.</p>'+
    '<div class="chips">'+KH.TEMPLATES.slice(0,5).map(function(x){
      return '<button class="chip" data-t="'+esc(x.t)+'"><span class="mono">'+esc(x.t.length>22?x.t.slice(0,22)+'…':x.t)+'</span></button>'}).join('')+'</div></div>';
  $$('#stepsPanel .chip[data-t]').forEach(function(b){
    b.onclick=function(){$('#problemInput').value=b.dataset.t;doSolve()};
  });
}
function showSolution(sol,all){
  state.current=sol;
  state.revealed=all?sol.steps.length:1;
  state.practice=null;stopPlay();render();
}
function doSolve(opt){
  opt=opt||{};stopPlay();
  var txt=$('#problemInput').value.trim();
  try{
    var sol=KH.solveProblem(txt);
    showSolution(sol);
    state.stats.solved++;KH.saveStats();
    if(!opt.quiet)KH.Sound.play('step',0);
  }catch(err){
    state.current=null;
    var msg=(err&&err.name==='MError')?err.message:'تعذّر فهم المسألة. تحقّق من الرموز المستخدمة.';
    $('#stepsPanel').innerHTML='<div class="err-box"><h4>لم أستطع حلّ هذه الصيغة</h4><p>'+esc(msg)+'</p>'+
      '<div class="chips">'+KH.TEMPLATES.slice(0,7).map(function(x){
        return '<button class="chip" data-t="'+esc(x.t)+'"><span class="mono">'+esc(x.t.length>20?x.t.slice(0,20)+'…':x.t)+'</span></button>'}).join('')+'</div></div>';
    $$('#stepsPanel .chip[data-t]').forEach(function(b){
      b.onclick=function(){$('#problemInput').value=b.dataset.t;doSolve()};
    });
    if(!opt.quiet)KH.Sound.play('no');
  }
}
function stepHTML(s,i){
  return '<div class="step"><div class="step-n">'+String(i+1).padStart(2,'0')+'</div><div>'+
    '<div class="step-t">'+esc(s.title)+'</div><div class="math">'+s.html+'</div>'+
    (s.note?'<div class="step-note">'+esc(s.note)+'</div>':'')+'</div></div>';
}
function render(){
  var s=state.current;if(!s)return;
  var shown=s.steps.slice(0,state.revealed),done=state.revealed>=s.steps.length;
  var h='<div class="sol-head"><div><h3>'+esc(s.topicLabel)+'</h3><span class="tag">'+
    esc(s.problemText.length>48?s.problemText.slice(0,48)+'…':s.problemText)+'</span></div>'+
    '<span class="verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M4 12l6 6L20 6"/></svg>نتيجة موثّقة من المحرّك</span></div>';
  h+='<div class="problem-box"><small>المسألة</small><div class="math">'+s.problemHTML+'</div>'+
    '<div class="plain">'+esc(s.problemText)+'</div></div>';
  h+='<div>'+shown.map(stepHTML).join('')+'</div>';
  if(done&&s.check)h+='<div class="step"><div class="step-n" style="color:var(--green)">✓</div><div>'+
    '<div class="step-t">التحقّق من صحة الحل</div><div class="math">'+s.check.html+'</div>'+
    '<div class="step-note">'+esc(s.check.note)+'</div></div></div>';
  h+='<div class="step-tools">';
  if(!done)h+='<button class="btn btn-primary btn-sm" id="nextBtn">الخطوة التالية</button>';
  h+='<button class="btn btn-line btn-sm" id="allBtn">'+(done?'إخفاء الخطوات':'عرض كل الخطوات')+'</button>';
  if(!done)h+='<button class="btn btn-line btn-sm" id="playBtn">تشغيل تلقائي</button>';
  h+='<div class="progress-dots">'+s.steps.map(function(_,i){return '<i class="'+(i<state.revealed?'on':'')+'"></i>'}).join('')+'</div></div>';
  if(done){
    h+='<div class="answer-box"><div class="lab">ANSWER'+(s.unit?' · '+esc(s.unit):'')+'</div>'+
      '<div class="math">'+s.answerHTML+'</div><div class="row">'+
      '<button class="btn btn-primary btn-sm" id="saveBtn">احفظ في دفتري</button>'+
      '<button class="btn btn-sm" id="copyBtn">نسخ الحل</button>'+
      '<button class="btn btn-sm" id="askBtn">لماذا؟ اسأل المساعد</button>'+
      (s.practice?'<button class="btn btn-sm" id="pracBtn">تمرين مشابه</button>':'')+'</div></div>';
    if(state.practice)h+=practiceHTML();
  }
  $('#stepsPanel').innerHTML=h;
  var nx=$('#nextBtn');
  if(nx)nx.onclick=function(){state.revealed++;KH.Sound.play('step',state.revealed);render()};
  var ab=$('#allBtn');
  if(ab)ab.onclick=function(){stopPlay();state.revealed=done?1:s.steps.length;KH.Sound.play('tap');render()};
  var pb=$('#playBtn');
  if(pb)pb.onclick=function(){
    if(state.playing){stopPlay();return}
    pb.textContent='إيقاف';
    state.playing=setInterval(function(){
      if(state.revealed>=s.steps.length){stopPlay();render();return}
      state.revealed++;KH.Sound.play('step',state.revealed);render();
    },1000);
  };
  var sv=$('#saveBtn');if(sv)sv.onclick=function(){KH.Notebook.add(s)};
  var cp=$('#copyBtn');if(cp)cp.onclick=function(){copySolution(s)};
  var ak=$('#askBtn');if(ak)ak.onclick=function(){
    location.hash='#assistant';
    document.getElementById('assistant').scrollIntoView({behavior:'smooth'});
    setTimeout(function(){KH.Assistant.ask('لماذا قمنا بهذه الخطوات في: '+s.problemText)},450);
  };
  var pr=$('#pracBtn');if(pr)pr.onclick=function(){
    var g=KH.gen[s.practice];if(!g)return;
    state.practice=g();state.practice.tries=0;KH.Sound.play('tap');render();
    setTimeout(function(){var i=$('#pracInput');if(i)i.focus()},80);
  };
  wirePractice();
}
function practiceHTML(){
  var p=state.practice,html;
  try{html=KH.solveProblem(p.text).problemHTML}catch(e){html=R.txt(p.text)}
  return '<div class="practice"><h4>تمرين مشابه · اختبر نفسك</h4>'+
    '<div class="math start">'+html+'</div><p class="pq">'+esc(p.ask)+'</p>'+
    '<div class="ans-row"><input id="pracInput" class="field" placeholder="اكتب إجابتك" inputmode="decimal" '+((p.done||p.gave)?'disabled':'')+'>'+
    '<button class="btn btn-primary btn-sm" id="pracCheck" '+((p.done||p.gave)?'disabled':'')+'>تحقّق</button>'+
    '<button class="btn btn-line btn-sm" id="pracShow">أظهر الحل</button>'+
    '<button class="btn btn-line btn-sm" id="pracNew">آخر</button></div>'+
    '<div class="fb '+(p.fb?'show '+p.fbKind:'')+'">'+esc(p.fb||'')+'</div>'+
    (p.gave&&p.sol?'<div style="margin-top:12px">'+p.sol.steps.map(stepHTML).join('')+'</div>':'')+'</div>';
}
function wirePractice(){
  var p=state.practice;if(!p)return;
  var inp=$('#pracInput'),chk=$('#pracCheck');
  function submit(){
    if(!inp)return;
    var raw=KH.normDigits(inp.value).trim();
    if(!raw){KH.toast('اكتب إجابة أولًا');return}
    var v=null,m=raw.replace(/\s/g,'').match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    v=m?Number(m[1])/Number(m[2]):Number(raw);
    var target=p.coeff!==undefined?p.coeff:p.value,tol=p.tol||1e-6;
    if(v===null||!isFinite(v)){p.fb='اكتب عددًا أو كسرًا مثل 3/4.';p.fbKind='no';render();return}
    p.tries++;
    if(Math.abs(v-target)<=tol){
      p.fb='إجابة صحيحة! أحسنت.';p.fbKind='ok';p.done=true;
      state.stats.correct++;state.stats.streak++;
      state.stats.best=Math.max(state.stats.best,state.stats.streak);
      var tp=state.current?state.current.topic:'other';
      state.stats.byTopic[tp]=(state.stats.byTopic[tp]||0)+1;
      KH.saveStats();KH.Curriculum.refresh();KH.Sound.play('ok');KH.confetti();render();
      KH.toast('سلسلتك الآن '+state.stats.streak+' إجابة صحيحة',{kind:'ok'});
    }else{
      state.stats.streak=0;KH.saveStats();KH.Sound.play('no');
      var hint=(state.current&&state.current.steps[0])?(state.current.steps[0].note||state.current.steps[0].title):'ابدأ بترتيب المسألة.';
      p.fb=p.tries>=2?'ليس صحيحًا. تلميح: '+hint:'ليس صحيحًا بعد، حاول مرة أخرى.';
      p.fbKind='no';render();
      setTimeout(function(){var i=$('#pracInput');if(i){i.focus();i.select()}},60);
    }
  }
  if(chk)chk.onclick=submit;
  if(inp)inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();submit()}};
  var sh=$('#pracShow');
  if(sh)sh.onclick=function(){
    try{p.sol=KH.solveProblem(p.text);p.gave=true;state.stats.streak=0;KH.saveStats();render()}
    catch(e){KH.toast('تعذّر توليد الحل',{kind:'err'})}
  };
  var nw=$('#pracNew');
  if(nw)nw.onclick=function(){
    var g=KH.gen[state.current.practice];if(!g)return;
    state.practice=g();state.practice.tries=0;KH.Sound.play('tap');render();
  };
}
function copySolution(s){
  var tmp=document.createElement('div');
  function plain(html){tmp.innerHTML=html;return (tmp.textContent||'').replace(/\s+/g,' ').trim()}
  var txt=s.problemText+'\n\n'+s.steps.map(function(x,i){
    return (i+1)+'. '+x.title+'\n   '+plain(x.html)+(x.note?'\n   ← '+x.note:'');
  }).join('\n')+'\n\nالإجابة: '+s.answerText+(s.unit?' '+s.unit:'');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){KH.toast('نُسخ الحل إلى الحافظة',{kind:'ok'})},
      function(){KH.toast('تعذّر النسخ',{kind:'err'})});
  }else KH.toast('النسخ غير متاح في هذا المتصفح',{kind:'err'});
}
KH.SolverUI={
  init:function(){
    $('#keypad').innerHTML=KH.KEYS.map(function(k){return '<button class="key" data-k="'+esc(k)+'">'+esc(k)+'</button>'}).join('');
    $('#keypad').addEventListener('click',function(e){
      var b=e.target.closest('.key');if(!b)return;
      var k=b.dataset.k,ta=$('#problemInput');KH.Sound.play('tap');
      if(k==='⌫'){var p=ta.selectionStart;
        if(p>0){ta.value=ta.value.slice(0,p-1)+ta.value.slice(ta.selectionEnd);ta.setSelectionRange(p-1,p-1)}}
      else insert(ta,k===';'?' ؛ ':k);
      ta.focus();
    });
    $('#tplChips').innerHTML=KH.TEMPLATES.map(function(x){
      return '<button class="chip" data-t="'+esc(x.t)+'">'+esc(x.l)+'</button>'}).join('');
    $('#heroChips').innerHTML=KH.TEMPLATES.slice(0,6).map(function(x){
      return '<button class="chip" data-t="'+esc(x.t)+'"><span class="mono">'+esc(x.t.length>18?x.t.slice(0,18)+'…':x.t)+'</span></button>'}).join('');
    function handler(e){
      var b=e.target.closest('.chip[data-t]');if(!b)return;
      $('#problemInput').value=b.dataset.t;KH.Sound.play('tap');doSolve();
      document.getElementById('solve').scrollIntoView({behavior:'smooth'});
    }
    $('#tplChips').addEventListener('click',handler);
    $('#heroChips').addEventListener('click',handler);
    $('#solveBtn').onclick=function(){KH.Sound.play('tap');doSolve()};
    $('#clearBtn').onclick=function(){
      $('#problemInput').value='';state.current=null;stopPlay();renderEmpty();KH.Sound.play('tap');
    };
    $('#problemInput').addEventListener('keydown',function(e){
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();doSolve()}
    });
    renderEmpty();
  },
  solveText:function(text,opt){
    opt=opt||{};
    $('#problemInput').value=text;
    doSolve({quiet:opt.quiet});
    if(opt.scroll)document.getElementById('solve').scrollIntoView({behavior:'smooth'});
  },
  showSolution:showSolution,
  renderEmpty:renderEmpty
};
})();