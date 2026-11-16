 /* js/assistant.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$,esc=KH.esc;
var AI={mode:'simple',engine:null,busy:false,history:[],abort:null,puterP:null};
function sysPrompt(){
  var ctx='',c=KH.state.current;
  if(c)ctx='\nالمسألة الحالية: '+c.problemText+'\nالنتيجة الموثّقة: '+c.answerText+
    '\nعناوين الخطوات: '+c.steps.map(function(s){return s.title}).join(' | ');
  return 'أنت مساعد موقع duck_math، تشرح رياضيات الصف الثالث الإعدادي وفق المنهاج السوري بالعربية الفصحى المبسطة فقط. '+
    'أجب في 3 إلى 5 أسطر قصيرة خطوة خطوة بلا مقدمات. استعمل حرف المجهول الذي يكتبه الطالب. '+
    'سمِّ النسب المثلثية sin وcos وtan بهذه الرموز دائمًا ولا تترجمها. '+
    'لا تخترع نتائج حسابية: اعتمد النتيجة الموثّقة من المحرّك إن وُجدت واشرح سببها فقط. '+
    'إن سُئلت عن حساب جديد فاذكر الطريقة واطلب استعمال زر «حلّ بخطوات».'+ctx;
}
function fmtMsg(txt){
  var h=esc(txt);
  h=h.replace(/\$([^$]+)\$/g,function(m,t){
    try{return '<span class="math inline">'+KH.astHTML(KH.parse(t.replace(/\s+/g,'')))+'</span>'}
    catch(e){return '<span class="mono">'+esc(t)+'</span>'}
  });
  h=h.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
  return h.split('\n').map(function(l){return l.trim()}).filter(Boolean)
    .map(function(l){return '<div>'+l+'</div>'}).join('');
}
function addMsg(txt,who,src){
  var el=document.createElement('div');el.className='msg '+who;
  el.innerHTML=fmtMsg(txt)+(src?'<div class="msg-src">'+esc(src)+'</div>':'');
  $('#chatLog').appendChild(el);
  $('#chatLog').scrollTop=$('#chatLog').scrollHeight;
  return el;
}
function setStatus(cls,txt){
  var e=$('#aiStatus');e.className='ai-status mono'+(cls?' '+cls:'');e.textContent=txt;
}
function simpleAnswer(q){
  var t=KH.normDigits(q).toLowerCase();
  var stepM=t.match(/خطوة\s*(\d+)/);
  if(stepM&&KH.state.current){
    var s=KH.state.current.steps[+stepM[1]-1];
    if(s)return '**الخطوة '+stepM[1]+': '+s.title+'**\n'+(s.note||'نطبّق القاعدة المناسبة على الطرفين.')+'\nترى المعادلة كاملة في قسم «حلّ بخطوات».';
  }
  if(/لماذا|ليه|سبب/.test(t)&&KH.state.current){
    var c=KH.state.current,s2=c.steps[Math.max(0,KH.state.revealed-1)];
    return '**في مسألتك الحالية ('+c.problemText+')**\nالخطوة الأخيرة: '+s2.title+'.\n'+(s2.note||'')+'\nوالنتيجة الموثّقة: '+c.answerText+'.';
  }
  try{
    if(/[=+\-*/^%√;؛]|مساحة|محيط|حجم|متوسط|حلل|انشر|جذر|قائم|طاليس|sin|cos|tan|شعاع|منتصف|مسافة|سابقة|صورة/.test(q)){
      var sol=KH.solveProblem(q);
      KH.SolverUI.showSolution(sol,true);
      return '**حللتها بالمحرّك الحتمي ✔**\nالنوع: '+sol.topicLabel+'\nالنتيجة: '+sol.answerText+(sol.unit?' '+sol.unit:'')+'\n\n'+
        sol.steps.map(function(s,i){return (i+1)+') '+s.title}).join('\n')+'\n\nفتحت لك الخطوات كاملة في قسم «حلّ بخطوات».';
    }
  }catch(e){}
  var best=null,score=0;
  KH.KB.forEach(function(k){
    var s=k.k.reduce(function(a,w){return a+(t.indexOf(w)>=0?1:0)},0);
    if(s>score){score=s;best=k}
  });
  if(best)return best.a;
  return 'أنا مساعد شرح لمنهاج الثالث الإعدادي السوري. أستطيع أن أشرح:\n'+
    '1) جملة معادلتين بمجهولين بالحذف أو التعويض.\n2) المميّز والقانون العام في الدرجة الثانية.\n'+
    '3) النشر والتحليل والمتطابقات الشهيرة.\n4) sin_cos_tan وطاليس وفيثاغورس.\n'+
    '5) الأشعة والمنتصف والمسافة في معلم متعامد ممنظم.\n6) الصورة والسابقة في الدوال.\n'+
    '7) حجوم المجسمات ومقاييس الإحصاء.\n\nأو اكتب أي مسألة مباشرة وسأحلّها بالمحرّك وأعرض خطواتها.';
}
function runGuards(){
  var list=$('#guardList');
  list.innerHTML='<li><b>…</b><span>جارٍ الفحص</span></li>';
  $('#loadAiBtn').disabled=true;
  var out=[];
  function push(ok,label){out.push({ok:ok,label:label})}
  var chain=Promise.resolve();
  if(!('gpu' in navigator)||!window.isSecureContext){
    push(false,'WebGPU غير متاح (يلزم HTTPS ومتصفح حديث)');
  }else{
    chain=chain.then(function(){return navigator.gpu.requestAdapter().catch(function(){return null})})
      .then(function(adapter){
        if(!adapter){push(false,'لا يوجد معالج رسوميات متاح');return null}
        var vendor=((adapter.info&&adapter.info.vendor)||'').toLowerCase();
        push(vendor.indexOf('software')<0,'معالج رسوميات حقيقي');
        return adapter.requestDevice({requiredLimits:{maxBufferSize:1073741824,maxStorageBufferBindingSize:1073741824}})
          .catch(function(){return null}).then(function(dev){
            push(!!dev,'ذاكرة رسوميات تكفي النموذج (≈1GB)');
            if(dev&&dev.destroy)try{dev.destroy()}catch(e){}
          });
      });
  }
  return chain.then(function(){
    if(navigator.storage&&navigator.storage.estimate){
      return navigator.storage.estimate().then(function(est){
        if(est&&est.quota){
          var free=(est.quota-(est.usage||0))/1048576;
          push(free>=190,'مساحة تخزين كافية ('+Math.round(free)+'MB متاح)');
        }else push(true,'مساحة التخزين (غير قابلة للقياس)');
      }).catch(function(){push(true,'مساحة التخزين (غير قابلة للقياس)')});
    }
    push(true,'مساحة التخزين (غير قابلة للقياس)');
  }).then(function(){
    var c=navigator.connection;
    if(c&&c.saveData)push(false,'وضع توفير البيانات مفعّل — أوقفه للسماح بالتنزيل');
    else if(c&&['slow-2g','2g','3g'].indexOf(c.effectiveType)>=0)push(false,'اتصالك بطيء — التنزيل سيستغرق أكثر من 10 دقائق');
    else push(true,'نوع الاتصال مناسب');
    list.innerHTML=out.map(function(o){
      return '<li class="'+(o.ok?'ok':'no')+'"><b>'+(o.ok?'✓':'✕')+'</b><span>'+esc(o.label)+'</span></li>'}).join('');
    var ok=out.every(function(o){return o.ok});
    $('#loadAiBtn').disabled=!ok||!!AI.engine;
    return ok;
  });
}
function loadPuter(){
  if(window.puter)return Promise.resolve();
  if(AI.puterP)return AI.puterP;
  AI.puterP=new Promise(function(res,rej){
    var s=document.createElement('script');
    s.src='https://js.puter.com/v2/';
    s.onload=function(){res()};
    s.onerror=function(){AI.puterP=null;rej(new Error('puter-load'))};
    document.head.appendChild(s);
  });
  return AI.puterP;
}
function ask(text){
  var txt=(text!==undefined?text:$('#chatInput').value).trim();
  if(!txt||AI.busy)return;
  if(text===undefined){$('#chatInput').value='';$('#chatInput').style.height='auto'}
  addMsg(txt,'me');KH.Sound.play('tap');
  AI.history.push({role:'user',content:txt});
  var msgs=[{role:'system',content:sysPrompt()}].concat(AI.history.slice(-6));
  if(AI.mode==='simple'){
    var el0=addMsg('','bot');
    el0.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
    setTimeout(function(){
      var a=simpleAnswer(txt);
      el0.innerHTML=fmtMsg(a)+'<div class="msg-src">SIMPLE · قاعدة معرفة المنهاج</div>';
      $('#chatLog').scrollTop=$('#chatLog').scrollHeight;
      AI.history.push({role:'assistant',content:a});
    },320);
    return;
  }
  AI.busy=true;$('#stopBtn').hidden=false;
  var el=addMsg('','bot');
  el.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  var acc='';
  function paint(src){
    el.innerHTML=fmtMsg(acc)+'<div class="msg-src">'+esc(src)+'</div>';
    $('#chatLog').scrollTop=$('#chatLog').scrollHeight;
  }
  var run;
  if(AI.mode==='cloud'){
    run=loadPuter().then(function(){
      AI.abort=new AbortController();
      return window.puter.ai.chat(msgs,{stream:true,signal:AI.abort.signal});
    }).then(function(resp){
      if(resp&&typeof resp[Symbol.asyncIterator]==='function'){
        var it=resp[Symbol.asyncIterator]();
        function next(){
          return it.next().then(function(r){
            if(r.done)return;
            var t=(r.value&&r.value.text)||'';
            if(t){acc+=t;paint('CLOUD · Puter — شرح فقط، والأرقام من المحرّك')}
            return next();
          });
        }
        return next();
      }
      acc=(resp&&resp.message&&resp.message.content)||String(resp||'');
      paint('CLOUD · Puter');
    });
  }else{
    run=Promise.resolve().then(function(){
      if(!AI.engine)throw new Error('no-engine');
      return AI.engine.chat.completions.create({messages:msgs,stream:true,temperature:.5,max_tokens:400});
    }).then(function(chunks){
      var it=chunks[Symbol.asyncIterator]();
      function next(){
        return it.next().then(function(r){
          if(r.done)return;
          var ch=r.value,d=ch&&ch.choices&&ch.choices[0]&&ch.choices[0].delta&&ch.choices[0].delta.content;
          if(d){acc+=d;paint('LOCAL · Qwen داخل جهازك — شرح فقط')}
          return next();
        });
      }
      return next();
    });
  }
  run.then(function(){
    if(!acc.trim())throw new Error('empty');
    AI.history.push({role:'assistant',content:acc});
  }).catch(function(){
    var a=simpleAnswer(txt);
    el.innerHTML=fmtMsg(a)+'<div class="msg-src">'+
      (AI.mode==='cloud'?'تعذّر الرد السحابي (قد تحتاج تسجيل دخول Puter) — أجاب المبسّط':'تعذّر رد النموذج — أجاب المبسّط')+'</div>';
    AI.history.push({role:'assistant',content:a});
    if(AI.mode==='cloud')KH.toast('قد تُفتح نافذة تسجيل دخول Puter عند أول سؤال',{kind:'err'});
  }).then(function(){
    AI.busy=false;AI.abort=null;$('#stopBtn').hidden=true;
  });
}
function setMode(mode){
  AI.mode=mode;
  $$('.seg [data-mode]').forEach(function(b){b.classList.toggle('on',b.dataset.mode===mode)});
  $('#localControls').hidden=mode!=='local';
  $('#cloudControls').hidden=mode!=='cloud';
  KH.Sound.play('toggle');
  if(mode==='simple'){
    setStatus('','SIMPLE — READY');
    $('#aiNote').textContent='قاعدة معرفة مكتوبة لمنهاج الثالث الإعدادي السوري. تعمل فورًا، بلا إنترنت وبلا حساب.';
  }else if(mode==='cloud'){
    setStatus('warn','CLOUD — LOADING');
    $('#aiNote').textContent='شرح عبر نموذج سحابي كبير بلا مفاتيح ولا خادم. يحتاج اتصالًا وقت السؤال.';
    loadPuter().then(function(){setStatus('','CLOUD — READY')}).catch(function(){
      setStatus('err','CLOUD — UNAVAILABLE');
      $('#aiNote').textContent='تعذّر تحميل Puter.js (الاتصال محجوب؟). المساعد المبسّط يعمل دائمًا.';
    });
  }else{
    setStatus('warn','LOCAL — CHECKING');
    $('#aiNote').textContent='نموذج Qwen يعمل داخل جهازك: خصوصية كاملة، تنزيل أولي ≈146MB يُخزَّن بعدها. للأجهزة الحديثة وشبكات WiFi.';
    runGuards().then(function(ok){setStatus(ok?'':'err','LOCAL — '+(ok?'READY TO DOWNLOAD':'NOT SUPPORTED'))});
  }
}
KH.Assistant={
  init:function(){
    addMsg('أهلًا بك في **duck_math**.\nأشرح لك «لماذا» خلف كل خطوة في منهاج الثالث الإعدادي. جرّب: «كيف أحل جملة معادلتين؟» أو اكتب مسألة مثل $2ع+5=13$ وسأحلّها بالمحرّك.','bot','SIMPLE · جاهز');
    $('#aiChips').innerHTML=KH.AI_CHIPS.map(function(c){return '<button class="chip">'+esc(c)+'</button>'}).join('');
    $('#aiChips').onclick=function(e){
      var b=e.target.closest('.chip');if(!b)return;ask(b.textContent);
    };
    $('#chatSend').onclick=function(){ask()};
    $('#chatInput').addEventListener('keydown',function(e){
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask()}
    });
    $('#chatInput').addEventListener('input',function(e){
      e.target.style.height='auto';
      e.target.style.height=Math.min(120,e.target.scrollHeight)+'px';
    });
    $$('.seg [data-mode]').forEach(function(b){b.onclick=function(){setMode(b.dataset.mode)}});
    $('#stopBtn').onclick=function(){
      if(AI.abort)try{AI.abort.abort()}catch(e){}
      if(AI.engine&&AI.engine.interruptGenerate)try{AI.engine.interruptGenerate()}catch(e){}
    };
    $('#recheckBtn').onclick=function(){
      runGuards().then(function(ok){setStatus(ok?'':'err','LOCAL — '+(ok?'READY TO DOWNLOAD':'NOT SUPPORTED'))});
    };
    $('#unloadAiBtn').onclick=function(){
      var p=Promise.resolve();
      if(AI.engine&&AI.engine.unload)p=Promise.resolve(AI.engine.unload()).catch(function(){});
      p.then(function(){
        AI.engine=null;$('#unloadAiBtn').hidden=true;$('#loadAiBtn').hidden=false;
        $('#aiProg').classList.remove('show');$('#aiProgTxt').textContent='';
        runGuards();setStatus('warn','LOCAL — UNLOADED');KH.toast('أُفرغت ذاكرة النموذج');
      });
    };
    $('#loadAiBtn').onclick=function(){
      var btn=$('#loadAiBtn');
      btn.disabled=true;btn.textContent='جارٍ التحضير…';
      $('#aiProg').classList.add('show');$('#aiBar').style.width='2%';
      setStatus('warn','LOCAL — DOWNLOADING ≈146MB');
      import('https://esm.run/@mlc-ai/web-llm').then(function(mod){
        var id=$('#modelSelect').value;
        if(id.indexOf('q4f16')>=0&&mod.hasShaderF16&&!mod.hasShaderF16())id=id.replace('q4f16_1','q4f32_1');
        return mod.CreateMLCEngine(id,{initProgressCallback:function(p){
          var pct=Math.round((p.progress||0)*100);
          $('#aiBar').style.width=Math.max(2,pct)+'%';
          $('#aiProgTxt').textContent=(p.text||'').slice(0,90);
        }});
      }).then(function(engine){
        AI.engine=engine;
        setStatus('','LOCAL — QWEN READY');
        btn.hidden=true;$('#unloadAiBtn').hidden=false;
        $('#aiProgTxt').textContent='ready';
        addMsg('تم تشغيل **Qwen** داخل متصفحك ✔\nلن يغادر أي نص جهازك. تذكّر: الأرقام النهائية من المحرّك الحتمي، والنموذج دوره الشرح.','bot','LOCAL · جاهز');
        KH.toast('النموذج جاهز',{kind:'ok'});KH.Sound.play('ok');
      }).catch(function(){
        AI.engine=null;btn.disabled=false;btn.textContent='إعادة المحاولة ≈146MB';
        $('#aiProg').classList.remove('show');$('#aiProgTxt').textContent='';
        setStatus('err','LOCAL — LOAD FAILED');
        $('#aiNote').textContent='تعذّر تحميل النموذج (اتصال محجوب أو ذاكرة غير كافية). لا مشكلة: المبسّط وكل أدوات الموقع تعمل بالكامل.';
        KH.toast('تعذّر تحميل النموذج — المبسّط يعمل',{kind:'err'});
      });
    };
  },
  ask:ask
};
})();