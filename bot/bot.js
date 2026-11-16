/* bot/bot.js — بوت تلغرام للتحكم بموقع duck_math
   التشغيل:  node bot.js       (Node 18 أو أحدث — بلا npm install)
   أول تشغيل ينشئ ملف bot/.env تلقائيًا: املأه ثم شغّل مرة أخرى. */
'use strict';
const fs=require('fs'), path=require('path');
const ENV=path.join(__dirname,'.env');
const LOCAL_CFG=path.join(__dirname,'..','config.json');

/* ---------- إنشاء .env تلقائيًا في أول تشغيل ---------- */
if(!fs.existsSync(ENV)){
  fs.writeFileSync(ENV,
`# ═══ املأ السطرين الأولين فقط ═══
BOT_TOKEN=
ADMIN_IDS=

# اختياري: للنشر التلقائي على GitHub. اتركه فارغًا ليحفظ البوت config.json بجانبك يدويًا.
GH_TOKEN=
REPO_OWNER=
REPO_NAME=duck_math
REPO_BRANCH=main
`,'utf8');
  console.log('\n🦆 أُنشئ ملف الإعدادات: bot/.env\n');
  console.log('افتحه بمحرّر نصوص وضع:');
  console.log('  BOT_TOKEN  = التوكن من @BotFather');
  console.log('  ADMIN_IDS  = معرّفك الرقمي من @userinfobot');
  console.log('\nثم شغّل:  node bot.js\n');
  process.exit(0);
}
fs.readFileSync(ENV,'utf8').split(/\r?\n/).forEach(l=>{
  const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'').trim();
});
const BOT=process.env.BOT_TOKEN, GH=process.env.GH_TOKEN;
const OWNER=process.env.REPO_OWNER, REPO=process.env.REPO_NAME||'duck_math';
const BRANCH=process.env.REPO_BRANCH||'main';
const ADMINS=(process.env.ADMIN_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!BOT||!ADMINS.length){
  console.error('\n✗ bot/.env ناقص: BOT_TOKEN و ADMIN_IDS مطلوبان.\n');process.exit(1);
}
const REMOTE=!!(GH&&OWNER&&REPO);
const API='https://api.telegram.org/bot'+BOT;
const GHURL='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/config.json';
const COLORS={'أحمر':'#E3270E','أزرق':'#1D3FCC','أخضر':'#0E7A3C','كهرماني':'#B26A00','أرجواني':'#C0157A','أسود':'#101010'};
const DEF={name:'duck_math',tagline:'رياضيات الثالث الإعدادي — خطوة بخطوة',
  icon:{fill:'#E3270E',bg:'#FBFBF8',eye:'#FBFBF8'},
  about:{description:'duck_math موقع تعليمي عربي مفتوح لرياضيات الصف الثالث الإعدادي وفق المنهاج السوري. يحلّ المسائل بمحرّك رياضي حتمي داخل المتصفح، ويعرض كل خطوة مع سببها ثم يتحقّق من الناتج.'},
  developers:[{name:'فريق duck_math',role:'التطوير والتصميم'}],version:1,updatedAt:new Date().toISOString()};
const awaiting=new Map(); let backup=null;

/* ---------- أدوات ---------- */
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function tg(m,b){const r=await fetch(API+'/'+m,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return r.json();}
const send=(id,text,kb)=>tg('sendMessage',{chat_id:id,text,parse_mode:'HTML',disable_web_page_preview:true,
  reply_markup:kb?{inline_keyboard:kb}:undefined});
async function readCfg(){
  if(!REMOTE){
    if(fs.existsSync(LOCAL_CFG))return{sha:null,cfg:JSON.parse(fs.readFileSync(LOCAL_CFG,'utf8'))};
    return{sha:null,cfg:JSON.parse(JSON.stringify(DEF))};
  }
  const r=await fetch(GHURL+'?ref='+BRANCH+'&t='+Date.now(),
    {headers:{Authorization:'Bearer '+GH,Accept:'application/vnd.github+json','User-Agent':'duck-math-bot'}});
  if(r.status===404)return{sha:null,cfg:JSON.parse(JSON.stringify(DEF))};
  if(!r.ok)throw new Error('GitHub قراءة '+r.status);
  const j=await r.json();
  return{sha:j.sha,cfg:JSON.parse(Buffer.from(j.content,'base64').toString('utf8'))};
}
async function writeCfg(cfg,sha,msg){
  cfg.version=(Number(cfg.version)||0)+1;
  cfg.updatedAt=new Date().toISOString();
  const text=JSON.stringify(cfg,null,2)+'\n';
  if(!REMOTE){fs.writeFileSync(LOCAL_CFG,text,'utf8');return 'local';}
  const body={message:msg,branch:BRANCH,content:Buffer.from(text,'utf8').toString('base64')};
  if(sha)body.sha=sha;
  const r=await fetch(GHURL,{method:'PUT',headers:{Authorization:'Bearer '+GH,
    Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':'duck-math-bot'},
    body:JSON.stringify(body)});
  if(!r.ok)throw new Error('GitHub كتابة '+r.status+' '+(await r.text()).slice(0,140));
  return 'remote';
}
function summary(c){
  const d=(c.developers||[]).map((x,i)=>'  '+(i+1)+'. '+esc(x.name)+(x.role?' — '+esc(x.role):'')).join('\n')||'  (لا أسماء)';
  return '<b>الإعدادات الحالية</b>\nالاسم: <code>'+esc(c.name)+'</code>\n'+
    'لون البطة: <code>'+c.icon.fill+'</code>\nالإصدار: <code>v'+c.version+'</code>\n'+
    '<b>المطوّرون ('+(c.developers||[]).length+')</b>\n'+d;
}
const MENU=[
  [{text:'🏷 اسم الموقع',callback_data:'name'},{text:'🎨 لون البطة',callback_data:'color'}],
  [{text:'👥 المطوّرون',callback_data:'devs'},{text:'📝 وصف الموقع',callback_data:'desc'}],
  [{text:'📊 الحالة',callback_data:'show'},{text:'↩️ تراجع',callback_data:'undo'}],
  [{text:'♻️ استعادة الافتراضي',callback_data:'reset'}]
];
const DEVKB=[
  [{text:'➕ إضافة',callback_data:'dev:add'},{text:'➖ حذف',callback_data:'dev:del'}],
  [{text:'🔁 استبدال الكل',callback_data:'dev:set'},{text:'🧹 مسح الكل',callback_data:'dev:clear'}],
  [{text:'⬅️ رجوع',callback_data:'menu'}]
];
const COLKB=[Object.keys(COLORS).map(n=>({text:n,callback_data:'setcolor:'+COLORS[n]})),
  [{text:'⬅️ رجوع',callback_data:'menu'}]];
const BACK=[[{text:'⬅️ القائمة',callback_data:'menu'}]];

async function apply(id,fn,msg){
  try{
    const {sha,cfg}=await readCfg();
    const before=JSON.parse(JSON.stringify(cfg));
    const note=fn(cfg);
    if(note===null)return;
    backup=before;
    const where=await writeCfg(cfg,sha,'bot: '+msg);
    await send(id,'✅ '+esc(note)+'\n\n'+summary(cfg)+
      (where==='remote'?'\n\n<i>نُشر على GitHub — يظهر على الموقع خلال دقيقة.</i>'
                       :'\n\n<i>حُفظ في config.json بجانب البوت. ارفعه إلى المستودع ليظهر على الموقع.</i>'),MENU);
  }catch(e){await send(id,'⚠️ خطأ: <code>'+esc(e.message)+'</code>',MENU);}
}

/* ---------- المعالجة ---------- */
async function onCallback(q){
  const id=q.message.chat.id, uid=String(q.from.id), d=q.data;
  await tg('answerCallbackQuery',{callback_query_id:q.id});
  if(ADMINS.indexOf(uid)<0){await send(id,'⛔ غير مصرّح. معرّفك: <code>'+uid+'</code>');return;}
  awaiting.delete(id);
  if(d==='menu'){await send(id,'<b>لوحة تحكم duck_math</b>\nاختر ما تريد تعديله:',MENU);return;}
  if(d==='show'){const{cfg}=await readCfg();await send(id,summary(cfg),MENU);return;}
  if(d==='name'){awaiting.set(id,'name');await send(id,'اكتب اسم الموقع الجديد:',BACK);return;}
  if(d==='desc'){awaiting.set(id,'desc');await send(id,'اكتب وصف الموقع لصفحة «عن الموقع»:',BACK);return;}
  if(d==='color'){await send(id,'اختر لون البطة:',COLKB);return;}
  if(d.startsWith('setcolor:')){const c=d.split(':')[1];
    await apply(id,cfg=>{cfg.icon.fill=c;return 'لون البطة أصبح '+c},'icon');return;}
  if(d==='devs'){const{cfg}=await readCfg();await send(id,summary(cfg)+'\n\nماذا تريد؟',DEVKB);return;}
  if(d==='dev:add'){awaiting.set(id,'dev:add');await send(id,'اكتب الاسم، ويمكن إضافة الدور بعد شرطة:\n<code>أحمد الحلبي | تطوير الواجهة</code>',BACK);return;}
  if(d==='dev:del'){awaiting.set(id,'dev:del');await send(id,'اكتب الاسم الذي تريد حذفه بالضبط:',BACK);return;}
  if(d==='dev:set'){awaiting.set(id,'dev:set');await send(id,'اكتب القائمة كاملة، اسم في كل سطر:\n<code>أحمد | الواجهة\nسارة | المحرّك</code>',BACK);return;}
  if(d==='dev:clear'){await apply(id,cfg=>{cfg.developers=[];return 'حُذفت كل الأسماء'},'dev clear');return;}
  if(d==='undo'){
    if(!backup){await send(id,'لا يوجد تغيير سابق للتراجع عنه.',MENU);return;}
    const{sha}=await readCfg();const b=backup;backup=null;
    await writeCfg(b,sha,'bot: undo');
    await send(id,'↩️ تم التراجع عن آخر تغيير.',MENU);return;
  }
  if(d==='reset'){
    const{sha,cfg}=await readCfg();backup=JSON.parse(JSON.stringify(cfg));
    const f=JSON.parse(JSON.stringify(DEF));f.version=cfg.version;
    await writeCfg(f,sha,'bot: reset');
    await send(id,'♻️ استُعيدت الإعدادات الافتراضية.\n\n'+summary(f),MENU);return;
  }
}
async function onMessage(m){
  const id=m.chat.id, uid=String(m.from&&m.from.id), text=(m.text||'').trim();
  if(ADMINS.indexOf(uid)<0){
    await send(id,'⛔ غير مصرّح لك.\nمعرّفك الرقمي: <code>'+uid+'</code>\nأضفه إلى ADMIN_IDS في bot/.env ثم أعد تشغيل البوت.');return;
  }
  if(text==='/start'||text==='/help'||text==='/menu'){
    awaiting.delete(id);
    await send(id,'🦆 <b>أهلًا بك في لوحة تحكم duck_math</b>\n\n'+
      'كل تعديل يُحفظ فورًا في <code>config.json</code>.\n'+
      (REMOTE?'النشر على GitHub مفعّل ✔':'وضع محلي: يُحفظ الملف بجانب البوت، ارفعه بنفسك.')+
      '\n\nاختر من الأزرار:',MENU);return;
  }
  const mode=awaiting.get(id);
  if(!mode){await send(id,'اختر من الأزرار، أو اكتب /start',MENU);return;}
  if(!text){await send(id,'اكتب نصًا من فضلك.');return;}
  awaiting.delete(id);
  if(mode==='name'){await apply(id,cfg=>{cfg.name=text.slice(0,40);return 'الاسم أصبح: '+cfg.name},'name');return;}
  if(mode==='desc'){await apply(id,cfg=>{cfg.about.description=text.slice(0,1200);return 'تم تحديث الوصف'},'desc');return;}
  if(mode==='dev:add'){
    const p=text.split('|').map(s=>s.trim());
    await apply(id,cfg=>{
      cfg.developers=cfg.developers||[];
      if(cfg.developers.some(d=>d.name===p[0]))return null;
      if(cfg.developers.length>=24)throw new Error('الحد الأقصى 24 اسمًا');
      cfg.developers.push({name:p[0].slice(0,60),role:(p[1]||'').slice(0,60)});
      return 'أُضيف: '+p[0];
    },'dev add');return;
  }
  if(mode==='dev:del'){
    await apply(id,cfg=>{
      const n=(cfg.developers||[]).length;
      cfg.developers=(cfg.developers||[]).filter(d=>d.name!==text);
      if(cfg.developers.length===n)throw new Error('لم أجد هذا الاسم');
      return 'حُذف: '+text;
    },'dev del');return;
  }
  if(mode==='dev:set'){
    const rows=text.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,24);
    await apply(id,cfg=>{
      cfg.developers=rows.map(r=>{const p=r.split('|').map(s=>s.trim());
        return{name:p[0].slice(0,60),role:(p[1]||'').slice(0,60)}});
      return 'استُبدلت القائمة بـ '+cfg.developers.length+' اسمًا';
    },'dev set');return;
  }
}

/* ---------- التشغيل ---------- */
let offset=0,running=true;
(async function loop(){
  console.log('\n🦆 بوت duck_math يعمل');
  console.log('   الوضع: '+(REMOTE?'نشر تلقائي على '+OWNER+'/'+REPO:'محلي — يحفظ config.json بجانب البوت'));
  console.log('   المشرفون: '+ADMINS.join(', '));
  console.log('   افتح بوتك في تلغرام واكتب /start\n');
  while(running){
    try{
      const r=await tg('getUpdates',{offset,timeout:50,allowed_updates:['message','callback_query']});
      if(r.ok&&Array.isArray(r.result)){
        for(const u of r.result){
          offset=u.update_id+1;
          if(u.message)await onMessage(u.message);
          else if(u.callback_query)await onCallback(u.callback_query);
        }
      }else if(!r.ok){console.error('Telegram:',r.description);await new Promise(s=>setTimeout(s,3000));}
    }catch(e){console.error('loop:',e.message);await new Promise(s=>setTimeout(s,4000));}
  }
})();
process.on('SIGINT',()=>{running=false;console.log('\nإيقاف البوت…');process.exit(0);});
