/* js/notebook.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,$$=KH.$$,esc=KH.esc,fmtDate=KH.fmtDate;
var state=KH.state;
KH.notebook=KH.store.get('notebook',null);
function save(){KH.store.set('notebook',KH.notebook);KH.updateStats()}
function seed(){
  var seeds=['3س + 7 = 22','2س + 3ص = 12 ؛ س - ص = 1','sin_cos_tan مثلث قائم في A: AB=3, AC=4, BC=5','حجم مخروط نصف قطره 3 وارتفاعه 4'];
  var notes=['راجع خطوة نقل الحدود: الإشارة تنعكس دائمًا.','طريقة الحذف: وحّد معامل ص ثم اطرح.',
    'sin = المقابل/الوتر، وتحقّق بـ sin²+cos²=1.','حجم المخروط ثلث الأسطوانة المكافئة.'];
  var out=[];
  seeds.forEach(function(s,i){
    try{
      var sol=KH.solveProblem(s);
      out.push({id:'seed'+i,title:sol.topicLabel+' — مثال '+(i+1),problem:sol.problemText,topic:sol.topic,
        topicLabel:sol.topicLabel,problemHTML:sol.problemHTML,answerHTML:sol.answerHTML,answerText:sol.answerText,
        unit:sol.unit||'',steps:sol.steps,check:sol.check,note:notes[i],fav:i===0,created:Date.now()-(i+1)*43200000});
    }catch(e){}
  });
  return out;
}
function filtered(){
  var list=KH.notebook.slice();
  var q=state.nb.q.trim().toLowerCase();
  if(q)list=list.filter(function(r){
    return (r.title+' '+r.problem+' '+r.topicLabel+' '+(r.note||'')).toLowerCase().indexOf(q)>=0});
  var f=state.nb.filter;
  if(state.nbView==='fav')list=list.filter(function(r){return r.fav});
  else if(state.nbView!=='all'&&state.nbView.charAt(0)!=='u')f=state.nbView;
  if(f!=='all')list=list.filter(function(r){return r.topic===f});
  var s=state.nb.sort;
  if(s==='new')list.sort(function(a,b){return b.created-a.created});
  else if(s==='old')list.sort(function(a,b){return a.created-b.created});
  else if(s==='topic')list.sort(function(a,b){return a.topicLabel.localeCompare(b.topicLabel,'ar')});
  else if(s==='fav')list.sort(function(a,b){return (b.fav?1:0)-(a.fav?1:0)});
  return list;
}
function renderViews(){
  var base=[{k:'all',n:'الكل'},{k:'fav',n:'★ المفضّلة'},{k:'system',n:'جمل معادلات'},
    {k:'sin_cos_tan',n:'sin_cos_tan'},{k:'solid',n:'مجسمات'},{k:'vector',n:'أشعة'}];
  var h=base.map(function(v){
    return '<button class="chip '+(state.nbView===v.k?'on':'')+'" data-v="'+v.k+'">'+v.n+'</button>'}).join('');
  h+=state.views.map(function(v,i){
    return '<button class="chip '+(state.nbView==='u'+i?'on':'')+'" data-v="u'+i+'">'+esc(v.name)+
      ' <span data-delview="'+i+'" style="opacity:.55;margin-inline-start:4px">✕</span></button>'}).join('');
  $('#nbViews').innerHTML=h;
}
function render(){
  var list=filtered(),fl=$('#nbFilter');
  if(fl.options.length<=1){
    fl.innerHTML='<option value="all">كل الأنواع</option>'+Object.keys(KH.TOPICS).map(function(k){
      return '<option value="'+k+'">'+KH.TOPICS[k]+'</option>'}).join('');
  }
  if(!list.length){
    $('#nbList').innerHTML='<div class="nb-empty">لا توجد حلول مطابقة. احفظ حلًا من قسم «حلّ بخطوات» ليظهر هنا.</div>';
    updateBulk();return;
  }
  $('#nbList').innerHTML=list.map(function(r){
    var sel=state.selection.has(r.id);
    return '<div class="nb-item'+(sel?' sel':'')+'" draggable="true" data-id="'+r.id+'">'+
      '<button class="nb-check'+(sel?' on':'')+'" data-check="'+r.id+'" role="checkbox" aria-checked="'+sel+'" aria-label="تحديد">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M4 12l6 6L20 6"/></svg></button>'+
      '<div class="nb-main"><h4>'+esc(r.title)+'</h4>'+
      '<div class="nb-meta"><span class="tag">'+esc(r.topicLabel)+'</span><span>'+fmtDate(r.created)+'</span>'+
      (r.note?'<span>· ملاحظة</span>':'')+'</div>'+
      '<div class="nb-eq">'+esc(r.answerText+(r.unit?' '+r.unit:''))+'</div></div>'+
      '<div class="nb-side"><div class="order-btns">'+
      '<button class="mini-btn" data-up="'+r.id+'" aria-label="أعلى"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 15l6-6 6 6"/></svg></button>'+
      '<button class="mini-btn" data-down="'+r.id+'" aria-label="أسفل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg></button></div>'+
      '<button class="mini-btn fav'+(r.fav?' on':'')+'" data-fav="'+r.id+'" aria-label="مفضلة">'+
      '<svg viewBox="0 0 24 24" fill="'+(r.fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/></svg></button>'+
      '<button class="mini-btn" data-open="'+r.id+'" aria-label="فتح"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg></button>'+
      '<button class="mini-btn" data-del="'+r.id+'" aria-label="حذف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/></svg></button>'+
      '</div></div>';
  }).join('');
  updateBulk();
}
function updateBulk(){
  var n=state.selection.size;
  $('#bulkCount').textContent=n;
  $('#bulkBar').classList.toggle('show',n>0);
}
function removeRecords(ids){
  var backup=KH.notebook.slice(),set=new Set(ids);
  KH.notebook=KH.notebook.filter(function(r){return !set.has(r.id)});
  ids.forEach(function(i){state.selection.delete(i)});
  save();render();close();
  KH.toast('حُذف '+ids.length+' حل',{kind:'ok',ms:6000,action:'تراجع',onAction:function(){
    KH.notebook=backup;save();render();KH.toast('تم التراجع',{kind:'ok'});
  }});
}
function moveRec(id,dir){
  var i=-1;KH.notebook.forEach(function(r,k){if(r.id===id)i=k});
  var j=i+dir;
  if(i<0||j<0||j>=KH.notebook.length)return;
  var x=KH.notebook.splice(i,1)[0];KH.notebook.splice(j,0,x);
  state.nb.sort='manual';$('#nbSort').value='manual';
  save();render();KH.Sound.play('tap');
}
function stepHTML(s,i){
  return '<div class="step"><div class="step-n">'+String(i+1).padStart(2,'0')+'</div><div>'+
    '<div class="step-t">'+esc(s.title)+'</div><div class="math">'+s.html+'</div>'+
    (s.note?'<div class="step-note">'+esc(s.note)+'</div>':'')+'</div></div>';
}
function open(id){
  var r=null;KH.notebook.forEach(function(x){if(x.id===id)r=x});
  if(!r)return;
  $('#drawerTitle').textContent=r.topicLabel;
  $('#drawerBody').innerHTML=
    '<div class="f-group"><label>عنوان الحل</label><input id="dTitle" class="field" value="'+esc(r.title)+'"></div>'+
    '<div class="problem-box"><small>المسألة</small><div class="math">'+r.problemHTML+'</div>'+
    '<div class="plain">'+esc(r.problem)+'</div></div>'+
    '<div class="answer-box"><div class="lab">ANSWER'+(r.unit?' · '+esc(r.unit):'')+'</div><div class="math">'+r.answerHTML+'</div></div>'+
    '<div style="margin-bottom:16px">'+r.steps.map(stepHTML).join('')+'</div>'+
    (r.check?'<div class="problem-box"><small>التحقّق</small><div class="math">'+r.check.html+'</div>'+
      '<div class="step-note">'+esc(r.check.note)+'</div></div>':'')+
    '<div class="f-group"><label>ملاحظتك الشخصية</label><textarea id="dNote" class="field" rows="3" placeholder="اكتب ما تريد تذكّره…">'+esc(r.note||'')+'</textarea></div>';
  $('#drawerFoot').innerHTML='<button class="btn btn-primary btn-sm" id="dReSolve">أعد الحل</button>'+
    '<button class="btn btn-line btn-sm" id="dFav">'+(r.fav?'إزالة من المفضّلة':'أضف للمفضّلة')+'</button>'+
    '<button class="btn btn-danger btn-sm" id="dDel">حذف</button>';
  $('#dTitle').oninput=function(e){r.title=e.target.value;save();render()};
  $('#dNote').oninput=function(e){r.note=e.target.value;save()};
  $('#dReSolve').onclick=function(){close();location.hash='#solve';KH.SolverUI.solveText(r.problem,{scroll:true})};
  $('#dFav').onclick=function(){r.fav=!r.fav;save();render();open(r.id);KH.Sound.play('toggle')};
  $('#dDel').onclick=function(){removeRecords([r.id])};
  $('#drawer').classList.add('open');$('#scrim').classList.add('open');KH.Sound.play('tap');
}
function close(){$('#drawer').classList.remove('open');$('#scrim').classList.remove('open')}
KH.Notebook={
  init:function(){
    if(!KH.notebook||!Array.isArray(KH.notebook)||!KH.notebook.length){KH.notebook=seed();save()}
    renderViews();render();KH.updateStats();
    $('#nbSearch').oninput=function(e){state.nb.q=e.target.value;render()};
    $('#nbFilter').onchange=function(e){state.nb.filter=e.target.value;state.nbView='all';renderViews();render()};
    $('#nbSort').onchange=function(e){state.nb.sort=e.target.value;render()};
    $('#selectAll').onclick=function(){
      var l=filtered();
      if(state.selection.size===l.length)state.selection.clear();
      else l.forEach(function(r){state.selection.add(r.id)});
      render();KH.Sound.play('tap');
    };
    $('#bulkClear').onclick=function(){state.selection.clear();render()};
    $('#bulkDelete').onclick=function(){removeRecords(Array.from(state.selection))};
    $('#bulkFav').onclick=function(){
      var any=KH.notebook.some(function(r){return state.selection.has(r.id)&&!r.fav});
      KH.notebook.forEach(function(r){if(state.selection.has(r.id))r.fav=any});
      save();render();KH.toast('تم تحديث المفضّلة',{kind:'ok'});
    };
    $('#saveViewBtn').onclick=function(){$('#viewName').classList.add('show');$('#viewNameInput').focus()};
    $('#viewNameNo').onclick=function(){$('#viewName').classList.remove('show')};
    $('#viewNameOk').onclick=function(){
      var n=$('#viewNameInput').value.trim()||'عرض '+(state.views.length+1);
      state.views.push({name:n,q:state.nb.q,filter:state.nb.filter,sort:state.nb.sort});
      KH.store.set('views',state.views);
      $('#viewNameInput').value='';$('#viewName').classList.remove('show');
      renderViews();KH.toast('حُفظ العرض «'+n+'»',{kind:'ok'});
    };
    $('#nbViews').addEventListener('click',function(e){
      var dv=e.target.closest('[data-delview]');
      if(dv){
        var i=+dv.dataset.delview,removed=state.views.splice(i,1)[0];
        KH.store.set('views',state.views);
        if(state.nbView==='u'+i)state.nbView='all';
        renderViews();render();
        KH.toast('حُذف العرض',{action:'تراجع',onAction:function(){
          state.views.splice(i,0,removed);KH.store.set('views',state.views);renderViews();render();
        }});
        return;
      }
      var b=e.target.closest('.chip[data-v]');if(!b)return;
      state.nbView=b.dataset.v;KH.Sound.play('tap');
      if(state.nbView.charAt(0)==='u'){
        var v=state.views[+state.nbView.slice(1)];
        if(v){state.nb.q=v.q;state.nb.filter=v.filter;state.nb.sort=v.sort;
          $('#nbSearch').value=v.q;$('#nbFilter').value=v.filter;$('#nbSort').value=v.sort}
      }
      renderViews();render();
    });
    $('#nbExport').onclick=function(){
      var blob=new Blob([JSON.stringify(KH.notebook,null,2)],{type:'application/json'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);a.download='duck_math-notebook.json';a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
      KH.toast('تم تصدير الدفتر',{kind:'ok'});
    };
    var list=$('#nbList');
    list.addEventListener('click',function(e){
      var c=e.target.closest('[data-check]');
      if(c){var id=c.dataset.check;
        if(state.selection.has(id))state.selection.delete(id);else state.selection.add(id);
        render();KH.Sound.play('tap');return}
      var f=e.target.closest('[data-fav]');
      if(f){var rr=null;KH.notebook.forEach(function(x){if(x.id===f.dataset.fav)rr=x});
        if(rr){rr.fav=!rr.fav;save();render();KH.Sound.play('toggle')}return}
      var u=e.target.closest('[data-up]');if(u){moveRec(u.dataset.up,-1);return}
      var d=e.target.closest('[data-down]');if(d){moveRec(d.dataset.down,1);return}
      var del=e.target.closest('[data-del]');if(del){removeRecords([del.dataset.del]);return}
      var o=e.target.closest('[data-open]');if(o){open(o.dataset.open);return}
      var item=e.target.closest('.nb-item');if(item)open(item.dataset.id);
    });
    list.addEventListener('keydown',function(e){
      var c=e.target.closest('[data-check]');
      if(c&&(e.key===' '||e.key==='Enter')){e.preventDefault();c.click()}
    });
    var dragId=null;
    list.addEventListener('dragstart',function(e){
      var it=e.target.closest('.nb-item');if(!it)return;
      dragId=it.dataset.id;it.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',dragId)}catch(x){}
    });
    list.addEventListener('dragend',function(){
      $$('.nb-item',list).forEach(function(x){x.classList.remove('dragging','drop-target')});dragId=null;
    });
    list.addEventListener('dragover',function(e){
      e.preventDefault();
      var it=e.target.closest('.nb-item');
      $$('.nb-item',list).forEach(function(x){x.classList.remove('drop-target')});
      if(it&&it.dataset.id!==dragId)it.classList.add('drop-target');
    });
    list.addEventListener('drop',function(e){
      e.preventDefault();
      var it=e.target.closest('.nb-item');if(!it||!dragId)return;
      var from=-1,to=-1;
      KH.notebook.forEach(function(r,k){if(r.id===dragId)from=k;if(r.id===it.dataset.id)to=k});
      if(from<0||to<0)return;
      var x=KH.notebook.splice(from,1)[0];KH.notebook.splice(to,0,x);
      state.nb.sort='manual';$('#nbSort').value='manual';
      save();render();KH.Sound.play('save');
    });
    $('#scrim').onclick=close;$('#drawerClose').onclick=close;
  },
  add:function(s){
    var rec={id:'n'+Date.now(),title:s.topicLabel+' — '+s.problemText.slice(0,26),
      problem:s.problemText,topic:s.topic,topicLabel:s.topicLabel,problemHTML:s.problemHTML,
      answerHTML:s.answerHTML,answerText:s.answerText,unit:s.unit||'',steps:s.steps,check:s.check,
      note:'',fav:false,created:Date.now()};
    KH.notebook.unshift(rec);save();render();KH.Sound.play('save');
    KH.toast('حُفظ الحل في دفترك',{kind:'ok',action:'فتح',onAction:function(){open(rec.id)}});
  },
  close:close
};
})();