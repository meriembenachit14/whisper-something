/* =========================================================
   main.js — controls hearts, clouds, toolbar, sounds, auth
   ========================================================= */

/* ========== CONFIG ========== */
/* Tweak these values to change behaviour */
const CONFIG = {
  hearts: {
    intervalMs: 850,   // spawn attempt every X ms (lower = more hearts)
    perBurst: 1        // hearts created per interval (increase for denser hearts)
  },
  cloud: {
    count: 4,          // how many visible clouds (JS will create if missing)
    baseDuration: 40   // base seconds for cloud animations (randomized)
  },
  typingBeepDataURL: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=', // tiny click
  sendBeepDataURL:   'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=', // tiny confirmation
  adminPass: 'letmein123' // static admin password (client-side). Change to your preferred password.
};

/* ========== SAFE DOM HELPERS ========== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ========== STARTUP ========== */
window.addEventListener('DOMContentLoaded', () => {
  ensureClouds();      // create clouds if missing and apply animation timing
  initCounters();      // visits / sends counters (localStorage)
  initHearts();        // start heart generator
  initToolbar();       // music / dark / help
  initSounds();        // create typing + send sounds
  initForm();          // form autosave + submit behavior
  maybeRequireAdmin(); // if on admin page, require password
});

/* =========================
   CLOUDS
   ========================= */
function ensureClouds(){
  try {
    const existing = $$('.cloud');
    const need = Math.max(0, CONFIG.cloud.count - existing.length);
    for(let i=0;i<need;i++){
      spawnCloud(i);
    }
    // Normalize animation durations for all clouds
    $$('.cloud').forEach((c, idx) => {
      const dur = CONFIG.cloud.baseDuration * (0.8 + Math.random()*0.6); // randomized
      c.style.animation = `floatClouds ${dur}s linear infinite`;
      // keep left starting offset negative so they float in
      if(!c.style.left) c.style.left = (-120 - Math.random()*120) + 'px';
    });
  } catch(e) { /* fail silently */ }
}

function spawnCloud(index){
  const c = document.createElement('div');
  c.className = 'cloud';
  // add variant class (optional styling)
  c.classList.add(`c${(index % 4) + 1}`);
  c.style.top = (8 + Math.random()*78) + 'vh';
  c.style.left = (-120 - Math.random()*180) + 'px';
  document.body.appendChild(c);
}

/* =========================
   HEARTS
   ========================= */
let heartTimer = null;
function initHearts(){
  // stop old timer if any
  if(heartTimer) clearInterval(heartTimer);
  heartTimer = setInterval(() => {
    for(let i=0;i<CONFIG.hearts.perBurst;i++){
      spawnHeart();
    }
  }, Math.max(60, CONFIG.hearts.intervalMs));
}

function spawnHeart(){
  const h = document.createElement('div');
  h.className = 'floating-heart';
  // random horizontal position, avoid edges
  const left = Math.max(4, Math.min(96, Math.random()*100));
  h.style.left = left + 'vw';
  // random animation duration override (adds variety)
  h.style.animationDuration = (3 + Math.random()*4) + 's';
  document.body.appendChild(h);
  // cleanup after animation completes
  setTimeout(()=> {
    h.remove();
  }, 9000);
}

/* =========================
   SOUNDS (typing + send)
   ========================= */
let typingAudio = null;
let sendAudio = null;

function initSounds(){
  // create <audio> elements if not present
  if(!$('#typeBeep')){
    const a = document.createElement('audio');
    a.id = 'typeBeep';
    a.preload = 'auto';
    a.src = CONFIG.typingBeepDataURL;
    document.body.appendChild(a);
  }
  if(!$('#sendBeep')){
    const a2 = document.createElement('audio');
    a2.id = 'sendBeep';
    a2.preload = 'auto';
    a2.src = CONFIG.sendBeepDataURL;
    document.body.appendChild(a2);
  }

  typingAudio = $('#typeBeep');
  sendAudio = $('#sendBeep');

  // attach typing sound to inputs/textareas (non-intrusive)
  $$('input[type="text"], textarea').forEach(el => {
    el.addEventListener('input', () => {
      try { typingAudio.currentTime = 0; typingAudio.volume = 0.16; typingAudio.play(); } catch(e) {}
    });
  });
}

/* =========================
   COUNTERS: visits & sends (localStorage)
   ========================= */
function initCounters(){
  try {
    const visitsKey = 'tw_visits_v2';
    let visits = Number(localStorage.getItem(visitsKey) || 0);
    visits++;
    localStorage.setItem(visitsKey, visits);
    const vEl = $('#visitCount') || $('#visitCountFallback');
    if(vEl) vEl.textContent = visits;

    const sendsKey = 'tw_sends_v2';
    let sends = Number(localStorage.getItem(sendsKey) || 0);
    const sEl = $('#sentCount');
    if(sEl) sEl.textContent = sends;
  } catch(e) {}
}

/* =========================
   FORM: autosave + submit (plays send sound)
   ========================= */
function initForm(){
  const form = $('#tinyForm');
  if(!form) return;

  const sendsKey = 'tw_sends_v2';
  const sentEl = $('#sentCount');
  const clearBtn = $('#clearBtn');
  const textarea = $('#message');

  // Clear button
  if(clearBtn) {
    clearBtn.addEventListener('click', () => {
      try { $('#codename').value = ''; } catch(e){}
      if(textarea) textarea.value = '';
      localStorage.removeItem('tinyDraft_v1');
      textarea && textarea.focus();
    });
  }

  // autosave draft
  if(textarea) {
    const draftKey = 'tinyDraft_v1';
    const saved = localStorage.getItem(draftKey);
    if(saved) textarea.value = saved;
    textarea.addEventListener('input', () => {
      localStorage.setItem(draftKey, textarea.value);
    });
  }

  // Submit: play send sound + celebration then submit
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    // play send sound
    try { sendAudio.currentTime = 0; sendAudio.volume = 0.22; sendAudio.play(); } catch(e){}
    // increment sends counter
    let sends = Number(localStorage.getItem(sendsKey) || 0);
    sends++; localStorage.setItem(sendsKey, sends);
    if(sentEl) sentEl.textContent = sends;
    localStorage.removeItem('tinyDraft_v1');

    // celebration (hearts + confetti)
    spawnHeartBurst(10);
    spawnConfetti(20);

    // short delay so user hears the send sound & sees animation
    setTimeout(()=> form.submit(), 700);
  });
}

/* helper for burst */
function spawnHeartBurst(n){
  for(let i=0;i<n;i++){
    setTimeout(() => spawnHeart(), i*70);
  }
}

/* small confetti (rectangles) */
function spawnConfetti(n){
  const colors = ['#ff9edb','#c79aff','#ffd4f4','#fff6ea'];
  for(let i=0;i<n;i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.position = 'fixed';
    el.style.left = (6 + Math.random()*88) + 'vw';
    el.style.top = (-10 - Math.random()*20) + 'vh';
    el.style.width = (6 + Math.random()*10) + 'px';
    el.style.height = el.style.width;
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.borderRadius = '2px';
    el.style.zIndex = 1400;
    el.style.opacity = 0.95;
    el.style.animation = `confettiDrop ${900 + Math.random()*700}ms forwards ease`;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2000);
  }
}
/* inject confetti animation if not present */
(function(){ const id='__confetti_kf'; if(!document.getElementById(id)){ const s=document.createElement('style'); s.id=id; s.innerHTML='@keyframes confettiDrop{0%{transform:translateY(0);opacity:1}100%{transform:translateY(110vh) rotate(200deg);opacity:0}}'; document.head.appendChild(s);} })();

/* =========================
   TOOLBAR: music, dark, help
   ========================= */
function initToolbar(){
  const darkToggle = $('#darkToggle');
  const musicToggle = $('#musicToggle');
  const helpBtn = $('#helpBtn');
  const helpModal = $('#helpModal');
  const helpClose = $('#helpClose');
  const bgm = $('#bgm');

  // music toggle
  if(musicToggle && bgm){
    musicToggle.addEventListener('click', () => {
      if(bgm.paused){ bgm.play().catch(()=>{}); musicToggle.textContent = '🔈'; }
      else { bgm.pause(); musicToggle.textContent = '🔊'; }
    });
  }

  // dark toggle
  if(darkToggle){
    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const pressed = document.body.classList.contains('dark');
      darkToggle.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  // help modal
  if(helpBtn && helpModal){
    helpBtn.addEventListener('click', ()=> helpModal.classList.remove('hidden'));
    if(helpClose) helpClose.addEventListener('click', ()=> helpModal.classList.add('hidden'));
    helpModal.addEventListener('click', (ev) => { if(ev.target===helpModal) helpModal.classList.add('hidden'); });
  }
}

/* =========================
   ADMIN GATE (client-side)
   =========================
   - Simple prompt-based gate
   - Not secure for production (client-side only)
   - For stronger auth: use Firebase or server side checks
*/
function maybeRequireAdmin(){
  try {
    // only run on admin page (path contains 'admin' or filename admin.html)
    const path = (location.pathname || '').toLowerCase();
    if(!path.includes('admin')) return;

    // if previously authenticated in this session, skip prompt
    if(sessionStorage.getItem('tw_admin_auth') === '1') return;

    // prompt for password (simple)
    const pw = prompt('Admin access — enter password:');
    if(pw === CONFIG.adminPass){
      sessionStorage.setItem('tw_admin_auth','1');
      return;
    } else {
      alert('Incorrect admin password. Redirecting to home.');
      location.href = 'index.html';
    }
  } catch(e) { /* fail quietly */ }
}

/* =========================
   SAFETY: swallow non-critical errors
   ========================= */
window.addEventListener('error', (ev) => {
  // do nothing — this prevents minor JS errors from stopping other pages
  // console.debug('Non-fatal error caught by main.js', ev.message);
});
