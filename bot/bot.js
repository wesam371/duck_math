/* bot/bot.js — بوت تلغرام للتحكم باسم الموقع وأيقونته وأسماء المطوّرين
   تشغيل: node bot/bot.js   (Node 18+، بلا أي اعتماديات) */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- تحميل .env يدويًا (بلا حزم) ---------- */
(function loadEnv(){
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
})();

const BOT_TOKEN = process.env.BOT_TOKEN;
const GH_TOKEN  = process.env.GH_TOKEN;
const OWNER     = process.env.REPO_OWNER;
const REPO      = process.env.REPO_NAME;
const BRANCH    = process.env.REPO_BRANCH || 'main';
const CFG_PATH  = process.env.CONFIG_PATH || 'config.json';
const ADMINS    = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

if (!BOT_TOKEN || !GH_TOKEN || !OWNER || !REPO) {
  console.error('✗ أعدّ ملف bot/.env أولًا: BOT_TOKEN, GH_TOKEN, REPO_OWNER, REPO_NAME');
  process.exit(1);
}
if (!ADMINS.length) {
  console.error('✗ حدّد ADMIN_IDS (معرّفك الرقمي) حتى لا يتحكم أحد غيرك بالموقع.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const GH  = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CFG_PATH}`;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const NAMES = {
  red:'#E3270E', blue:'#1D3FCC', green:'#0E7A3C', amber:'#B26A00',
  magenta:'#C0157A', ink:'#101010', paper:'#FBFBF8', white:'#FFFFFF',
  أحمر:'#E3270E', أزرق:'#1D3FCC', أخضر:'#0E7A3C', كهرماني:'#B26A00',
  أرجواني:'#C0157A', أسود:'#101010', أبيض:'#FFFFFF'
};
const DEFAULTS = {
  name: 'duck_math',
  tagline: 'رياضيات الثالث الإعدادي — خطوة بخطوة',
  icon: { fill:'#E3270E', bg:'#FBFBF8', eye:'#FBFBF8' },
  about: { description: 'duck_math موقع تعليمي عربي مفتوح لرياضيات الصف الثالث الإعدادي وفق المنهاج السوري.' },
  developers: [{ name:'فريق duck_math', role:'التطوير والتصميم' }],
  version: 1,
  updatedAt: new Date().toISOString()
};

let lastBackup = null;

/* ---------- أدوات ---------- */
function color(v){
  if (!v) return null;
  const k = v.trim();
  if (HEX.test(k)) return k.length === 4
    ? '#' + k.slice(1).split('').map(c => c + c).join('')
    : k.toUpperCase();
  return NAMES[k] || NAMES[k.toLowerCase()] || null;
}
async function tg(method, body){
  const r = await fetch(`${API}/${method}`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}
async function send(chatId, text){
  await tg('sendMessage', { chat_id: chatId, text, parse_mode:'HTML', disable_web_page_preview:true });
}
async function ghGet(){
  const r = await fetch(`${GH}?ref=${BRANCH}&t=${Date.now()}`, {
    headers:{ Authorization:`Bearer ${GH_TOKEN}`, Accept:'application/vnd.github+json', 'User-Agent':'duck-math-bot' }
  });
  if (r.status === 404) return { sha:null, cfg: JSON.parse(JSON.stringify(DEFAULTS)) };
  if (!r.ok) throw new Error('GitHub GET ' + r.status + ' ' + (await r.text()).slice(0,160));
  const j = await r.json();
  const raw = Buffer.from(j.content, 'base64').toString('utf8');
  return { sha:j.sha, cfg: JSON.parse(raw) };
}
async function ghPut(cfg, sha, message){
  cfg.version = (Number(cfg.version) || 0) + 1;
  cfg.updatedAt = new Date().toISOString();
  const body = {
    message, branch: BRANCH,
    content: Buffer.from(JSON.stringify(cfg, null, 2) + '\n', 'utf8').toString('base64')
  };
  if (sha) body.sha = sha;
  const r = await fetch(GH, {
    method:'PUT',
    headers:{ Authorization:`Bearer ${GH_TOKEN}`, Accept:'application/vnd.github+json',
      'Content-Type':'application/json', 'User-Agent':'duck-math-bot' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('GitHub PUT ' + r.status + ' ' + (await r.text()).slice(0,200));
  return r.json();
}
function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function summary(c){
  const devs = (c.developers || []).map((d,i) =>
    `  ${i+1}. ${esc(d.name)}${d.role ? ' — ' + esc(d.role) : ''}`).join('\n') || '  (لا أسماء)';
  return `<b>الإعدادات الحالية</b>\n` +
    `الاسم: <code>${esc(c.name)}</code>\n` +
    `الوصف المختصر: ${esc(c.tagline || '—')}\n` +
    `لون البطة: <code>${c.icon.fill}</code>\n` +
    `خلفية الأيقونة: <code>${c.icon.bg}</code>\n` +
    `لون العين: <code>${c.icon.eye}</code>\n` +
    `الإصدار: <code>v${c.version}</code>\n` +
    `<b>المطوّرون (${(c.developers||[]).length}):</b>\n${devs}`;
}
const HELP =
`<b>أوامر بوت duck_math</b>
<code>/name اسم جديد</code> — تغيير اسم الموقع
<code>/tag نص</code> — الوصف المختصر (يظهر في عنوان التبويب)
<code>/icon لون</code> — لون البطة (hex أو: red blue green amber magenta ink)
<code>/iconbg لون</code> — خلفية الأيقونة
<code>/iconeye لون</code> — لون العين
<code>/desc نص</code> — وصف الموقع في صفحة «عن الموقع»

<b>المطوّرون</b>
<code>/dev list</code> — عرض الأسماء
<code>/dev add اسم | الدور</code> — إضافة (الدور اختياري)
<code>/dev del اسم</code> — حذف اسم
<code>/dev set اسم1 | اسم2 | اسم3</code> — استبدال القائمة كاملة
<code>/dev role اسم | الدور</code> — تعديل دور شخص
<code>/dev clear</code> — حذف كل الأسماء

<code>/show</code> — ملخّص الإعدادات
<code>/undo</code> — التراجع عن آخر تغيير
<code>/reset</code> — استعادة الإعدادات الافتراضية

كل أمر يُحفظ مباشرة في <code>config.json</code> على GitHub، ويظهر على الموقع بعد إعادة نشر Pages (عادة أقل من دقيقة).`;

/* ---------- تنفيذ الأوامر ---------- */
async function handle(msg){
  const chatId = msg.chat.id;
  const uid = String(msg.from && msg.from.id);
  const text = (msg.text || '').trim();
  if (!text.startsWith('/')) return;
  if (ADMINS.indexOf(uid) < 0) {
    await send(chatId, '⛔ غير مصرّح. معرّفك: <code>' + uid + '</code>\nأضفه إلى ADMIN_IDS في ملف .env.');
    return;
  }
  const sp = text.indexOf(' ');
  const cmd = (sp < 0 ? text : text.slice(0, sp)).split('@')[0].toLowerCase();
  const arg = sp < 0 ? '' : text.slice(sp + 1).trim();

  if (cmd === '/start' || cmd === '/help') { await send(chatId, HELP); return; }

  try {
    if (cmd === '/show') {
      const { cfg } = await ghGet();
      await send(chatId, summary(cfg));
      return;
    }
    if (cmd === '/undo') {
      if (!lastBackup) { await send(chatId, 'لا يوجد تغيير سابق للتراجع عنه في هذه الجلسة.'); return; }
      const { sha } = await ghGet();
      await ghPut(JSON.parse(JSON.stringify(lastBackup)), sha, 'bot: undo');
      lastBackup = null;
      await send(chatId, '↩️ تم التراجع عن آخر تغيير ونشره.');
      return;
    }

    const { sha, cfg } = await ghGet();
    const before = JSON.parse(JSON.stringify(cfg));
    let note = '';

    if (cmd === '/name') {
      if (!arg) { await send(chatId, 'اكتب الاسم بعد الأمر: <code>/name duck_math</code>'); return; }
      cfg.name = arg.slice(0, 40);
      note = 'الاسم أصبح: ' + cfg.name;
    }
    else if (cmd === '/tag') {
      if (!arg) { await send(chatId, 'اكتب النص بعد الأمر.'); return; }
      cfg.tagline = arg.slice(0, 120);
      note = 'تم تحديث الوصف المختصر.';
    }
    else if (cmd === '/icon' || cmd === '/iconbg' || cmd === '/iconeye') {
      const c = color(arg);
      if (!c) { await send(chatId, 'لون غير صالح. استعمل hex مثل <code>#E3270E</code> أو اسمًا: red, blue, green, amber, magenta, ink, paper.'); return; }
      cfg.icon = cfg.icon || {};
      if (cmd === '/icon') { cfg.icon.fill = c; note = 'لون البطة: ' + c; }
      if (cmd === '/iconbg') { cfg.icon.bg = c; note = 'خلفية الأيقونة: ' + c; }
      if (cmd === '/iconeye') { cfg.icon.eye = c; note = 'لون العين: ' + c; }
    }
    else if (cmd === '/desc') {
      if (!arg) { await send(chatId, 'اكتب الوصف بعد الأمر.'); return; }
      cfg.about = cfg.about || {};
      cfg.about.description = arg.slice(0, 1200);
      note = 'تم تحديث وصف صفحة «عن الموقع».';
    }
    else if (cmd === '/dev') {
      cfg.developers = Array.isArray(cfg.developers) ? cfg.developers : [];
      const sub = (arg.split(/\s+/)[0] || '').toLowerCase();
      const rest = arg.slice(sub.length).trim();
      if (sub === 'list') { await send(chatId, summary(cfg)); return; }
      if (sub === 'clear') { cfg.developers = []; note = 'حُذفت كل الأسماء.'; }
      else if (sub === 'add') {
        if (!rest) { await send(chatId, 'مثال: <code>/dev add أحمد الحلبي | تطوير الواجهة</code>'); return; }
        const parts = rest.split('|').map(s => s.trim());
        if (cfg.developers.some(d => d.name === parts[0])) { await send(chatId, 'الاسم موجود أصلًا. استعمل /dev role لتعديل دوره.'); return; }
        if (cfg.developers.length >= 24) { await send(chatId, 'الحد الأقصى 24 اسمًا.'); return; }
        cfg.developers.push({ name: parts[0].slice(0,60), role: (parts[1]||'').slice(0,60) });
        note = 'أُضيف: ' + parts[0];
      }
      else if (sub === 'del') {
        if (!rest) { await send(chatId, 'اكتب الاسم المراد حذفه.'); return; }
        const n = cfg.developers.length;
        cfg.developers = cfg.developers.filter(d => d.name !== rest);
        if (cfg.developers.length === n) { await send(chatId, 'لم أجد هذا الاسم. استعمل /dev list.'); return; }
        note = 'حُذف: ' + rest;
      }
      else if (sub === 'set') {
        if (!rest) { await send(chatId, 'مثال: <code>/dev set أحمد | واجهة :: سارة | محرّك</code>\nأو افصل بـ | بين الأشخاص.'); return; }
        const chunks = rest.indexOf('::') >= 0 ? rest.split('::') : rest.split('|');
        cfg.developers = chunks.map(s => s.trim()).filter(Boolean).slice(0,24).map(chunk => {
          const p = chunk.split('|').map(x => x.trim());
          return { name: p[0].slice(0,60), role: (p[1]||'').slice(0,60) };
        });
        note = 'استُبدلت القائمة بـ ' + cfg.developers.length + ' اسمًا.';
      }
      else if (sub === 'role') {
        const p = rest.split('|').map(s => s.trim());
        const person = cfg.developers.find(d => d.name === p[0]);
        if (!person) { await send(chatId, 'لم أجد هذا الاسم.'); return; }
        person.role = (p[1]||'').slice(0,60);
        note = 'تم تحديث دور ' + p[0];
      }
      else { await send(chatId, 'استعمل: list / add / del / set / role / clear'); return; }
    }
    else if (cmd === '/reset') {
      const fresh = JSON.parse(JSON.stringify(DEFAULTS));
      fresh.version = cfg.version;
      lastBackup = before;
      await ghPut(fresh, sha, 'bot: reset config');
      await send(chatId, '♻️ استُعيدت الإعدادات الافتراضية ونُشرت.\n\n' + summary(fresh));
      return;
    }
    else { await send(chatId, 'أمر غير معروف. اكتب /help'); return; }

    lastBackup = before;
    await ghPut(cfg, sha, 'bot: ' + cmd.replace('/','') + ' — ' + note.slice(0,60));
    await send(chatId, '✅ ' + esc(note) + '\n\n' + summary(cfg) +
      '\n\n<i>نُشر على GitHub. سيظهر على الموقع بعد اكتمال نشر Pages.</i>');
  } catch (e) {
    await send(chatId, '⚠️ خطأ: <code>' + esc(e.message) + '</code>');
  }
}

/* ----------.long polling ---------- */
let offset = 0, running = true;
async function loop(){
  console.log('🦆 duck_math bot يعمل — المستودع: ' + OWNER + '/' + REPO + ' (' + BRANCH + ')');
  while (running) {
    try {
      const r = await tg('getUpdates', { offset, timeout: 50, allowed_updates: ['message'] });
      if (r.ok && Array.isArray(r.result)) {
        for (const u of r.result) {
          offset = u.update_id + 1;
          if (u.message) await handle(u.message);
        }
      } else if (!r.ok) {
        console.error('Telegram:', r.description);
        await new Promise(s => setTimeout(s, 3000));
      }
    } catch (e) {
      console.error('loop:', e.message);
      await new Promise(s => setTimeout(s, 4000));
    }
  }
}
process.on('SIGINT', () => { running = false; console.log('\nإيقاف البوت…'); process.exit(0); });
loop();