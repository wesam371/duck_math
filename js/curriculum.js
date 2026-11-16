/* js/curriculum.js */
(function(){'use strict';
var KH=window.KH=window.KH||{};
var $=KH.$,esc=KH.esc;
function refresh(){
  var st=KH.state;
  $('#unitTabs').innerHTML=KH.UNITS.map(function(x){
    return '<button class="tab '+(st.unit===x.u?'on':'')+'" data-u="'+x.u+'">'+x.n+'</button>'}).join('');
  var q=($('#currSearch').value||'').trim();
  var all=KH.CURRICULUM.filter(function(c){return c.u===st.unit});
  var list=all.filter(function(c){return !q||(c.t+' '+c.d+' '+c.ex).indexOf(q)>=0});
  var mastered=all.filter(function(c){return (st.stats.byTopic[c.topic]||0)>=3}).length;
  var pct=Math.round(mastered/Math.max(1,all.length)*100);
  $('#progBar').style.width=pct+'%';
  $('#progPct').textContent=pct+'%';
  $('#progLabel').textContent='إتقان '+KH.UNITS.filter(function(x){return x.u===st.unit})[0].n;
  $('#currCount').textContent=list.length+' درس';
  $('#currList').innerHTML=list.map(function(c,i){
    var cnt=st.stats.byTopic[c.topic]||0,ok=cnt>=3;
    return '<div class="lesson-row" style="--d:'+(i*35)+'ms">'+
      '<span class="l-num">'+String(i+1).padStart(2,'0')+'</span>'+
      '<div class="l-main"><h4>'+esc(c.t)+'</h4><p>'+esc(c.d)+'</p><span class="l-ex">'+esc(c.ex)+'</span></div>'+
      '<div class="l-side">'+(ok?'<span class="l-master">✓ متقن</span>':'<span class="l-master partial">'+Math.min(cnt,3)+'/3</span>')+
      '<button class="btn btn-line btn-sm" data-ex="'+esc(c.ex)+'">جرّب مثالًا</button></div></div>';
  }).join('')||'<div class="nb-empty">لا توجد دروس مطابقة لبحثك.</div>';
}
KH.Curriculum={
  init:function(){
    refresh();
    $('#unitTabs').addEventListener('click',function(e){
      var b=e.target.closest('[data-u]');if(!b)return;
      KH.state.unit=+b.dataset.u;KH.store.set('unit',KH.state.unit);KH.Sound.play('tap');refresh();
    });
    $('#currSearch').addEventListener('input',refresh);
    $('#currList').addEventListener('click',function(e){
      var b=e.target.closest('[data-ex]');if(!b)return;
      KH.Sound.play('tap');KH.SolverUI.solveText(b.dataset.ex,{scroll:true});
    });
  },
  refresh:refresh
};
})();