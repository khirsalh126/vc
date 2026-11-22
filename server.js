// Watch Party — ملف واحد فقط. التشغيل: node server.js  (بدون أي مكتبات)
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HTML = Buffer.from(String.raw`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>غرفة المشاهدة 🍿</title>
<style>
  :root { --bg:#0f1020; --card:#1a1b33; --card2:#23244a; --acc:#8b5cf6; --acc2:#ec4899; --txt:#f1f1ff; --mut:#9a9bc4; --ok:#22c55e; --err:#f87171; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:radial-gradient(1200px 600px at 80% -10%, #2a1f5c 0%, var(--bg) 60%); color:var(--txt); font-family:"Segoe UI",Tahoma,Arial,sans-serif; min-height:100vh; }
  .screen { display:none; min-height:100vh; align-items:center; justify-content:center; padding:20px; }
  .screen.on { display:flex; }
  #roomScr.on { display:block; padding:12px; }
  .box { background:var(--card); border:1px solid #ffffff14; border-radius:20px; padding:28px; width:100%; max-width:420px; box-shadow:0 20px 60px #0008; }
  h1 { font-size:28px; text-align:center; margin-bottom:6px; }
  .sub { color:var(--mut); text-align:center; margin-bottom:22px; font-size:14px; }
  button, input { font:inherit; }
  .btn { display:block; width:100%; padding:14px; border:0; border-radius:12px; cursor:pointer; color:#fff; font-weight:700; font-size:16px; background:linear-gradient(135deg,var(--acc),var(--acc2)); margin-top:12px; transition:.15s; }
  .btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
  .btn.sec { background:var(--card2); font-weight:500; }
  label { display:block; font-size:13px; color:var(--mut); margin:14px 0 6px; }
  input[type=text], input[type=url] { width:100%; padding:12px 14px; border-radius:10px; border:1px solid #ffffff1f; background:#12132a; color:var(--txt); outline:none; }
  input:focus { border-color:var(--acc); }
  .row { display:flex; gap:8px; }
  .err { color:var(--err); font-size:14px; margin-top:12px; min-height:18px; text-align:center; }
  .hint { color:var(--mut); font-size:12px; margin-top:6px; line-height:1.6; }

  /* الغرفة */
  .top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
  .top .chip { background:var(--card); padding:8px 14px; border-radius:999px; font-size:14px; border:1px solid #ffffff14; }
  .top .chip b { color:var(--acc2); }
  .top button { background:var(--card2); color:var(--txt); border:0; padding:8px 14px; border-radius:999px; cursor:pointer; font-size:14px; }
  .grid { display:grid; grid-template-columns:1fr 340px; gap:12px; align-items:start; }
  @media (max-width:900px){ .grid { grid-template-columns:1fr; } }
  .player { background:#000; border-radius:16px; overflow:hidden; position:relative; }
  video { width:100%; max-height:70vh; display:block; background:#000; }
  .player:fullscreen video { max-height:100vh; height:calc(100vh - 56px); }
  .tap { position:absolute; inset:0 0 56px 0; display:none; align-items:center; justify-content:center; background:#000a; }
  .tap.on { display:flex; }
  .tap button { padding:16px 28px; font-size:18px; border:0; border-radius:14px; cursor:pointer; color:#fff; font-weight:700; background:linear-gradient(135deg,var(--acc),var(--acc2)); }
  .bar { display:flex; align-items:center; gap:8px; padding:8px 12px; background:#111225; height:56px; direction:ltr; }
  .bar button { background:transparent; border:0; color:#fff; font-size:20px; cursor:pointer; padding:4px 8px; border-radius:8px; }
  .bar button:disabled { opacity:.3; cursor:not-allowed; }
  .bar button:not(:disabled):hover { background:#ffffff1a; }
  .bar input[type=range] { accent-color:var(--acc); }
  #seek { flex:1; min-width:60px; }
  #vol { width:70px; }
  #tm { font-size:12px; color:var(--mut); min-width:88px; text-align:center; font-variant-numeric:tabular-nums; }
  .role { font-size:12px; margin:8px 2px 0; color:var(--mut); }
  .side { background:var(--card); border-radius:16px; display:flex; flex-direction:column; height:70vh; min-height:420px; overflow:hidden; }
  @media (max-width:900px){ .side { height:60vh; } }
  .users { padding:12px; border-bottom:1px solid #ffffff14; max-height:130px; overflow:auto; }
  .users div { font-size:14px; padding:3px 0; }
  .micbtn { margin:10px 12px 0; padding:10px; border-radius:10px; border:0; cursor:pointer; background:var(--card2); color:var(--txt); font-size:15px; }
  .micbtn.on { background:var(--ok); color:#04210f; font-weight:700; }
  #msgs { flex:1; overflow:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .msg { background:var(--card2); padding:8px 12px; border-radius:12px; font-size:14px; max-width:92%; word-break:break-word; align-self:flex-start; }
  .msg.me { background:#4c3a9a; align-self:flex-end; }
  .msg b { display:block; font-size:12px; color:#c4b5fd; margin-bottom:2px; }
  .msg.sys { background:transparent; color:var(--mut); font-size:12px; align-self:center; padding:0; }
  .send { display:flex; gap:8px; padding:10px; border-top:1px solid #ffffff14; }
  .send input { flex:1; }
  .send button { background:linear-gradient(135deg,var(--acc),var(--acc2)); border:0; color:#fff; padding:0 16px; border-radius:10px; cursor:pointer; font-weight:700; }
</style>
</head>
<body>

<!-- الشاشة الأولى -->
<div id="home" class="screen on">
  <div class="box">
    <h1>🍿 غرفة المشاهدة</h1>
    <p class="sub">اتفرج على الأنمي مع صحابك في نفس اللحظة</p>
    <button class="btn" id="goCreate">➕ إنشاء غرفة</button>
    <button class="btn sec" id="goJoin">🚪 انضمام لغرفة</button>
  </div>
</div>

<!-- إنشاء -->
<div id="createScr" class="screen">
  <div class="box">
    <h1>إنشاء غرفة</h1>
    <p class="sub">إنت هتبقى الأدمن وتتحكم في الفيديو</p>
    <label>id الغرفة</label>
    <div class="row"><input type="text" id="cRoom" placeholder="مثلاً: anime-night" autocomplete="off"><button class="btn sec" style="width:auto;margin:0;padding:0 14px" id="rand" title="عشوائي">🎲</button></div>
    <label>اسمك</label>
    <input type="text" id="cName" placeholder="اسمك" maxlength="30">
    <label>رابط الفيديو المباشر</label>
    <input type="url" id="cUrl" placeholder="https://.../episode1.mp4" dir="ltr">
    <p class="hint">لازم رابط مباشر للملف (mp4 / webm / m3u8). روابط يوتيوب أو صفحات المواقع مش هتشتغل.</p>
    <div class="err" id="cErr"></div>
    <button class="btn" id="doCreate">ابدأ الغرفة</button>
    <button class="btn sec" data-back>رجوع</button>
  </div>
</div>

<!-- انضمام -->
<div id="joinScr" class="screen">
  <div class="box">
    <h1>انضمام لغرفة</h1>
    <p class="sub">اكتب id الغرفة اللي صاحبك بعتهولك</p>
    <label>id الغرفة</label>
    <input type="text" id="jRoom" placeholder="id الغرفة" autocomplete="off">
    <label>اسمك</label>
    <input type="text" id="jName" placeholder="اسمك" maxlength="30">
    <div class="err" id="jErr"></div>
    <button class="btn" id="doJoin">انضمام</button>
    <button class="btn sec" data-back>رجوع</button>
  </div>
</div>

<!-- الغرفة -->
<div id="roomScr" class="screen">
  <div class="top">
    <span class="chip">الغرفة: <b id="rId"></b></span>
    <span class="chip">👥 <b id="rCount">1</b></span>
    <button id="copyLink">📋 نسخ رابط الدعوة</button>
    <button id="changeUrl" style="display:none">🔗 تغيير الفيديو</button>
    <button id="leave">خروج</button>
  </div>
  <div class="grid">
    <div>
      <div class="player" id="player">
        <video id="v" playsinline preload="auto"></video>
        <div class="tap" id="tap"><button id="tapBtn">▶ اضغط لبدء المشاهدة</button></div>
        <div class="bar">
          <button id="back" title="رجوع 10 ثواني">⏪</button>
          <button id="pp" title="تشغيل / إيقاف">▶</button>
          <button id="fwd" title="تقديم 10 ثواني">⏩</button>
          <input type="range" id="seek" min="0" max="0" step="0.1" value="0">
          <span id="tm">0:00 / 0:00</span>
          <button id="mute">🔊</button>
          <input type="range" id="vol" min="0" max="1" step="0.05" value="1">
          <button id="fs" title="ملء الشاشة">⛶</button>
        </div>
      </div>
      <div class="role" id="role"></div>
    </div>
    <div class="side">
      <div class="users" id="users"></div>
      <button class="micbtn" id="mic">🎤 شغّل المايك</button>
      <div id="msgs"></div>
      <form class="send" id="chatForm">
        <input type="text" id="chatIn" placeholder="اكتب رسالة..." maxlength="500" autocomplete="off">
        <button>إرسال</button>
      </form>
    </div>
  </div>
  <div id="audios"></div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const show = (id) => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('on')); $(id).classList.add('on'); };
const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return (h? h+':'+String(m).padStart(2,'0') : m) + ':' + String(x).padStart(2,'0'); };

// ---------- التنقل ----------
$('goCreate').onclick = () => show('createScr');
$('goJoin').onclick = () => show('joinScr');
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => show('home'));
$('rand').onclick = () => $('cRoom').value = 'room-' + Math.random().toString(36).slice(2, 7);
const savedName = localStorage.getItem('wp_name') || '';
$('cName').value = $('jName').value = savedName;
const qRoom = new URLSearchParams(location.search).get('room');
if (qRoom) { $('jRoom').value = qRoom; show('joinScr'); }

// ---------- WebSocket ----------
let ws, me = { id:null, admin:false, name:'' }, users = [], roomId = '';
function connect(first) {
  return new Promise((res, rej) => {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws.onopen = () => { ws.send(JSON.stringify(first)); res(); };
    ws.onmessage = (e) => onMsg(JSON.parse(e.data));
    ws.onclose = () => { if ($('roomScr').classList.contains('on')) addSys('⚠️ انقطع الاتصال بالسيرفر. حدّث الصفحة.'); };
    ws.onerror = rej;
  });
}
const tx = (o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));

$('doCreate').onclick = () => {
  const name = $('cName').value.trim(); localStorage.setItem('wp_name', name);
  $('cErr').textContent = '';
  connect({ t:'create', room:$('cRoom').value.trim(), name, url:$('cUrl').value.trim() }).catch(() => $('cErr').textContent = 'مقدرش أتصل بالسيرفر');
};
$('doJoin').onclick = () => {
  const name = $('jName').value.trim(); localStorage.setItem('wp_name', name);
  $('jErr').textContent = '';
  connect({ t:'join', room:$('jRoom').value.trim(), name }).catch(() => $('jErr').textContent = 'مقدرش أتصل بالسيرفر');
};

function onMsg(m) {
  switch (m.t) {
    case 'error': {
      const e = $('createScr').classList.contains('on') ? $('cErr') : $('jErr');
      if ($('roomScr').classList.contains('on')) alert(m.msg); else e.textContent = m.msg;
      break;
    }
    case 'joined':
      me.id = m.id; me.admin = m.admin; roomId = m.room; users = m.users;
      me.name = (users.find(u => u.id === me.id) || {}).name;
      $('rId').textContent = roomId;
      show('roomScr');
      setVideo(m.url, m.state);
      renderUsers(); updateRole();
      break;
    case 'users': {
      users = m.users;
      const mine = users.find(u => u.id === me.id);
      if (mine && mine.admin !== me.admin) { me.admin = mine.admin; updateRole(); }
      renderUsers(); voiceSync();
      break;
    }
    case 'state': applyState(m); break;
    case 'url': setVideo(m.url, m.state); break;
    case 'chat': addChat(m); break;
    case 'sys': addSys(m.text); break;
    case 'signal': onSignal(m.from, m.data); break;
  }
}

// ---------- الفيديو والتزامن ----------
const v = $('v');
let pending = null, hls = null, scrubbing = false;

function setVideo(url, state) {
  pending = state;
  if (hls) { hls.destroy(); hls = null; }
  const isHls = /\.m3u8(\?|$)/i.test(url);
  if (isHls && !v.canPlayType('application/vnd.apple.mpegurl')) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1';
    s.onload = () => { hls = new Hls(); hls.loadSource(url); hls.attachMedia(v); };
    s.onerror = () => addSys('⚠️ مقدرتش أحمّل مشغّل HLS');
    document.head.appendChild(s);
  } else { v.src = url; }
  v.load();
}
v.onerror = () => addSys('⚠️ الفيديو مش بيشتغل. اتأكد إن الرابط مباشر وإنه https لو الموقع https.');
v.onloadedmetadata = () => { $('seek').max = v.duration || 0; if (pending) { applyState(pending); pending = null; } };

function applyState(s) {
  if (v.readyState < 1) { pending = s; return; }
  if (Math.abs(v.currentTime - s.time) > 1.2) v.currentTime = s.time;
  if (s.playing && v.paused) tryPlay();
  else if (!s.playing && !v.paused) v.pause();
}
function tryPlay() { v.play().then(() => $('tap').classList.remove('on')).catch(() => $('tap').classList.add('on')); }
$('tapBtn').onclick = () => { $('tap').classList.remove('on'); tryPlay(); };

// أدوات التحكم (الأدمن فقط)
const ctl = (action, time) => { tx({ t:'control', action, time }); };
$('pp').onclick = () => { if (!me.admin) return; if (v.paused) { v.play().catch(()=>{}); ctl('play', v.currentTime); } else { v.pause(); ctl('pause', v.currentTime); } };
$('back').onclick = () => { if (!me.admin) return; v.currentTime = Math.max(0, v.currentTime - 10); ctl('seek', v.currentTime); };
$('fwd').onclick = () => { if (!me.admin) return; v.currentTime = Math.min(v.duration || 1e9, v.currentTime + 10); ctl('seek', v.currentTime); };
$('seek').oninput = () => { scrubbing = true; };
$('seek').onchange = () => { scrubbing = false; if (!me.admin) return; v.currentTime = +$('seek').value; ctl('seek', v.currentTime); };

// تحكم محلي لكل شخص (صوت + ملء الشاشة)
$('vol').oninput = () => { v.volume = +$('vol').value; v.muted = false; $('mute').textContent = v.volume ? '🔊' : '🔇'; };
$('mute').onclick = () => { v.muted = !v.muted; $('mute').textContent = v.muted ? '🔇' : '🔊'; };
$('fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : $('player').requestFullscreen?.();

v.ontimeupdate = () => { if (!scrubbing) $('seek').value = v.currentTime; $('tm').textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration); };
v.onplay = v.onpause = () => { $('pp').textContent = v.paused ? '▶' : '⏸'; };

// الأدمن يبعت نبض كل 4 ثواني لتصحيح أي فرق
setInterval(() => { if (me.admin && v.readyState >= 1) tx({ t:'control', action:'sync', time:v.currentTime, playing:!v.paused }); }, 4000);

function updateRole() {
  ['pp','back','fwd','seek'].forEach(id => $(id).disabled = !me.admin);
  $('changeUrl').style.display = me.admin ? '' : 'none';
  $('role').textContent = me.admin ? '👑 إنت الأدمن: التشغيل والتقديم والتأخير عندك وبيحصل عند الكل.' : 'الأدمن هو اللي بيتحكم في الفيديو.';
}
$('changeUrl').onclick = () => { const u = prompt('الرابط المباشر للفيديو الجديد:'); if (u) tx({ t:'setUrl', url:u.trim() }); };

// ---------- الغرفة ----------
function renderUsers() {
  $('rCount').textContent = users.length;
  const box = $('users'); box.textContent = '';
  users.forEach(u => {
    const d = document.createElement('div');
    d.textContent = (u.admin ? '👑 ' : '👤 ') + u.name + (u.id === me.id ? ' (إنت)' : '') + (u.mic ? ' 🎤' : '');
    box.appendChild(d);
  });
}
$('copyLink').onclick = () => {
  const link = location.origin + '/?room=' + encodeURIComponent(roomId);
  (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => addSys('تم نسخ رابط الدعوة'), () => prompt('انسخ الرابط:', link));
};
$('leave').onclick = () => location.href = location.pathname;

// ---------- الشات ----------
function addChat(m) {
  const d = document.createElement('div'); d.className = 'msg' + (m.id === me.id ? ' me' : '');
  const b = document.createElement('b'); b.textContent = m.from;
  const t = document.createElement('span'); t.textContent = m.text;
  d.append(b, t); pushMsg(d);
}
function addSys(text) { const d = document.createElement('div'); d.className = 'msg sys'; d.textContent = text; pushMsg(d); }
function pushMsg(d) { const b = $('msgs'); b.appendChild(d); b.scrollTop = b.scrollHeight; }
$('chatForm').onsubmit = (e) => { e.preventDefault(); const t = $('chatIn').value.trim(); if (t) tx({ t:'chat', text:t }); $('chatIn').value = ''; };

// ---------- المايك (WebRTC mesh) ----------
// كل واحد فاتح المايك بيعمل اتصال "إرسال" لكل باقي اللي في الغرفة، والباقي بيستقبل ويشغّل الصوت.
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
let localStream = null;
const sendPcs = {}, recvPcs = {};

$('mic').onclick = async () => {
  if (localStream) return micOff();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('المايك محتاج https أو localhost');
  try { localStream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true } }); }
  catch { return alert('مقدرتش أوصل للمايك. اتأكد من الإذن.'); }
  $('mic').classList.add('on'); $('mic').textContent = '🎤 المايك شغال (اضغط للإيقاف)';
  tx({ t:'mic', on:true });
  voiceSync();
};
function micOff() {
  localStream.getTracks().forEach(t => t.stop()); localStream = null;
  Object.keys(sendPcs).forEach(id => { tx({ t:'signal', to:id, data:{ kind:'bye' } }); closeSend(id); });
  $('mic').classList.remove('on'); $('mic').textContent = '🎤 شغّل المايك';
  tx({ t:'mic', on:false });
}
function closeSend(id) { sendPcs[id]?.close(); delete sendPcs[id]; }
function closeRecv(id) { recvPcs[id]?.close(); delete recvPcs[id]; document.getElementById('a-' + id)?.remove(); }

function voiceSync() {
  const ids = new Set(users.map(u => u.id));
  Object.keys(sendPcs).forEach(id => { if (!ids.has(id)) closeSend(id); });
  Object.keys(recvPcs).forEach(id => { if (!ids.has(id)) closeRecv(id); });
  if (!localStream) return;
  users.forEach(u => { if (u.id !== me.id && !sendPcs[u.id]) connectTo(u.id); });
}
async function connectTo(id) {
  const pc = new RTCPeerConnection(ICE); sendPcs[id] = pc; pc._q = [];
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.onicecandidate = (e) => e.candidate && tx({ t:'signal', to:id, data:{ kind:'ice', role:'sender', cand:e.candidate } });
  const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
  tx({ t:'signal', to:id, data:{ kind:'offer', sdp:pc.localDescription } });
}
async function flush(pc) { for (const c of pc._q) await pc.addIceCandidate(c).catch(()=>{}); pc._q = []; }

async function onSignal(from, d) {
  if (d.kind === 'offer') {
    closeRecv(from);
    const pc = new RTCPeerConnection(ICE); recvPcs[from] = pc; pc._q = [];
    pc.ontrack = (e) => {
      let a = document.getElementById('a-' + from);
      if (!a) { a = document.createElement('audio'); a.id = 'a-' + from; a.autoplay = true; $('audios').appendChild(a); }
      a.srcObject = e.streams[0]; a.play().catch(()=>{});
    };
    pc.onicecandidate = (e) => e.candidate && tx({ t:'signal', to:from, data:{ kind:'ice', role:'receiver', cand:e.candidate } });
    await pc.setRemoteDescription(d.sdp); await flush(pc);
    const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
    tx({ t:'signal', to:from, data:{ kind:'answer', sdp:pc.localDescription } });
  } else if (d.kind === 'answer') {
    const pc = sendPcs[from]; if (!pc) return;
    await pc.setRemoteDescription(d.sdp); await flush(pc);
  } else if (d.kind === 'ice') {
    const pc = d.role === 'sender' ? recvPcs[from] : sendPcs[from]; if (!pc) return;
    if (pc.remoteDescription) pc.addIceCandidate(d.cand).catch(()=>{}); else pc._q.push(d.cand);
  } else if (d.kind === 'bye') closeRecv(from);
}
</script>
</body>
</html>
`, 'utf8');

// ---------- HTTP (صفحة واحدة مدمجة في الملف) ----------
const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }
  res.writeHead(404); res.end('Not found');
});

// ---------- WebSocket (RFC 6455 مبسّط) ----------
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_PAYLOAD = 1 << 20;

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || req.headers.upgrade?.toLowerCase() !== 'websocket') return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const client = { socket, buf: Buffer.alloc(0), frag: [], id: crypto.randomBytes(4).toString('hex'), alive: true, room: null };
  socket.on('data', (chunk) => { client.buf = Buffer.concat([client.buf, chunk]); parse(client); });
  socket.on('close', () => leave(client));
  socket.on('error', () => socket.destroy());
});

function frame(opcode, payload) {
  const len = payload.length;
  let head;
  if (len < 126) head = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, payload]);
}

function send(c, obj) {
  if (c.socket.destroyed) return;
  c.socket.write(frame(0x1, Buffer.from(JSON.stringify(obj))));
}

function parse(c) {
  while (c.buf.length >= 2) {
    const b0 = c.buf[0], b1 = c.buf[1];
    const fin = !!(b0 & 0x80), op = b0 & 0x0f, masked = !!(b1 & 0x80);
    let len = b1 & 0x7f, off = 2;
    if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10; }
    if (len > MAX_PAYLOAD) return c.socket.destroy();
    const total = off + (masked ? 4 : 0) + len;
    if (c.buf.length < total) return;
    let payload = Buffer.from(c.buf.subarray(off + (masked ? 4 : 0), total));
    if (masked) { const m = c.buf.subarray(off, off + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
    c.buf = c.buf.subarray(total);

    if (op === 0x8) { c.socket.end(frame(0x8, Buffer.alloc(0))); return; }
    if (op === 0x9) { c.socket.write(frame(0xA, payload)); continue; }
    if (op === 0xA) { c.alive = true; continue; }
    if (op === 0x1 || op === 0x0) {
      c.frag.push(payload);
      if (fin) {
        const text = Buffer.concat(c.frag).toString('utf8');
        c.frag = [];
        let msg; try { msg = JSON.parse(text); } catch { continue; }
        try { handle(c, msg); } catch (e) { console.error(e); }
      }
    }
  }
}

// keep-alive
setInterval(() => {
  for (const room of rooms.values()) for (const c of room.clients.values()) {
    if (!c.alive) { c.socket.destroy(); continue; }
    c.alive = false;
    c.socket.write(frame(0x9, Buffer.alloc(0)));
  }
}, 25000);

// ---------- منطق الغرف ----------
const rooms = new Map(); // id -> { id, url, state:{playing,time,at}, adminId, clients: Map }

const clean = (s, n) => String(s || '').trim().slice(0, n);
const validUrl = (u) => /^https?:\/\/\S+$/i.test(u);

function curTime(room) {
  const s = room.state;
  return s.playing ? s.time + (Date.now() - s.at) / 1000 : s.time;
}
function snapshot(room) { return { playing: room.state.playing, time: curTime(room) }; }
function userList(room) {
  return [...room.clients.values()].map((c) => ({ id: c.id, name: c.name, admin: c.id === room.adminId, mic: !!c.mic }));
}
function broadcast(room, obj, exceptId) {
  for (const c of room.clients.values()) if (c.id !== exceptId) send(c, obj);
}
function sys(room, text) { broadcast(room, { t: 'sys', text }); }

function enter(c, room, name) {
  c.name = name; c.room = room; c.mic = false;
  room.clients.set(c.id, c);
  send(c, { t: 'joined', id: c.id, room: room.id, url: room.url, state: snapshot(room), users: userList(room), admin: c.id === room.adminId });
  broadcast(room, { t: 'users', users: userList(room) });
  sys(room, name + ' دخل الغرفة');
}

function leave(c) {
  const room = c.room;
  if (!room) return;
  c.room = null;
  room.clients.delete(c.id);
  if (room.clients.size === 0) { rooms.delete(room.id); return; }
  if (room.adminId === c.id) {
    room.adminId = room.clients.keys().next().value; // أقدم عضو يبقى أدمن
    sys(room, room.clients.get(room.adminId).name + ' بقى هو الأدمن');
  }
  broadcast(room, { t: 'users', users: userList(room) });
  sys(room, c.name + ' خرج من الغرفة');
}

function handle(c, m) {
  switch (m.t) {
    case 'create': {
      const id = clean(m.room, 40), name = clean(m.name, 30), url = clean(m.url, 2000);
      if (c.room) return;
      if (!id || !name) return send(c, { t: 'error', msg: 'اكتب id الغرفة واسمك' });
      if (!validUrl(url)) return send(c, { t: 'error', msg: 'رابط الفيديو لازم يبدأ بـ http:// أو https://' });
      if (rooms.has(id)) return send(c, { t: 'error', msg: 'الـ id ده مستخدم، اختار id تاني' });
      const room = { id, url, state: { playing: false, time: 0, at: Date.now() }, adminId: c.id, clients: new Map() };
      rooms.set(id, room);
      enter(c, room, name);
      break;
    }
    case 'join': {
      const id = clean(m.room, 40), name = clean(m.name, 30);
      if (c.room) return;
      if (!id || !name) return send(c, { t: 'error', msg: 'اكتب id الغرفة واسمك' });
      const room = rooms.get(id);
      if (!room) return send(c, { t: 'error', msg: 'مفيش غرفة بالـ id ده' });
      enter(c, room, name);
      break;
    }
    case 'control': { // الأدمن بس
      const room = c.room;
      if (!room || room.adminId !== c.id) return;
      const time = Number(m.time);
      if (!Number.isFinite(time) || time < 0) return;
      if (m.action === 'play') room.state = { playing: true, time, at: Date.now() };
      else if (m.action === 'pause') room.state = { playing: false, time, at: Date.now() };
      else if (m.action === 'seek') room.state = { playing: room.state.playing, time, at: Date.now() };
      else if (m.action === 'sync') room.state = { playing: !!m.playing, time, at: Date.now() };
      else return;
      broadcast(room, { t: 'state', action: m.action, ...snapshot(room) }, c.id);
      break;
    }
    case 'setUrl': {
      const room = c.room;
      if (!room || room.adminId !== c.id) return;
      const url = clean(m.url, 2000);
      if (!validUrl(url)) return send(c, { t: 'error', msg: 'رابط غير صالح' });
      room.url = url;
      room.state = { playing: false, time: 0, at: Date.now() };
      broadcast(room, { t: 'url', url, state: snapshot(room) });
      sys(room, 'الأدمن غيّر الفيديو');
      break;
    }
    case 'chat': {
      const room = c.room; const text = clean(m.text, 500);
      if (!room || !text) return;
      broadcast(room, { t: 'chat', from: c.name, id: c.id, text, ts: Date.now() });
      break;
    }
    case 'mic': {
      const room = c.room; if (!room) return;
      c.mic = !!m.on;
      broadcast(room, { t: 'users', users: userList(room) });
      break;
    }
    case 'signal': { // WebRTC signaling للمايك
      const room = c.room; if (!room) return;
      const target = room.clients.get(String(m.to));
      if (target) send(target, { t: 'signal', from: c.id, data: m.data });
      break;
    }
  }
}

server.listen(PORT, () => console.log('Watch Party شغال على http://localhost:' + PORT));
