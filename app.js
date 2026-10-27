/* Thesis Tracker v2 — logika halaman
   Acuan: docs/ARCHITECTURE.md bagian 2, 2a (PWA), 2b (bahasa). Urutan bagian:
   1 config · 2 util · 3 api, sesi & salinan offline · 4 state & hitung · 5 komponen · 6 views · 7 aksi UI · 8 router & init
   Aturan: semua teks antarmuka lewat t() dari i18n.js; semua teks dari data lewat esc();
   semua panggilan server lewat api.call(). */
'use strict';

/* =========================================================
   1. CONFIG
   ========================================================= */
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxzzjxSbVnCuCAVUy1zWdDUcuMh2ovlZeZKrsrHImHOQiAe1juPd-rvFE7s_LUSQe4/exec',
  VERSION: '2.1.0',
  TZ: 'Asia/Jakarta'
};


/* =========================================================
   2. UTIL
   ========================================================= */
/** Escape teks agar aman disisipkan ke HTML (isi maupun atribut). */
function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/** Tanggal hari ini (Jakarta) sebagai YYYY-MM-DD. */
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
/** Mengubah YYYY-MM-DD atau ISO menjadi Date (tengah hari Jakarta agar tidak bergeser hari). */
function toDate(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v);
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00+07:00') : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmt(v, opts) {
  const d = toDate(v);
  return d ? new Intl.DateTimeFormat(LOCALE(), Object.assign({ timeZone: CONFIG.TZ }, opts)).format(d) : '';
}
const fmtDate = (v) => fmt(v, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (v) => fmt(v, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtShortDateTime = (v) => fmt(v, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function fmtMonth(v) {
  const s = String(v || '');
  return fmt(/^\d{4}-\d{2}$/.test(s) ? s + '-15' : s, { month: 'long', year: 'numeric' }) || s;
}
/** Selisih hari dari hari ini ke tanggal (positif = masa depan). */
function daysFromToday(ymd) {
  const a = toDate(todayStr()), b = toDate(String(ymd).slice(0, 10));
  return a && b ? Math.round((b - a) / 86400000) : null;
}
/** "hari ini", "besok", "5 hari lagi", "lewat 3 hari" (atau versi English). */
function relDays(ymd) {
  const n = daysFromToday(ymd);
  if (n === null) return '';
  if (n === 0) return t('rel.today');
  if (n === 1) return t('rel.tomorrow');
  if (n === -1) return t('rel.yesterday');
  return n > 0 ? t('rel.in', { n: n }) : t('rel.ago', { n: Math.abs(n) });
}
const fmtNum = (n) => Number(n).toLocaleString(LOCALE());
function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }

/** Menyalin teks ke clipboard; mengembalikan true bila berhasil. */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* lanjut ke cara lama */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}


/* =========================================================
   3. API, SESI & SALINAN OFFLINE
   ========================================================= */
class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/** Menerjemahkan error server lewat key/params (ARCHITECTURE 2b); cadangan: pesan asli. */
function translateErr(err) {
  if (err.key && hasT('err.' + err.key)) {
    const p = Object.assign({}, err.params || {});
    if (p.field) p.field = hasT('field.' + p.field) ? t('field.' + p.field) : p.field;
    return t('err.' + err.key, p);
  }
  return err.message || t('err.server');
}

const session = {
  token: null, remember: false,
  load() {
    try {
      this.token = sessionStorage.getItem('tt_token') || localStorage.getItem('tt_token');
      this.remember = !!localStorage.getItem('tt_token');
    } catch (e) { this.token = null; }
  },
  save(token, remember) {
    this.token = token; this.remember = remember;
    try {
      sessionStorage.removeItem('tt_token'); localStorage.removeItem('tt_token');
      (remember ? localStorage : sessionStorage).setItem('tt_token', token);
      if (!remember) snapshot.clear();
    } catch (e) { /* penyimpanan browser tidak tersedia: sesi hanya hidup selama halaman terbuka */ }
  },
  clear() {
    this.token = null; this.remember = false;
    try { sessionStorage.removeItem('tt_token'); localStorage.removeItem('tt_token'); } catch (e) { /* abaikan */ }
    snapshot.clear();
  }
};

/* Salinan baca-saja untuk mode offline (K10): hanya bila "Ingat perangkat ini". */
const snapshot = {
  KEY: 'tt_snapshot',
  save() {
    if (!session.remember || state.offline || !state.data || !state.user) return;
    try { localStorage.setItem(this.KEY, JSON.stringify({ at: Date.now(), user: state.user, data: state.data })); } catch (e) { /* penuh atau dilarang: abaikan */ }
  },
  load() {
    try { const v = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return v && v.data && v.user ? v : null; } catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) { /* abaikan */ } }
};

// Aksi yang hanya membaca atau mengurus sesi: tidak memunculkan banner sinkronisasi
const READ_ACTIONS = ['auth.login', 'auth.logout', 'auth.me', 'data.bootstrap', 'admin.users.list'];

const api = {
  /** Satu-satunya pintu ke server. Menambahkan token, menerjemahkan error,
   *  menolak perubahan saat offline, dan menampilkan banner sinkronisasi. */
  async call(action, payload) {
    if (READ_ACTIONS.indexOf(action) >= 0) return this.raw(action, payload);
    if (state.offline) throw new ApiError('OFFLINE', t('err.offline'));
    const tiket = sync.start();
    try {
      const data = await this.raw(action, payload);
      sync.done(tiket);
      return data;
    } catch (e) {
      sync.fail(tiket, e, () => api.raw(action, payload));
      throw e;
    }
  },
  async raw(action, payload) {
    let res;
    try {
      const r = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        // nama aksi ditulis terakhir agar tidak bisa tertimpa isi payload
        body: JSON.stringify(Object.assign({ token: session.token || undefined }, payload || {}, { action: action }))
      });
      res = await r.json();
    } catch (e) {
      throw new ApiError('NETWORK', t('err.network'));
    }
    if (!res || !res.ok) {
      const err = (res && res.error) || { code: 'SERVER', key: 'server' };
      if (err.code === 'AUTH_REQUIRED' && action !== 'auth.login') {
        session.clear();
        Object.assign(state, { user: null, data: null, offline: false, phase: 'login' });
        render();
        showBanner(t('err.session'), 'orange');
      }
      throw new ApiError(err.code, translateErr(err));
    }
    return res.data;
  }
};


/* =========================================================
   4. STATE & FUNGSI HITUNG
   ========================================================= */
const state = {
  phase: 'boot',        // boot | login | app | error
  user: null,
  data: null,
  users: null,          // daftar akun (hanya pemilik, dimuat di halaman Kelola Akses)
  offline: false,       // sedang menampilkan salinan offline (K10)
  snapshotAt: 0,
  loadError: '', loadErrorCode: '',
  todoFilter: 'semua',
  papanStage: 0,
  openPrompts: new Set()
};

const STAGE_COLORS = ['var(--gray)', 'var(--orange)', 'var(--yellow)', 'var(--teal)', 'var(--green)'];
const STAGES = [0, 1, 2, 3, 4];
const stageLabel = (v) => t('stage.' + (Number(v) || 0));
const FB_COLORS = { open: 'var(--red)', doing: 'var(--orange)', done: 'var(--green)' };
const fbLabel = (s) => t('fb.' + (FB_COLORS[s] ? s : 'open'));
const FROM_KEYS = ['P1', 'P2', 'PENGUJI'];
const fromLabel = (k) => FROM_KEYS.indexOf(k) >= 0 ? t('from.' + k) : k;
const DOCS = { CN: 'var(--teal)', PROP: 'var(--indigo)', TESIS: 'var(--purple)' };
const docLabel = (k) => DOCS[k] ? t('doc.' + k) : k;
const VERIFY = { '': 'var(--gray)', 'perlu-cek': 'var(--orange)', 'terverifikasi': 'var(--green)' };
const verifyLabel = (k) => t('verify.' + (k || 'none'));
const REQ_STAGES = ['sempro', 'semhas', 'sidang'];
const HELP_TYPES = ['Tutor', 'Kritik', 'Cek logika', 'Lainnya'];          // nilai tersimpan di Sheet
const helpLabel = (v) => hasT('help.' + v) ? t('help.' + v) : v;
const MODES = ['Tatap muka', 'Daring'];                                   // nilai tersimpan di Sheet
const modeLabel = (v) => hasT('mode.' + v) ? t('mode.' + v) : v;
const BIMBINGAN_MIN = 10, SEMPRO_ATTEND_MIN = 5, TOTAL_ATTEND_MIN = 10;

const isOwner = () => !!state.user && state.user.role === 'owner';
const D = () => state.data || {};
const rows = (tb) => D()[tb] || [];
const byId = (tb, id) => rows(tb).find(r => Number(r.id) === Number(id));

/** Mengganti baris di state dengan versi dari server (atau menambahkannya). */
function replaceRow(tb, row) {
  const list = rows(tb);
  const i = list.findIndex(r => Number(r.id) === Number(row.id));
  if (i >= 0) list[i] = row; else list.push(row);
}

function sectionsOf(chId) { return rows('sections').filter(s => Number(s.chapter_id) === Number(chId)); }
/** Progres bab = rata-rata nilai tahap subbab ÷ 4 (PRD aturan hitung). */
function chapterProgress(chId) {
  const secs = sectionsOf(chId);
  if (!secs.length) return { pct: 0, final: 0, total: 0 };
  const sum = secs.reduce((a, s) => a + (Number(s.stage) || 0), 0);
  return { pct: Math.round(sum / (secs.length * 4) * 100), final: secs.filter(s => Number(s.stage) === 4).length, total: secs.length };
}
const isOpenFb = (f) => f.status !== 'done';
function openFeedback(chId) {
  return rows('feedback').filter(f => isOpenFb(f) && (chId === undefined || Number(f.chapter_id) === Number(chId)));
}
/** Terlambat = tenggat sudah lewat dan tahap belum Final. */
const isOverdue = (s) => !!s.due_date && Number(s.stage) < 4 && daysFromToday(s.due_date) < 0;
function overdueSections() {
  return rows('sections').filter(isOverdue).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
}
function chapterLabel(ch) {
  if (!ch) return t('ch.notFound');
  return ch.number ? t('ch.label', { n: ch.number, title: ch.title }) : ch.title;
}
function sectionLabel(s) { return (s.number ? s.number + ' ' : '') + s.title; }
const bimbinganCount = () => rows('bimbingan').length;
const semproAttendance = () => rows('attendance').filter(a => a.type === 'sempro').length;
const totalAttendance = () => rows('attendance').length;
function reqProgress(stage) {
  const list = rows('requirements').filter(r => r.stage === stage);
  return { done: list.filter(r => r.done).length, total: list.length };
}

/* PWA: status pemasangan */
let installPrompt = null;
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);


/* =========================================================
   5. KOMPONEN
   ========================================================= */
/* Ikon garis 24×24, gaya mengikuti Lucide (stroke 1.75). */
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2Z"/><path d="M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8Z"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  checklist: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1"/>',
  terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/>',
  grad: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'
};
function icon(name, cls) {
  return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
}

const cap = (label, c, extra) => '<span class="cap ' + (extra || '') + '" style="--c:' + c + '">' + esc(label) + '</span>';
const stageCap = (v) => cap(stageLabel(v), STAGE_COLORS[Number(v) || 0]);
function bar(pct) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return '<div class="bar"><div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><div class="fill' + (p >= 100 ? ' full' : '') + '" style="width:' + p + '%"></div></div><span class="pct">' + p + '%</span></div>';
}
function checkBtn(on, act, id, label) {
  const dis = isOwner() ? '' : ' disabled';
  return '<button class="check' + (on ? ' on' : '') + '" data-act="' + act + '" data-id="' + esc(id) + '" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + esc(label) + '"' + dis + '>' + icon('check') + '</button>';
}
function group(label, inner, foot) {
  return '<section class="group-wrap">' + (label ? '<h2 class="group-label">' + esc(label) + '</h2>' : '') +
    '<div class="list">' + inner + '</div>' + (foot ? '<p class="group-foot">' + foot + '</p>' : '') + '</section>';
}
function emptyState(ic, title, text, action) {
  return '<div class="empty">' + icon(ic) + '<h2 class="t-3">' + esc(title) + '</h2><p class="t-foot muted">' + esc(text) + '</p>' + (action || '') + '</div>';
}
/** Halaman yang tetap bisa diubah pembimbing (tanpa kapsul "Hanya baca"). */
const SUPERVISOR_WRITABLE = ['masukan', 'masukan/semua', 'akun', 'lainnya'];
let currentKey = 'ringkasan';
function pageHead(title, sub, tools) {
  const ro = (!isOwner() && state.user && SUPERVISOR_WRITABLE.indexOf(currentKey) < 0) ? cap(t('common.readOnly'), 'var(--gray)', 'readonly-cap') : '';
  return '<header class="page-head"><div><h1 class="t-large">' + esc(title) + ro + '</h1>' +
    (sub ? '<p class="sub t-sub muted">' + sub + '</p>' : '') + '</div>' +
    (tools ? '<div class="page-tools">' + tools + '</div>' : '') + '</header>';
}
function seg(items, current) {
  return '<nav class="seg" aria-label="' + esc(t('common.viewOptions')) + '">' + items.map(it =>
    '<a href="' + it[0] + '" class="' + (it[0] === current ? 'on' : '') + '"' + (it[0] === current ? ' aria-current="page"' : '') + '>' + esc(it[1]) + '</a>').join('') + '</nav>';
}

/* Banner melayang (pengganti alert) */
function showBanner(msg, color, sticky) {
  let area = $('.toast-area');
  if (!area) { area = document.createElement('div'); area.className = 'toast-area'; document.body.appendChild(area); }
  const el = document.createElement('div');
  el.className = 'banner'; el.setAttribute('role', 'alert'); el.style.setProperty('--c', 'var(--' + (color || 'red') + ')');
  el.innerHTML = icon(color === 'green' ? 'check' : 'alert') + '<div class="grow">' + esc(msg) + '</div><button type="button" aria-label="' + esc(t('common.close')) + '">' + icon('x') + '</button>';
  el.querySelector('button').addEventListener('click', () => el.remove());
  area.innerHTML = ''; area.appendChild(el);
  if (!sticky) setTimeout(() => el.remove(), color === 'red' ? 8000 : 4000);
}
function handleErr(e) {
  if (e && e.code === 'AUTH_REQUIRED') return; // sudah diarahkan ke halaman Masuk
  if (e && e.syncShown) return;                // sudah tampil di banner sinkronisasi
  showBanner((e && e.message) || t('err.generic'), e && e.code === 'OFFLINE' ? 'orange' : 'red');
}

/* Banner sinkronisasi (F19, K9)
   Persen adalah PERKIRAAN yang naik halus menuju ±90% selama menunggu server,
   karena progres satu permintaan ke Apps Script tidak bisa diukur.
   100% dan "Tersinkron" hanya tampil setelah server membalas sukses. */
const sync = {
  el: null, pending: 0, total: 0, shown: 0, t0: 0, raf: 0, hideTimer: 0, nextId: 1, failed: false,
  CIRC: 2 * Math.PI * 15,
  start() {
    clearTimeout(this.hideTimer);
    if (this.pending === 0) { this.total = 0; this.t0 = performance.now(); this.shown = 0; this.failed = false; }
    this.pending++; this.total++;
    this.draw('run');
    this.loop();
    return this.nextId++;
  },
  done() {
    this.pending = Math.max(0, this.pending - 1);
    if (this.failed) return; // biarkan banner gagal tetap tampil sampai ditutup atau dicoba lagi
    if (this.pending === 0) this.finish();
    else this.draw('run');
  },
  fail(tiket, err, ulang) {
    this.pending = Math.max(0, this.pending - 1);
    // Hanya masalah koneksi atau server yang ditampilkan di banner, dengan tombol "Coba lagi".
    if (err && (err.code === 'NETWORK' || err.code === 'SERVER')) {
      err.syncShown = true;
      this.failed = true;
      cancelAnimationFrame(this.raf);
      this.draw('fail', err.message, ulang);
    } else if (this.pending === 0) {
      this.hide(0);
    }
  },
  /** Perkiraan: mendekati 90% secara bertahap (konstanta waktu ±1,2 detik). */
  estimate() { return 90 * (1 - Math.exp(-(performance.now() - this.t0) / 1200)); },
  loop() {
    cancelAnimationFrame(this.raf);
    const step = () => {
      if (this.pending === 0 || this.failed) return;
      this.shown = Math.max(this.shown, this.estimate());
      this.setPct(this.shown);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  },
  finish() {
    cancelAnimationFrame(this.raf);
    this.shown = 100;
    this.draw('ok');
    this.hide(1500);
  },
  hide(ms) {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => { if (this.el) this.el.classList.remove('show'); }, ms);
  },
  mount() {
    if (this.el && this.el.isConnected) return;
    this.el = document.createElement('div');
    this.el.className = 'sync';
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
    this.el.innerHTML = '<div class="ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="trk" cx="18" cy="18" r="15"/><circle class="val" cx="18" cy="18" r="15"/></svg><span class="pct num">0%</span></div>' +
      '<div class="txt"><div class="t1 t-sub"></div><div class="t2 t-foot muted"></div></div><button type="button" class="btn btn-tinted retry" hidden></button><button type="button" class="icon-btn close" hidden>' + icon('x') + '</button>';
    document.body.appendChild(this.el);
    $('.close', this.el).addEventListener('click', () => this.hide(0));
  },
  setPct(p) {
    if (!this.el) return;
    const v = Math.max(0, Math.min(100, p));
    $('.val', this.el).style.strokeDashoffset = String(this.CIRC * (1 - v / 100));
    $('.pct', this.el).textContent = Math.floor(v) + '%';
  },
  draw(mode, pesan, ulang) {
    this.mount();
    const el = this.el;
    el.className = 'sync show ' + mode;
    $('.val', el).style.strokeDasharray = String(this.CIRC);
    const t1 = $('.t1', el), t2 = $('.t2', el), retry = $('.retry', el), close = $('.close', el);
    retry.textContent = t('common.retry'); close.setAttribute('aria-label', t('common.close'));
    retry.hidden = mode !== 'fail'; close.hidden = mode !== 'fail';
    if (mode === 'run') {
      t1.textContent = t('sync.running');
      t2.textContent = this.total > 1 ? t('sync.progressMany', { done: this.total - this.pending, total: this.total }) : t('sync.sending');
      this.setPct(this.shown);
    } else if (mode === 'ok') {
      t1.textContent = t('sync.done');
      t2.textContent = this.total > 1 ? t('sync.savedMany', { n: this.total }) : t('sync.saved');
      this.setPct(100);
    } else {
      t1.textContent = t('sync.failed');
      t2.textContent = pesan || t('common.retry');
      retry.onclick = async () => {
        const tiket = this.start();
        try {
          await ulang();
          this.done(tiket);
          await refreshData();
        } catch (e) { this.fail(tiket, e, ulang); if (!e.syncShown) handleErr(e); }
      };
    }
  }
};

/* Sheet: formulir yang muncul dari bawah (HP) atau dialog di tengah (laptop) */
let sheetCleanup = null;
function closeSheet() { if (sheetCleanup) sheetCleanup(); }
/**
 * opts: { title, body (HTML berisi field), submitLabel, onSubmit(values) → Promise, extraLeft (HTML), readOnly, danger }
 * onSubmit melempar error → pesan tampil di sheet; berhasil → sheet tertutup.
 */
function openSheet(opts) {
  closeSheet();
  const lastFocus = document.activeElement;
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sheet = document.createElement('div');
  sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', opts.title);
  sheet.innerHTML = '<div class="grabber"></div><form novalidate>' +
    '<div class="sheet-head"><h2 class="t-2">' + esc(opts.title) + '</h2><button type="button" class="icon-btn" data-close aria-label="' + esc(t('common.close')) + '">' + icon('x') + '</button></div>' +
    opts.body +
    '<div class="sheet-foot"><span class="save-status" aria-live="polite"></span><div class="btns">' + (opts.extraLeft || '') +
    (opts.readOnly ? '' : '<button type="submit" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '">' + esc(opts.submitLabel || t('common.save')) + '</button>') +
    '</div></div></form>';
  document.body.appendChild(scrim); document.body.appendChild(sheet);
  requestAnimationFrame(() => { scrim.classList.add('open'); sheet.classList.add('open'); });
  const form = $('form', sheet);
  const status = $('.save-status', sheet);
  const onKey = (e) => { if (e.key === 'Escape') closeSheet(); };
  document.addEventListener('keydown', onKey);
  sheetCleanup = () => {
    document.removeEventListener('keydown', onKey);
    scrim.classList.remove('open'); sheet.classList.remove('open');
    setTimeout(() => { scrim.remove(); sheet.remove(); }, 320);
    sheetCleanup = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  scrim.addEventListener('click', closeSheet);
  $$('[data-close]', sheet).forEach(b => b.addEventListener('click', closeSheet));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (opts.readOnly) return;
    const values = {};
    $$('input, select, textarea', form).forEach(el => {
      if (!el.name) return;
      values[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    const btns = $$('button', form);
    btns.forEach(b => { b.disabled = true; });
    status.className = 'save-status'; status.innerHTML = '<span class="spinner sm"></span>' + esc(t('common.saving'));
    try {
      await opts.onSubmit(values, form);
      closeSheet();
      render();
    } catch (err) {
      btns.forEach(b => { b.disabled = false; });
      status.className = 'save-status err';
      status.innerHTML = icon('alert') + esc(err.message || t('err.saveFailed'));
      if (err.code === 'AUTH_REQUIRED') closeSheet();
    }
  });
  const first = $('input:not([type=hidden]), select, textarea', sheet);
  setTimeout(() => (first || $('[data-close]', sheet)).focus(), 60);
}

/* Bagian-bagian formulir */
const fText = (name, label, value, attrs) => '<label class="field"><span>' + esc(label) + '</span><input class="input" name="' + name + '" value="' + esc(value) + '" ' + (attrs || '') + '></label>';
const fArea = (name, label, value, attrs) => '<label class="field"><span>' + esc(label) + '</span><textarea class="textarea" name="' + name + '" ' + (attrs || '') + '>' + esc(value) + '</textarea></label>';
const fDate = (name, label, value) => '<label class="field"><span>' + esc(label) + '</span><input class="input" type="date" name="' + name + '" value="' + esc(value) + '"></label>';
function fSelect(name, label, options, value) {
  return '<label class="field"><span>' + esc(label) + '</span><select class="select" name="' + name + '">' +
    options.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') +
    '</select></label>';
}
const fInfo = (pairs) => '<dl class="kv" style="margin:0 0 16px">' + pairs.filter(p => p[1] !== '' && p[1] !== null && p[1] !== undefined).map(p => '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>').join('') + '</dl>';
const ph = (key) => 'placeholder="' + esc(t(key)) + '"';


/* =========================================================
   6. VIEWS
   Setiap view mengembalikan HTML. Event ditangani lewat data-act (bagian 7).
   ========================================================= */

/* ---------- Kerangka: sidebar, tab bar ---------- */
const OWNER_ONLY = ['todo', 'prompt', 'akses'];
const SIDEBAR = [
  { items: [['ringkasan', 'nav.ringkasan', 'home']] },
  { title: 'navg.penulisan', items: [['penulisan', 'nav.bab', 'book'], ['penulisan/papan', 'nav.papan', 'columns'], ['penulisan/terlambat', 'nav.terlambat', 'clock']] },
  { title: 'navg.masukan', items: [['masukan', 'nav.masukanTerbuka', 'message'], ['masukan/semua', 'nav.logMasukan', 'list']] },
  { title: 'navg.persiapan', items: [['todo', 'nav.todo', 'checklist'], ['bacaan', 'nav.bacaan', 'bookmark'], ['linimasa', 'nav.linimasa', 'calendar']] },
  { title: 'navg.administrasi', items: [['syarat', 'nav.syarat', 'shield'], ['log', 'nav.logBimbingan', 'users'], ['log/ai', 'nav.logAi', 'sparkle']] },
  { title: 'navg.alat', items: [['prompt', 'nav.prompt', 'terminal']] },
  { title: 'navg.pengaturan', items: [['akses', 'nav.akses', 'key'], ['akun', 'nav.akun', 'user']] }
];
const TABS = [['ringkasan', 'nav.ringkasan', 'home'], ['penulisan', 'nav.penulisan', 'book'], ['masukan', 'nav.masukan', 'message'], ['log', 'nav.log', 'clipboard'], ['lainnya', 'nav.lainnya', 'more']];
function tabOf(key) {
  if (key === 'ringkasan') return 'ringkasan';
  if (key.startsWith('penulisan') || key.startsWith('bab')) return 'penulisan';
  if (key.startsWith('masukan')) return 'masukan';
  if (key.startsWith('log')) return 'log';
  return 'lainnya';
}
const allowed = (key) => isOwner() || OWNER_ONLY.indexOf(key.split('/')[0]) < 0;
const roleLabel = (r) => t(r === 'owner' ? 'role.owner' : 'role.supervisor');

function offlinePill() {
  if (!state.offline) return '';
  return '<div class="offline-pill" role="status"><span class="dot"></span><span>' + esc(t('offline.pill', { time: fmtShortDateTime(state.snapshotAt) })) + '</span></div>';
}

function shell(content, routeKey, wide) {
  const counts = { 'masukan': openFeedback().length, 'penulisan/terlambat': overdueSections().length };
  const side = SIDEBAR.map(g => {
    const items = g.items.filter(it => allowed(it[0]));
    if (!items.length) return '';
    return '<div class="group">' + (g.title ? '<div class="group-title t-foot muted">' + esc(t(g.title)) + '</div>' : '') +
      items.map(it => '<a href="#/' + it[0] + '" class="' + (routeKey === it[0] || (it[0] === 'penulisan' && routeKey.startsWith('bab/')) ? 'on' : '') + '">' +
        icon(it[2]) + '<span>' + esc(t(it[1])) + '</span>' + (counts[it[0]] ? '<span class="count num">' + counts[it[0]] + '</span>' : '') + '</a>').join('') + '</div>';
  }).join('');
  const tab = tabOf(routeKey);
  return '<div class="shell">' +
    '<nav class="sidebar" aria-label="' + esc(t('common.mainMenu')) + '"><div class="brand t-head">Thesis Tracker</div>' + side +
    '<div class="me t-foot"><div class="t-sub">' + esc(state.user.name) + '</div><div class="muted">' + esc(roleLabel(state.user.role)) + '</div></div></nav>' +
    '<main class="main' + (wide ? ' wide' : '') + (state.offline ? ' is-offline' : '') + '" id="main">' + content + '</main>' +
    '<nav class="tabbar" aria-label="' + esc(t('common.mainMenu')) + '">' + TABS.map(tb => '<a href="#/' + tb[0] + '" class="' + (tab === tb[0] ? 'on' : '') + '"' + (tab === tb[0] ? ' aria-current="page"' : '') + '>' + icon(tb[2]) + '<span>' + esc(t(tb[1])) + '</span></a>').join('') + '</nav>' +
    offlinePill() +
    '</div>';
}

/* ---------- Masuk ---------- */
function langToggleLogin() {
  const other = LANG === 'id' ? 'en' : 'id';
  return '<button type="button" class="btn btn-plain lang-switch" data-act="set-lang" data-v="' + other + '" lang="' + other + '">' + esc(t('lang.switchTo')) + '</button>';
}
function vLogin() {
  return '<main class="login"><form class="login-card" data-form="login" novalidate>' +
    '<div class="app-mark">' + icon('grad') + '</div>' +
    '<h1 class="t-1">Thesis Tracker</h1><p class="lead t-sub muted">' + esc(t('login.lead')) + '</p>' +
    '<div class="stack">' +
    '<label class="visually-hidden" for="lg-email">' + esc(t('field.email')) + '</label><input class="input" id="lg-email" name="email" type="email" autocomplete="username" placeholder="' + esc(t('field.email')) + '" required>' +
    '<label class="visually-hidden" for="lg-pin">PIN</label><input class="input" id="lg-pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" required>' +
    '</div>' +
    '<div class="toggle-row"><span>' + esc(t('login.remember')) + '</span><label class="switch"><input type="checkbox" name="remember" aria-label="' + esc(t('login.remember')) + '"><span></span></label></div>' +
    '<button class="btn btn-primary btn-block" type="submit">' + esc(t('login.submit')) + '</button>' +
    '<p class="err" role="alert"></p>' +
    '<div style="text-align:center;margin-top:8px">' + langToggleLogin() + '</div>' +
    '</form></main>';
}

/* ---------- Ringkasan ---------- */
function vRingkasan() {
  const ms = rows('milestones');
  const path = ms.length ? '<ol class="path" aria-label="' + esc(t('home.pathLabel')) + '">' + ms.map(m => {
    let when = '';
    if (/bimbingan/i.test(m.name)) when = t('home.bimbinganCount', { n: bimbinganCount(), min: BIMBINGAN_MIN });
    if (m.date) when = (when ? when + '. ' : '') + t(m.status === 'done' ? 'home.doneOn' : 'home.targetOn', { date: fmtDate(m.date) });
    const inner = '<span class="dot">' + (m.status === 'done' ? icon('check') : '') + '</span>' +
      '<span class="name">' + esc(m.name) + '</span>' + (when ? '<span class="when">' + esc(when) + '</span>' : '');
    return '<li class="' + esc(m.status) + '">' + (isOwner()
      ? '<button class="step" data-act="edit-milestone" data-id="' + m.id + '" aria-label="' + esc(t('home.changeStatus', { name: m.name })) + '">' + inner + '</button>'
      : '<div class="step">' + inner + '</div>') + '</li>';
  }).join('') + '</ol>' : emptyState('grad', t('home.pathEmpty'), t('home.pathEmptyText'));

  const late = overdueSections().length, open = openFeedback().length;
  const sp = reqProgress('sempro');
  const stats = '<div class="stats">' +
    '<a class="stat' + (late ? ' alert' : '') + '" href="#/penulisan/terlambat"><div class="n">' + late + '</div><div class="l">' + esc(t('home.statLate')) + '</div></a>' +
    '<a class="stat' + (open ? ' alert' : '') + '" href="#/masukan"><div class="n">' + open + '</div><div class="l">' + esc(t('home.statOpen')) + '</div></a>' +
    '<a class="stat" href="#/log"><div class="n">' + bimbinganCount() + '<small> / ' + BIMBINGAN_MIN + '</small></div><div class="l">' + esc(t('home.statBimbingan')) + '</div></a>' +
    '<a class="stat" href="#/syarat"><div class="n">' + sp.done + '<small> / ' + sp.total + '</small></div><div class="l">' + esc(t('home.statSempro')) + '</div></a>' +
    '</div>';

  const chs = rows('chapters');
  const prog = chs.length ? group(t('home.progress'), chs.map(ch => {
    const p = chapterProgress(ch.id);
    return '<a class="row ch-row" href="#/bab/' + ch.id + '"><span class="title t-head">' + esc(chapterLabel(ch)) + '</span>' + bar(p.pct) + '</a>';
  }).join('')) : '';

  const sup = D().supervisors || [];
  const supLine = sup.length ? t('home.supervisors', { names: sup.map(s => s.name).join(', ') }) : (isOwner() ? t('home.noSupervisor') : '');
  return pageHead(t('nav.ringkasan'), esc(t('home.hello', { name: firstName(state.user.name) }) + ' ' + supLine)) + path + stats + prog;
}

/* ---------- Penulisan: daftar bab ---------- */
const penSeg = () => [['#/penulisan', t('nav.bab')], ['#/penulisan/papan', t('seg.papan')], ['#/penulisan/terlambat', t('nav.terlambat')]];
function chapterRow(ch) {
  const p = chapterProgress(ch.id);
  const fb = openFeedback(ch.id).length;
  const target = ch.target_date ? t('ch.targetRel', { date: fmtDate(ch.target_date), rel: relDays(ch.target_date) }) : t('ch.noTarget');
  return '<a class="row ch-row" href="#/bab/' + ch.id + '"><span class="title t-head">' + esc(chapterLabel(ch)) + '</span>' + bar(p.pct) +
    '<span class="lines"><span class="t-foot muted">' + esc(t('ch.finalCount', { n: p.final, total: p.total })) + '</span><span class="t-foot muted">' + esc(target) + '</span>' +
    (fb ? cap(t('ch.openFb', { n: fb }), 'var(--red)') : '') + '</span></a>';
}
function vBab() {
  const chs = rows('chapters');
  if (!chs.length) return pageHead(t('nav.penulisan')) + seg(penSeg(), '#/penulisan') + emptyState('book', t('ch.empty'), t('ch.emptyText'));
  const groups = Object.keys(DOCS).map(doc => {
    const list = chs.filter(c => c.doc === doc);
    return list.length ? group(docLabel(doc), list.map(chapterRow).join('')) : '';
  }).join('');
  return pageHead(t('nav.penulisan')) + seg(penSeg(), '#/penulisan') + groups;
}

/* ---------- Detail bab ---------- */
function sectionRow(s, withChapter) {
  const late = isOverdue(s);
  const meta = [];
  if (withChapter) meta.push(esc(chapterLabel(byId('chapters', s.chapter_id))));
  if (s.due_date) meta.push('<span style="' + (late ? 'color:var(--red)' : '') + '">' + esc(t('sec.due', { date: fmtDate(s.due_date), rel: relDays(s.due_date) })) + '</span>');
  if (s.words) meta.push(esc(t('sec.words', { n: fmtNum(s.words) })));
  const body = '<span class="grow"><span class="title">' + esc(sectionLabel(s)) + '</span>' + (meta.length ? '<span class="meta small">' + meta.join('<br>') + '</span>' : '') + '</span>' + stageCap(s.stage);
  return isOwner()
    ? '<button class="row" data-act="edit-section" data-id="' + s.id + '">' + body + icon('chevron', 'chev') + '</button>'
    : '<div class="row">' + body + '</div>';
}
function feedbackRow(f, withChapter) {
  const lines = [];
  if (withChapter) lines.push(esc(chapterLabel(byId('chapters', f.chapter_id))));
  let l2 = t('fb.fromOn', { from: fromLabel(f.from), date: fmtDate(f.received_at) });
  if (isOpenFb(f)) { const n = -daysFromToday(f.received_at); if (n > 0) l2 += t('fb.waiting', { n: n }); }
  lines.push(esc(l2));
  return '<button class="row" data-act="edit-feedback" data-id="' + f.id + '"><span class="grow"><span class="title clamp-2">' + esc(f.title) + '</span><span class="meta small">' + lines.join('<br>') + '</span></span>' + cap(fbLabel(f.status), FB_COLORS[f.status] || FB_COLORS.open) + icon('chevron', 'chev') + '</button>';
}
function vBabDetail(params) {
  const ch = byId('chapters', params.id);
  if (!ch) return pageHead(t('ch.notFound')) + '<a class="btn btn-plain" href="#/penulisan">' + icon('back') + esc(t('ch.backTo')) + '</a>';
  const p = chapterProgress(ch.id);
  const secs = sectionsOf(ch.id);
  const fbs = rows('feedback').filter(f => Number(f.chapter_id) === Number(ch.id)).sort((a, b) => (isOpenFb(b) - isOpenFb(a)) || String(b.received_at).localeCompare(String(a.received_at)));
  const target = ch.target_date ? fmtDate(ch.target_date) + ', ' + relDays(ch.target_date) : t('ch.notSet');
  const head = '<a class="btn btn-plain" href="#/penulisan" style="margin-left:-6px">' + icon('back') + esc(t('nav.penulisan')) + '</a>' +
    '<header class="page-head"><div><div style="margin-bottom:6px">' + cap(docLabel(ch.doc), DOCS[ch.doc] || 'var(--gray)') + '</div><h1 class="t-1">' + esc(chapterLabel(ch)) + '</h1></div></header>' +
    '<div style="margin-bottom:8px">' + bar(p.pct) + '</div><p class="t-foot muted" style="margin:0 0 24px">' + esc(t('ch.finalCount', { n: p.final, total: p.total })) + '</p>';
  const info = group('', '<div class="row"><span class="grow">' + esc(t('field.targetDate')) + '</span><span class="detail">' + esc(target) + '</span>' +
    (isOwner() ? '<button class="btn btn-plain" data-act="edit-chapter" data-id="' + ch.id + '">' + esc(t('common.edit')) + '</button>' : '') + '</div>');
  const secList = secs.length ? group(t('ch.sections'), secs.map(s => sectionRow(s)).join(''), isOwner() ? esc(t('ch.sectionsHint')) : '') : '';
  const fbList = group(t('ch.feedback'), fbs.length ? fbs.map(f => feedbackRow(f)).join('') : '<div class="row muted t-sub">' + esc(t('ch.noFeedback')) + '</div>');
  const add = '<button class="btn btn-tinted" data-act="new-feedback" data-ch="' + ch.id + '" style="margin:-16px 0 28px">' + icon('plus') + esc(t('fb.add')) + '</button>';
  return head + info + secList + fbList + add;
}

/* ---------- Papan Penulisan ---------- */
function boardCard(s) {
  const ch = byId('chapters', s.chapter_id);
  const late = isOverdue(s);
  const move = isOwner() ? '<label class="visually-hidden" for="mv-' + s.id + '">' + esc(t('board.moveTo')) + '</label><select class="select" id="mv-' + s.id + '" data-change="move-section" data-id="' + s.id + '" style="min-height:32px;padding:4px 30px 4px 10px;font-size:13px;width:auto">' +
    STAGES.map(v => '<option value="' + v + '"' + (v === Number(s.stage) ? ' selected' : '') + '>' + esc(stageLabel(v)) + '</option>').join('') + '</select>' : '';
  const seret = isOwner() ? ' data-drag="1"' : '';
  return '<div class="card" data-id="' + s.id + '" data-stage="' + Number(s.stage) + '"' + seret + '><div class="t-sub">' + esc(sectionLabel(s)) + '</div><div class="t-foot muted">' + esc(chapterLabel(ch)) + '</div>' +
    '<div class="row-b"><span class="t-foot" style="color:' + (late ? 'var(--red)' : 'var(--label-2)') + '">' + (s.due_date ? esc(fmtDate(s.due_date)) : '') + '</span>' + move + '</div></div>';
}
function vPapan() {
  const secs = rows('sections');
  if (!secs.length) return pageHead(t('nav.papan')) + seg(penSeg(), '#/penulisan/papan') + emptyState('columns', t('board.empty'), t('board.emptyText'));
  const desktop = '<div class="board board-desktop">' + STAGES.map(v => {
    const list = secs.filter(s => Number(s.stage) === v);
    return '<section class="col" data-stage="' + v + '" aria-label="' + esc(t('board.stageCol', { stage: stageLabel(v) })) + '"><div class="col-head">' + cap(stageLabel(v), STAGE_COLORS[v]) + '<span class="t-foot muted num">' + list.length + '</span></div>' + list.map(boardCard).join('') + '</section>';
  }).join('') + '</div>';
  const cur = state.papanStage;
  const nCur = secs.filter(s => Number(s.stage) === cur).length;
  const mobile = '<div class="board-mobile"><div class="seg" role="tablist" style="margin-bottom:8px">' + STAGES.map(v =>
    '<button role="tab" aria-selected="' + (v === cur) + '" class="' + (v === cur ? 'on' : '') + '" data-act="papan-stage" data-v="' + v + '">' + esc(t('stageShort.' + v)) + '</button>').join('') + '</div>' +
    '<p class="t-foot muted" style="margin:0 4px 12px">' + esc(t('board.inStage', { n: nCur, stage: stageLabel(cur).toLowerCase() })) + '</p>' +
    (secs.filter(s => Number(s.stage) === cur).map(boardCard).join('') || '<p class="t-sub muted" style="text-align:center;padding:24px 0">' + esc(t('board.noneInStage')) + '</p>') + '</div>';
  return pageHead(t('nav.papan'), isOwner() ? esc(t('board.hint')) : '') + seg(penSeg(), '#/penulisan/papan') + desktop + mobile;
}

/* ---------- Terlambat ---------- */
function vTerlambat() {
  const list = overdueSections();
  return pageHead(t('nav.terlambat'), list.length ? esc(t('late.count', { n: list.length })) : '') + seg(penSeg(), '#/penulisan/terlambat') +
    (list.length ? group('', list.map(s => sectionRow(s, true)).join('')) : emptyState('check', t('late.empty'), t('late.emptyText')));
}

/* ---------- Masukan ---------- */
const fbSeg = () => [['#/masukan', t('seg.open')], ['#/masukan/semua', t('nav.logMasukan')]];
function vMasukan(all) {
  let list = rows('feedback').slice();
  if (all) list.sort((a, b) => String(b.received_at).localeCompare(String(a.received_at)) || b.id - a.id);
  else list = list.filter(isOpenFb).sort((a, b) => String(a.received_at).localeCompare(String(b.received_at)) || a.id - b.id);
  const tools = '<button class="btn btn-primary" data-act="new-feedback">' + icon('plus') + esc(t('common.add')) + '</button>';
  const body = list.length ? group('', list.map(f => feedbackRow(f, true)).join(''), all ? '' : esc(t('fb.oldestFirst')))
    : emptyState('inbox', t(all ? 'fb.emptyAll' : 'fb.emptyOpen'), t(all ? 'fb.emptyAllText' : 'fb.emptyOpenText'));
  return pageHead(t('nav.masukan'), '', tools) + seg(fbSeg(), all ? '#/masukan/semua' : '#/masukan') + body;
}

/* ---------- Log Bimbingan dan Log AI ---------- */
const logSeg = () => [['#/log', t('seg.bimbingan')], ['#/log/ai', t('seg.ai')]];
function vBimbingan() {
  const list = rows('bimbingan').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const n = list.length;
  const tools = (n ? '<button class="btn btn-tinted" data-act="copy-bimbingan">' + icon('copy') + esc(t('common.copy')) + '</button>' : '') +
    (isOwner() ? '<button class="btn btn-primary" data-act="new-bimbingan">' + icon('plus') + esc(t('common.add')) + '</button>' : '');
  const counter = group('', '<div class="row" style="display:block"><span class="t-sub">' + t('log.counter', { n: '<span class="counter">' + n + '</span>', min: BIMBINGAN_MIN }) + '</span><div style="margin-top:8px">' + bar(n / BIMBINGAN_MIN * 100) + '</div></div>',
    esc(t('log.counterFoot')));
  const body = n ? group(t('log.history'), list.map(b => '<button class="row" data-act="edit-bimbingan" data-id="' + b.id + '"><span class="grow"><span class="title">' + esc(b.topic) + '</span><span class="meta small">' +
    esc(fmtDate(b.date)) + '<br>' + esc(fromLabel(b.supervisor) + ', ' + modeLabel(b.mode).toLowerCase()) + '</span></span>' + icon('chevron', 'chev') + '</button>').join(''))
    : emptyState('users', t('log.empty'), t(isOwner() ? 'log.emptyOwner' : 'log.emptySup'));
  return pageHead(t('nav.log'), '', tools) + seg(logSeg(), '#/log') + counter + body;
}
function vAiLog() {
  const list = rows('ailog').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const tools = (list.length ? '<button class="btn btn-tinted" data-act="copy-ailog">' + icon('copy') + esc(t('common.copy')) + '</button>' : '') +
    (isOwner() ? '<button class="btn btn-primary" data-act="new-ailog">' + icon('plus') + esc(t('common.add')) + '</button>' : '');
  const body = list.length ? group('', list.map(a => '<button class="row" data-act="edit-ailog" data-id="' + a.id + '"><span class="grow"><span class="title clamp-2">' + esc(a.purpose) + '</span><span class="meta small">' +
    esc(fmtDate(a.date) + ', ' + a.tool) + (a.thesis_part ? '<br>' + esc(a.thesis_part) : '') + '</span></span>' + cap(helpLabel(a.help_type), 'var(--indigo)') + icon('chevron', 'chev') + '</button>').join(''),
    esc(t('ai.foot')))
    : emptyState('sparkle', t('ai.empty'), t(isOwner() ? 'ai.emptyOwner' : 'ai.emptySup'));
  return pageHead(t('nav.log'), '', tools) + seg(logSeg(), '#/log/ai') + body;
}

/* ---------- Lainnya (menu HP) ---------- */
function vLainnya() {
  const item = (key, label, ic, color, detail) => allowed(key)
    ? '<a class="row has-icon" href="#/' + key + '"><span class="lead-icon" style="background:' + color + '">' + icon(ic) + '</span><span class="grow">' + esc(t(label)) + '</span>' + (detail ? '<span class="detail num">' + esc(detail) + '</span>' : '') + icon('chevron', 'chev') + '</a>' : '';
  const rd = rows('readings'); const tk = rows('tasks');
  return pageHead(t('nav.lainnya')) +
    group(t('navg.persiapan'), item('todo', 'nav.todo', 'checklist', 'var(--orange)', tk.length ? tk.filter(x => x.done).length + '/' + tk.length : '') + item('bacaan', 'nav.bacaan', 'bookmark', 'var(--indigo)', rd.length ? rd.filter(r => r.done).length + '/' + rd.length : '') + item('linimasa', 'nav.linimasa', 'calendar', 'var(--red)')) +
    group(t('navg.administrasi'), item('syarat', 'nav.syarat', 'shield', 'var(--green)')) +
    (isOwner() ? group(t('navg.alat'), item('prompt', 'nav.prompt', 'terminal', 'var(--gray)')) : '') +
    group(t('navg.pengaturan'), item('akses', 'nav.akses', 'key', 'var(--teal)') + item('akun', 'nav.akun', 'user', 'var(--gray)'));
}

/* ---------- To-Do ---------- */
function vTodo() {
  const tasks = rows('tasks');
  const f = state.todoFilter;
  const segHtml = '<div class="seg" role="tablist">' + [['semua', 'todo.all'], ['belum', 'todo.open'], ['selesai', 'todo.done']].map(o =>
    '<button role="tab" aria-selected="' + (o[0] === f) + '" class="' + (o[0] === f ? 'on' : '') + '" data-act="todo-filter" data-v="' + o[0] + '">' + esc(t(o[1])) + '</button>').join('') + '</div>';
  if (!tasks.length) return pageHead(t('nav.todo')) + emptyState('checklist', t('todo.empty'), t('todo.emptyText'));
  const done = tasks.filter(x => x.done).length;
  const phases = rows('phases');
  const groups = (phases.length ? phases : [{ id: null, name: t('todo.task'), focus: '' }]).map(phs => {
    let list = tasks.filter(x => phs.id === null || Number(x.phase_id) === Number(phs.id));
    if (f === 'belum') list = list.filter(x => !x.done);
    if (f === 'selesai') list = list.filter(x => x.done);
    if (!list.length) return '';
    return group(phs.name, list.map(x => '<div class="row' + (x.done ? ' done' : '') + '">' + checkBtn(x.done, 'toggle-task', x.id, t('todo.markDone', { title: x.title })) +
      '<button class="grow" data-act="edit-task" data-id="' + x.id + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(x.title) + '</span>' +
      ((x.desc || x.duration || x.note) ? '<span class="meta small clamp-2">' + esc([x.duration, x.desc].filter(Boolean).join('. ')) + (x.note ? ' ' + cap(t('todo.hasNote'), 'var(--tint)') : '') + '</span>' : '') + '</button></div>').join(''), phs.focus ? esc(phs.focus) : '');
  }).join('');
  return pageHead(t('nav.todo'), esc(t('common.doneOf', { n: done, total: tasks.length }))) + segHtml + (groups || '<p class="t-sub muted" style="text-align:center">' + esc(t('todo.noneForFilter')) + '</p>');
}

/* ---------- Bacaan ---------- */
function vBacaan() {
  const list = rows('readings');
  if (!list.length) return pageHead(t('nav.bacaan')) + emptyState('bookmark', t('read.empty'), t('read.emptyText'));
  const types = [];
  list.forEach(r => { if (types.indexOf(r.type) < 0) types.push(r.type); });
  const done = list.filter(r => r.done).length;
  return pageHead(t('nav.bacaan'), esc(t('read.doneOf', { n: done, total: list.length }))) + types.map(tp => group(tp || t('read.other'), list.filter(r => r.type === tp).map(r =>
    '<div class="row' + (r.done ? ' done' : '') + '">' + checkBtn(r.done, 'toggle-reading', r.id, t('read.markDone', { title: r.title })) +
      '<button class="grow" data-act="edit-reading" data-id="' + r.id + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(r.title) + '</span><span class="meta small">' + esc(r.author) + '</span></button>' +
      (r.verify_status ? cap(verifyLabel(r.verify_status), VERIFY[r.verify_status] || 'var(--gray)') : '') + '</div>'
  ).join(''))).join('');
}

/* ---------- Linimasa ---------- */
function vLinimasa() {
  const list = rows('timeline');
  if (!list.length) return pageHead(t('nav.linimasa')) + emptyState('calendar', t('tl.empty'), t('tl.emptyText'));
  const months = [];
  list.forEach(x => { const m = String(x.month).slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
  months.sort();
  const now = todayStr().slice(0, 7);
  return pageHead(t('nav.linimasa'), esc(t('tl.sub'))) + months.map(m => group(fmtMonth(m) + (m === now ? ' ' + t('tl.thisMonth') : ''),
    list.filter(x => String(x.month).slice(0, 7) === m).map(x => '<div class="row"><span class="grow"><span class="title">' + esc(x.title) + '</span>' + (x.desc ? '<span class="meta small">' + esc(x.desc) + '</span>' : '') + '</span></div>').join(''))).join('');
}

/* ---------- Syarat ---------- */
function vSyarat() {
  const reqs = rows('requirements');
  const sp = semproAttendance(), tot = totalAttendance();
  const reqGroups = REQ_STAGES.map(st => {
    const list = reqs.filter(r => r.stage === st);
    if (!list.length) return '';
    const pr = reqProgress(st);
    return group(t('req.groupTitle', { stage: t('req.' + st), n: pr.done, total: pr.total }), list.map(r => {
      let hint = '';
      if (/minimal 5 kali/.test(r.text)) hint = t('req.hintSempro', { n: sp, min: SEMPRO_ATTEND_MIN });
      if (/minimal 10 kali/.test(r.text) && /hadir/i.test(r.text)) hint = t('req.hintTotal', { n: tot, min: TOTAL_ATTEND_MIN });
      if (/Bimbingan minimal 10/.test(r.text)) hint = t('req.hintBimbingan', { n: bimbinganCount(), min: BIMBINGAN_MIN });
      const meta = [r.source, hint, r.evidence ? t('req.evidence', { text: r.evidence }) : ''].filter(Boolean).map(esc).join('<br>');
      return '<div class="row' + (r.done ? ' done' : '') + '">' + checkBtn(r.done, 'toggle-req', r.id, t('req.markDone', { text: r.text })) +
        (isOwner() ? '<button class="grow" data-act="edit-req" data-id="' + r.id + '" style="background:none;border:0;padding:0;text-align:left">' : '<span class="grow">') +
        '<span class="title">' + esc(r.text) + '</span><span class="meta small">' + meta + '</span>' + (isOwner() ? '</button>' : '</span>') + '</div>';
    }).join(''));
  }).join('');
  const att = rows('attendance').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const attGroup = group(t('att.group', { n: tot }),
    (att.length ? att.map(a => '<div class="row"><span class="grow"><span class="title">' + esc(a.title) + '</span><span class="meta small">' + esc(fmtDate(a.date) + ', ' + t('att.' + (a.type === 'sempro' ? 'sempro' : 'sidang'))) + (a.note ? '<br>' + esc(a.note) : '') + '</span></span>' +
      (isOwner() ? '<button class="icon-btn" data-act="del-attendance" data-id="' + a.id + '" aria-label="' + esc(t('att.deleteLabel', { title: a.title })) + '">' + icon('x') + '</button>' : '') + '</div>').join('')
      : '<div class="row muted t-sub">' + esc(t('att.empty')) + '</div>'),
    esc(t('att.foot', { sp: sp, spMin: SEMPRO_ATTEND_MIN, tot: tot, totMin: TOTAL_ATTEND_MIN })));
  const addAtt = isOwner() ? '<button class="btn btn-tinted" data-act="new-attendance" style="margin:-16px 0 28px">' + icon('plus') + esc(t('att.add')) + '</button>' : '';
  return pageHead(t('nav.syarat'), esc(t('req.sub'))) +
    (reqGroups || emptyState('shield', t('req.empty'), t('req.emptyText'))) + attGroup + addAtt;
}

/* ---------- Prompt ---------- */
function vPrompt() {
  const list = rows('prompts');
  if (!list.length) return pageHead(t('nav.prompt')) + emptyState('terminal', t('prompt.empty'), t('prompt.emptyText'));
  return pageHead(t('nav.prompt'), esc(t('prompt.sub'))) + group('', list.map(p => {
    const open = state.openPrompts.has(p.id);
    return '<div class="row" style="display:block"><div style="display:flex;align-items:center;gap:12px"><button class="grow" data-act="toggle-prompt" data-id="' + p.id + '" aria-expanded="' + open + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(p.title) + '</span>' +
      (p.category ? '<span class="meta small">' + esc(p.category) + '</span>' : '') + '</button><button class="btn btn-tinted" data-act="copy-prompt" data-id="' + p.id + '">' + icon('copy') + esc(t('common.copy')) + '</button></div>' +
      (open ? '<div class="prompt-body">' + esc(p.body) + '</div>' : '') + '</div>';
  }).join(''));
}

/* ---------- Kelola Akses ---------- */
function vAkses() {
  if (state.offline) return pageHead(t('nav.akses')) + emptyState('key', t('offline.title'), t('offline.accessText'));
  if (!state.users) {
    loadUsers();
    return pageHead(t('nav.akses')) + '<div class="skel"></div><div class="skel"></div>';
  }
  const tools = '<button class="btn btn-primary" data-act="new-user">' + icon('plus') + esc(t('access.addBtn')) + '</button>';
  return pageHead(t('nav.akses'), esc(t('access.sub')), tools) + group('', state.users.map(u => {
    const me = u.email === state.user.email;
    return '<div class="row"><span class="grow"><span class="title">' + esc(u.name) + ' ' + cap(roleLabel(u.role), u.role === 'owner' ? 'var(--tint)' : 'var(--teal)') + '</span>' +
      '<span class="meta small">' + esc(u.email) + '<br>' + esc(u.last_login_at ? t('access.lastLogin', { date: fmtDateTime(u.last_login_at) }) : t('access.neverLogin')) + '</span></span>' +
      (me ? '' : '<div class="row-actions"><button class="btn btn-plain" data-act="reset-user-pin" data-email="' + esc(u.email) + '">' + esc(t('access.resetPin')) + '</button>' +
        '<label class="switch" title="' + esc(t('access.active')) + '"><input type="checkbox" data-change="user-active" data-email="' + esc(u.email) + '"' + (u.active ? ' checked' : '') + ' aria-label="' + esc(t('access.activeLabel', { name: u.name })) + '"><span></span></label></div>') + '</div>';
  }).join(''), esc(t('access.foot')));
}

/* ---------- Akun ---------- */
function installGroup() {
  if (isStandalone()) return group(t('pwa.group'), '<div class="row"><span class="grow">' + esc(t('pwa.installed')) + '</span>' + icon('check', 'chev') + '</div>');
  if (installPrompt) return group(t('pwa.group'), '<div class="row"><span class="grow">' + esc(t('pwa.installText')) + '</span><button class="btn btn-tinted" data-act="install">' + esc(t('pwa.install')) + '</button></div>');
  if (isIOS()) return group(t('pwa.group'), '<div class="row"><span class="grow t-sub">' + esc(t('pwa.iosText')) + '</span></div>', esc(t('pwa.iosFoot')));
  return group(t('pwa.group'), '<div class="row"><span class="grow t-sub">' + esc(t('pwa.otherText')) + '</span></div>');
}
function vAkun() {
  const u = state.user;
  const langSeg = '<div class="seg" role="radiogroup" aria-label="' + esc(t('lang.group')) + '" style="margin-bottom:0">' + [['id', 'Indonesia'], ['en', 'English']].map(o =>
    '<button role="radio" aria-checked="' + (LANG === o[0]) + '" class="' + (LANG === o[0] ? 'on' : '') + '" data-act="set-lang" data-v="' + o[0] + '" lang="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  return pageHead(t('nav.akun')) +
    group('', '<div class="row"><span class="grow">' + esc(t('field.name')) + '</span><span class="detail">' + esc(u.name) + '</span></div>' +
      '<div class="row"><span class="grow">' + esc(t('field.email')) + '</span><span class="detail">' + esc(u.email) + '</span></div>' +
      '<div class="row"><span class="grow">' + esc(t('account.role')) + '</span><span class="detail">' + esc(roleLabel(u.role)) + '</span></div>') +
    '<section class="group-wrap"><h2 class="group-label">' + esc(t('lang.group')) + '</h2>' + langSeg + '</section>' +
    installGroup() +
    '<section class="group-wrap"><h2 class="group-label">' + esc(t('account.changePin')) + '</h2><form class="list" data-form="change-pin" novalidate style="padding:16px">' +
    fText('oldPin', t('account.oldPin'), '', 'type="password" inputmode="numeric" autocomplete="current-password"') +
    fText('newPin', t('account.newPinRule'), '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
    fText('newPin2', t('account.newPin2'), '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
    '<div class="sheet-foot"><span class="save-status" aria-live="polite"></span><button class="btn btn-primary" type="submit">' + esc(t('account.changePin')) + '</button></div></form></section>' +
    '<button class="btn btn-danger btn-block" data-act="logout">' + icon('logout') + esc(t('account.logout')) + '</button>' +
    '<p class="t-foot faint" style="text-align:center;margin-top:20px">Thesis Tracker ' + CONFIG.VERSION + '</p>';
}

/* ---------- Memuat, gagal memuat, offline tanpa salinan ---------- */
function vLoading() { return '<div class="skel" style="height:41px;width:60%;margin:8px 0 24px"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>'; }
function vLoadError() {
  const off = state.loadErrorCode === 'NETWORK';
  return '<main class="login"><div class="login-card" style="text-align:center">' + icon('alert').replace('class=""', 'class="" style="width:48px;height:48px;color:var(--orange)"') +
    '<h1 class="t-2" style="margin:12px 0 8px">' + esc(t(off ? 'offline.title' : 'load.title')) + '</h1><p class="t-sub muted">' + esc(off ? t('offline.text') : state.loadError) + '</p>' +
    '<button class="btn btn-primary btn-block" data-act="retry-load" style="margin-top:16px">' + esc(t('common.retry')) + '</button>' +
    '<button class="btn btn-plain" data-act="logout" style="margin-top:12px">' + esc(t('account.logout')) + '</button></div></main>';
}


/* =========================================================
   7. AKSI UI
   ========================================================= */

/** Mengubah centang lewat server; tampilan berubah hanya setelah server membalas sukses. */
async function toggleDone(table, action, id, btn) {
  const row = byId(table, id);
  if (!row || !isOwner()) return;
  btn.classList.add('pending');
  try {
    replaceRow(table, await api.call(action, { id: row.id, done: !row.done }));
    render();
  } catch (e) {
    btn.classList.remove('pending');
    handleErr(e);
  }
}

const chapterOptions = () => rows('chapters').map(c => [c.id, chapterLabel(c)]);
/** Saat offline, formulir ubah tidak dibuka; tampilkan pesan. */
function blockedOffline() {
  if (!state.offline) return false;
  showBanner(t('err.offline'), 'orange');
  return true;
}

function sheetFeedback(f, presetChapter) {
  const isNew = !f;
  const mine = f && String(f.created_by).toLowerCase() === String(state.user.email).toLowerCase();
  const canEdit = (isNew || isOwner() || mine) && !state.offline;
  if (isNew && blockedOffline()) return;
  if (!rows('chapters').length) { showBanner(t('fb.noChapters'), 'orange'); return; }
  let body;
  if (isNew) {
    body = fArea('title', t('field.feedbackText'), '', 'rows="3" maxlength="200" required') +
      fSelect('chapterId', t('field.chapter'), chapterOptions(), presetChapter || rows('chapters')[0].id) +
      '<div class="form-grid">' + fSelect('from', t('field.from'), FROM_KEYS.map(k => [k, fromLabel(k)]), 'P1') + fDate('receivedAt', t('field.receivedAt'), todayStr()) + '</div>' +
      fArea('action', t('fb.nextStepOptional'), '', 'rows="2" maxlength="2000"');
  } else if (canEdit) {
    body = fInfo([[t('field.chapter'), chapterLabel(byId('chapters', f.chapter_id))], [t('field.from'), fromLabel(f.from)], [t('field.receivedAt'), fmtDate(f.received_at)]]) +
      fArea('title', t('field.feedbackText'), f.title, 'rows="3" maxlength="200"') +
      fSelect('status', t('field.status'), Object.keys(FB_COLORS).map(k => [k, fbLabel(k)]), f.status) +
      fArea('action', t('field.nextStep'), f.action, 'rows="3" maxlength="2000"');
  } else {
    body = fInfo([[t('field.chapter'), chapterLabel(byId('chapters', f.chapter_id))], [t('field.from'), fromLabel(f.from)], [t('field.receivedAt'), fmtDate(f.received_at)], [t('field.status'), fbLabel(f.status)], [t('field.nextStep'), f.action]]) +
      '<p class="t-callout" style="margin:0 0 8px">' + esc(f.title) + '</p>';
  }
  openSheet({
    title: t(isNew ? 'fb.new' : 'fb.one'),
    body: body,
    readOnly: !canEdit,
    submitLabel: t(isNew ? 'fb.add' : 'common.save'),
    onSubmit: async (v) => {
      if (isNew) {
        if (!v.title.trim()) throw new ApiError('VALIDATION', t('err.required', { field: t('field.feedbackText') }));
        replaceRow('feedback', await api.call('feedback.create', { title: v.title, chapterId: Number(v.chapterId), from: v.from, receivedAt: v.receivedAt, nextStep: v.action }));
      } else {
        replaceRow('feedback', await api.call('feedback.update', { id: f.id, title: v.title, status: v.status, nextStep: v.action }));
      }
    }
  });
}

function sheetBimbingan(b) {
  const isNew = !b;
  if (isNew && blockedOffline()) return;
  const v0 = b || { date: todayStr(), supervisor: 'P1', mode: 'Tatap muka', topic: '', input: '', follow_up: '' };
  if (!isOwner() || state.offline) {
    openSheet({ title: t('log.one'), readOnly: true, body: fInfo([[t('field.date'), fmtDate(v0.date)], [t('field.supervisor'), fromLabel(v0.supervisor)], [t('field.mode'), modeLabel(v0.mode)], [t('field.topic'), v0.topic], [t('field.input'), v0.input], [t('field.followUp'), v0.follow_up]]) });
    return;
  }
  openSheet({
    title: t(isNew ? 'log.new' : 'log.edit'),
    body: '<div class="form-grid">' + fDate('date', t('field.date'), v0.date) + fSelect('supervisor', t('field.supervisor'), [['P1', fromLabel('P1')], ['P2', fromLabel('P2')]], v0.supervisor) + '</div>' +
      fSelect('mode', t('field.mode'), MODES.map(m => [m, modeLabel(m)]), v0.mode) + fText('topic', t('field.topic'), v0.topic, 'maxlength="200"') +
      fArea('input', t('field.inputLong'), v0.input, 'rows="3"') + fArea('followUp', t('field.followUp'), v0.follow_up, 'rows="2"'),
    submitLabel: t(isNew ? 'log.add' : 'common.save'),
    onSubmit: async (v) => {
      replaceRow('bimbingan', await api.call(isNew ? 'bimbingan.create' : 'bimbingan.update', Object.assign(isNew ? {} : { id: b.id }, v)));
    }
  });
}

function sheetAiLog(a) {
  const isNew = !a;
  if (isNew && blockedOffline()) return;
  const v0 = a || { date: todayStr(), tool: '', purpose: '', thesis_part: '', help_type: 'Kritik', note: '' };
  if (!isOwner() || state.offline) {
    openSheet({ title: t('ai.one'), readOnly: true, body: fInfo([[t('field.date'), fmtDate(v0.date)], [t('field.tool'), v0.tool], [t('field.purpose'), v0.purpose], [t('field.thesisPart'), v0.thesis_part], [t('field.helpType'), helpLabel(v0.help_type)], [t('field.note'), v0.note]]) });
    return;
  }
  openSheet({
    title: t(isNew ? 'ai.new' : 'ai.edit'),
    body: '<div class="form-grid">' + fDate('date', t('field.date'), v0.date) + fText('tool', t('field.tool'), v0.tool, 'maxlength="100" ' + ph('ai.toolPh')) + '</div>' +
      fArea('purpose', t('field.purpose'), v0.purpose, 'rows="2" maxlength="1000" ' + ph('ai.purposePh')) +
      '<div class="form-grid">' + fText('thesisPart', t('field.thesisPart'), v0.thesis_part, 'maxlength="200" ' + ph('ai.partPh')) + fSelect('helpType', t('field.helpType'), HELP_TYPES.map(h => [h, helpLabel(h)]), v0.help_type) + '</div>' +
      fArea('note', t('field.note'), v0.note, 'rows="2"'),
    submitLabel: t(isNew ? 'ai.add' : 'common.save'),
    onSubmit: async (v) => {
      replaceRow('ailog', await api.call(isNew ? 'ailog.create' : 'ailog.update', Object.assign(isNew ? {} : { id: a.id }, v)));
    }
  });
}

/** Ringkasan untuk disalin, dalam bahasa antarmuka yang aktif. */
function summaryBimbingan() {
  const list = rows('bimbingan').slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return t('sum.bimbinganTitle', { n: list.length }) + '\n\n' + list.map((b, i) =>
    (i + 1) + '. ' + fmtDate(b.date) + ', ' + fromLabel(b.supervisor) + ' (' + modeLabel(b.mode) + ')\n   ' + t('field.topic') + ': ' + b.topic +
    (b.input ? '\n   ' + t('field.input') + ': ' + b.input : '') + (b.follow_up ? '\n   ' + t('field.followUp') + ': ' + b.follow_up : '')).join('\n\n');
}
function summaryAiLog() {
  const list = rows('ailog').slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return t('sum.aiTitle', { n: list.length }) + '\n\n' + list.map((a, i) =>
    (i + 1) + '. ' + fmtDate(a.date) + ', ' + a.tool + ' (' + helpLabel(a.help_type) + ')\n   ' + t('field.purpose') + ': ' + a.purpose +
    (a.thesis_part ? '\n   ' + t('field.thesisPart') + ': ' + a.thesis_part : '') + (a.note ? '\n   ' + t('field.note') + ': ' + a.note : '')).join('\n\n');
}

async function loadUsers() {
  try {
    const res = await api.call('admin.users.list');
    state.users = res.users;
    render();
  } catch (e) { handleErr(e); }
}

const pinFields = (labelKey) => fText('pin', t(labelKey), '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
  fText('pin2', t('account.pinAgain'), '', 'type="password" inputmode="numeric" autocomplete="new-password"');

const UI = {
  'toggle-task': (el) => toggleDone('tasks', 'task.update', el.dataset.id, el),
  'toggle-reading': (el) => toggleDone('readings', 'reading.update', el.dataset.id, el),
  'toggle-req': (el) => toggleDone('requirements', 'requirement.update', el.dataset.id, el),

  'edit-task': (el) => {
    const x = byId('tasks', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: t('todo.noteTitle'),
      body: '<p class="t-head" style="margin:0 0 4px">' + esc(x.title) + '</p>' + (x.desc ? '<p class="t-sub muted" style="margin:0 0 16px">' + esc(x.desc) + '</p>' : '') +
        fArea('note', t('field.note'), x.note, 'rows="5" maxlength="5000"'),
      onSubmit: async (v) => { replaceRow('tasks', await api.call('task.update', { id: x.id, note: v.note })); }
    });
  },
  'edit-reading': (el) => {
    const r = byId('readings', el.dataset.id);
    if (!isOwner() || state.offline) { openSheet({ title: t('read.one'), readOnly: true, body: fInfo([[t('read.title'), r.title], [t('read.source'), r.author], [t('field.status'), t(r.done ? 'read.isRead' : 'read.notRead')]]) }); return; }
    openSheet({
      title: t('read.one'),
      body: '<p class="t-head" style="margin:0 0 4px">' + esc(r.title) + '</p><p class="t-sub muted" style="margin:0 0 16px">' + esc(r.author) + '</p>' +
        fSelect('verifyStatus', t('read.verifyLabel'), Object.keys(VERIFY).map(k => [k, verifyLabel(k)]), r.verify_status) +
        fArea('note', t('field.note'), r.note, 'rows="4" maxlength="5000"'),
      onSubmit: async (v) => { replaceRow('readings', await api.call('reading.update', { id: r.id, verifyStatus: v.verifyStatus, note: v.note })); }
    });
  },
  'edit-req': (el) => {
    const r = byId('requirements', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: t('req.one'),
      body: '<p class="t-head" style="margin:0 0 16px">' + esc(r.text) + '</p>' + fArea('evidence', t('req.evidenceLabel'), r.evidence, 'rows="3" maxlength="1000"'),
      onSubmit: async (v) => { replaceRow('requirements', await api.call('requirement.update', { id: r.id, evidence: v.evidence })); }
    });
  },
  'edit-section': (el) => {
    const s = byId('sections', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: sectionLabel(s),
      body: fSelect('stage', t('field.stage'), STAGES.map(v => [v, stageLabel(v)]), s.stage) +
        '<div class="form-grid">' + fDate('dueDate', t('field.dueDate'), s.due_date) + fText('words', t('field.words'), s.words === null ? '' : s.words, 'type="number" min="0" inputmode="numeric"') + '</div>',
      onSubmit: async (v) => { replaceRow('sections', await api.call('section.update', { id: s.id, stage: Number(v.stage), dueDate: v.dueDate, words: v.words === '' ? '' : Number(v.words) })); }
    });
  },
  'edit-chapter': (el) => {
    const c = byId('chapters', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: t('field.targetDate'),
      body: '<p class="t-sub muted" style="margin:0 0 16px">' + esc(chapterLabel(c)) + '</p>' + fDate('targetDate', t('field.targetDate'), c.target_date),
      onSubmit: async (v) => { replaceRow('chapters', await api.call('chapter.update', { id: c.id, targetDate: v.targetDate })); }
    });
  },
  'edit-milestone': (el) => {
    const m = byId('milestones', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: m.name,
      body: fSelect('status', t('field.status'), [['todo', t('ms.todo')], ['active', t('ms.active')], ['done', t('ms.done')]], m.status) + fDate('date', t('ms.dateLabel'), m.date),
      onSubmit: async (v) => { replaceRow('milestones', await api.call('milestone.update', { id: m.id, status: v.status, date: v.date })); }
    });
  },
  'new-feedback': (el) => sheetFeedback(null, el.dataset.ch ? Number(el.dataset.ch) : null),
  'edit-feedback': (el) => sheetFeedback(byId('feedback', el.dataset.id)),
  'new-bimbingan': () => sheetBimbingan(null),
  'edit-bimbingan': (el) => sheetBimbingan(byId('bimbingan', el.dataset.id)),
  'new-ailog': () => sheetAiLog(null),
  'edit-ailog': (el) => sheetAiLog(byId('ailog', el.dataset.id)),
  'copy-bimbingan': async () => { const ok = await copyText(summaryBimbingan()); showBanner(t(ok ? 'copy.bimbingan' : 'copy.failed'), ok ? 'green' : 'red'); },
  'copy-ailog': async () => { const ok = await copyText(summaryAiLog()); showBanner(t(ok ? 'copy.ai' : 'copy.failed'), ok ? 'green' : 'red'); },
  'copy-prompt': async (el) => { const ok = await copyText(byId('prompts', el.dataset.id).body); showBanner(t(ok ? 'copy.prompt' : 'copy.failed'), ok ? 'green' : 'red'); },
  'toggle-prompt': (el) => { const id = Number(el.dataset.id); state.openPrompts.has(id) ? state.openPrompts.delete(id) : state.openPrompts.add(id); render(); },
  'new-attendance': () => {
    if (blockedOffline()) return;
    openSheet({
      title: t('att.new'),
      body: '<div class="form-grid">' + fDate('date', t('field.date'), todayStr()) + fSelect('type', t('field.attendanceType'), [['sempro', t('att.sempro')], ['sidang', t('att.sidang')]], 'sempro') + '</div>' +
        fText('title', t('field.attendanceTitle'), '', 'maxlength="200"') + fArea('note', t('common.noteOptional'), '', 'rows="2" maxlength="1000"'),
      submitLabel: t('att.add'),
      onSubmit: async (v) => { replaceRow('attendance', await api.call('attendance.create', v)); }
    });
  },
  'del-attendance': (el) => {
    const a = byId('attendance', el.dataset.id);
    if (blockedOffline()) return;
    openSheet({
      title: t('att.deleteTitle'), danger: true, submitLabel: t('common.delete'),
      body: '<p class="t-sub" style="margin:0 0 8px">' + esc(t('att.deleteText', { title: a.title, date: fmtDate(a.date) })) + '</p>',
      onSubmit: async () => {
        await api.call('attendance.delete', { id: a.id });
        state.data.attendance = rows('attendance').filter(x => Number(x.id) !== Number(a.id));
      }
    });
  },
  'todo-filter': (el) => { state.todoFilter = el.dataset.v; render(); },
  'papan-stage': (el) => { state.papanStage = Number(el.dataset.v); render(); },
  'new-user': () => openSheet({
    title: t('access.addTitle'),
    body: fText('name', t('field.name'), '', 'maxlength="100" autocomplete="off"') + fText('email', t('field.email'), '', 'type="email" maxlength="200" autocomplete="off"') +
      pinFields('access.initialPin') + '<p class="t-foot muted" style="margin:0">' + esc(t('access.addFoot')) + '</p>',
    submitLabel: t('common.add'),
    onSubmit: async (v) => {
      if (v.pin !== v.pin2) throw new ApiError('VALIDATION', t('err.pinMismatch'));
      const u = await api.call('admin.users.create', { name: v.name, email: v.email, pin: v.pin });
      state.users.push(u);
    }
  }),
  'reset-user-pin': (el) => openSheet({
    title: t('access.resetPin'),
    body: '<p class="t-sub muted" style="margin:0 0 16px">' + esc(el.dataset.email) + '</p>' + pinFields('access.newPin') +
      '<p class="t-foot muted" style="margin:0">' + esc(t('access.resetFoot')) + '</p>',
    submitLabel: t('access.resetPin'),
    onSubmit: async (v) => {
      if (v.pin !== v.pin2) throw new ApiError('VALIDATION', t('err.pinMismatch'));
      await api.call('admin.users.resetPin', { email: el.dataset.email, newPin: v.pin });
    }
  }),
  'set-lang': (el) => {
    // Pertahankan isian email di halaman Masuk saat bahasa diganti
    const email = $('#lg-email') ? $('#lg-email').value : '';
    setLang(el.dataset.v, true);
    render();
    if (email && $('#lg-email')) $('#lg-email').value = email;
  },
  'install': async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch (e) { /* abaikan */ }
    installPrompt = null;
    render();
  },
  'logout': async () => {
    if (!state.offline) { try { await api.call('auth.logout'); } catch (e) { /* tetap keluar di perangkat ini */ } }
    session.clear();
    Object.assign(state, { user: null, data: null, users: null, offline: false, phase: 'login' });
    location.hash = '#/ringkasan';
    render();
  },
  'retry-load': () => loadData()
};

const CHANGE = {
  'move-section': (el) => {
    if (blockedOffline()) { render(); return; }
    el.disabled = true; moveSection(el.dataset.id, el.value);
  },
  'user-active': async (el) => {
    const aktif = el.checked;
    el.disabled = true;
    try {
      await api.call('admin.users.setActive', { email: el.dataset.email, active: aktif });
      const u = state.users.find(x => x.email === el.dataset.email);
      if (u) u.active = aktif;
      el.disabled = false;
      showBanner(t(aktif ? 'access.activated' : 'access.deactivated'), 'green');
    } catch (e) { el.checked = !aktif; el.disabled = false; handleErr(e); }
  }
};

/** Memindah subbab ke tahap lain. Tampilan baru dianggap tersimpan setelah server membalas;
 *  bila gagal, render() mengembalikan kartu ke kolom asal. */
async function moveSection(id, stage) {
  try {
    replaceRow('sections', await api.call('section.update', { id: Number(id), stage: Number(stage) }));
  } catch (e) {
    handleErr(e);
  }
  render();
}

const FORMS = {
  login: async (form) => {
    const err = $('.err', form), btn = $('button[type=submit]', form);
    const email = form.email.value.trim(), pin = form.pin.value, remember = form.remember.checked;
    if (!email || !pin) { err.textContent = t('login.fillBoth'); return; }
    btn.disabled = true; btn.innerHTML = '<span class="spinner sm" style="border-top-color:#fff"></span>' + esc(t('login.busy')); err.textContent = '';
    try {
      const res = await api.call('auth.login', { email: email, pin: pin, remember: remember });
      session.save(res.token, remember);
      state.user = res.user;
      await loadData();
    } catch (e) {
      btn.disabled = false; btn.textContent = t('login.submit');
      form.pin.value = '';
      err.textContent = e.message;
      form.pin.focus();
    }
  },
  'change-pin': async (form) => {
    const status = $('.save-status', form), btn = $('button[type=submit]', form);
    if (blockedOffline()) return;
    const v = { oldPin: form.oldPin.value, newPin: form.newPin.value };
    if (v.newPin !== form.newPin2.value) { status.className = 'save-status err'; status.innerHTML = icon('alert') + esc(t('err.pinMismatch')); return; }
    btn.disabled = true; status.className = 'save-status'; status.innerHTML = '<span class="spinner sm"></span>' + esc(t('common.saving'));
    try {
      await api.call('auth.changePin', v);
      form.reset();
      status.className = 'save-status ok'; status.innerHTML = icon('check') + esc(t('account.pinChanged'));
    } catch (e) {
      status.className = 'save-status err'; status.innerHTML = icon('alert') + esc(e.message);
    }
    btn.disabled = false;
  }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = UI[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (form && FORMS[form.dataset.form]) { e.preventDefault(); FORMS[form.dataset.form](form); }
});

/* ---------- Seret kartu di Papan (laptop dan tablet) ----------
   Mouse/pena: seret langsung. Sentuh: tahan ±0,3 detik, lalu seret.
   Di HP (< 768 px) papan tampil per tahap, jadi pemindahan memakai pilihan tahap. */
const drag = { card: null, active: false, ghost: null, over: null, timer: null, touch: false, x0: 0, y0: 0, x: 0, y: 0, dx: 0, dy: 0 };

function dragReset() {
  clearTimeout(drag.timer);
  if (drag.ghost) drag.ghost.remove();
  if (drag.card) drag.card.classList.remove('dragging');
  if (drag.over) drag.over.classList.remove('drop');
  document.body.classList.remove('is-dragging');
  Object.assign(drag, { card: null, active: false, ghost: null, over: null, timer: null });
}
function dragStart() {
  const card = drag.card;
  if (!card || !card.isConnected) return dragReset();
  const r = card.getBoundingClientRect();
  drag.dx = drag.x - r.left; drag.dy = drag.y - r.top;
  const g = card.cloneNode(true);
  g.classList.add('ghost'); g.removeAttribute('data-id');
  g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
  $$('select', g).forEach(x => x.remove());
  document.body.appendChild(g);
  drag.ghost = g; drag.active = true;
  card.classList.add('dragging');
  document.body.classList.add('is-dragging');
}
function dragMove() {
  drag.ghost.style.left = (drag.x - drag.dx) + 'px';
  drag.ghost.style.top = (drag.y - drag.dy) + 'px';
  const el = document.elementFromPoint(drag.x, drag.y);
  const col = el && el.closest('.board-desktop .col[data-stage]');
  if (col !== drag.over) {
    if (drag.over) drag.over.classList.remove('drop');
    if (col && Number(col.dataset.stage) !== Number(drag.card.dataset.stage)) col.classList.add('drop');
    drag.over = col;
  }
  // Gulir papan ke samping saat kartu dibawa ke tepi
  const board = $('.board-desktop');
  if (board) {
    const b = board.getBoundingClientRect();
    if (drag.x > b.right - 48) board.scrollLeft += 14;
    else if (drag.x < b.left + 48) board.scrollLeft -= 14;
  }
}
function dragDrop() {
  const card = drag.card, col = drag.over;
  const id = card.dataset.id, dari = Number(card.dataset.stage);
  const ke = col ? Number(col.dataset.stage) : dari;
  dragReset();
  if (ke === dari) return;
  if (blockedOffline()) return;
  // Tampilkan kartu di kolom tujuan dalam keadaan menunggu server
  col.appendChild(card);
  card.classList.add('pending');
  const sel = $('select', card); if (sel) sel.disabled = true;
  card.insertAdjacentHTML('beforeend', '<div class="pending-note t-foot muted"><span class="spinner sm"></span>' + esc(t('common.saving')) + '</div>');
  moveSection(id, ke);
}

document.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.board-desktop .card[data-drag]');
  if (!card || drag.card || (e.pointerType === 'mouse' && e.button !== 0)) return;
  if (e.target.closest('select, button, a, input, label')) return;
  Object.assign(drag, { card: card, touch: e.pointerType === 'touch', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
  if (drag.touch) drag.timer = setTimeout(dragStart, 280);
  else e.preventDefault(); // cegah teks ikut terseleksi saat menyeret dengan mouse
});
document.addEventListener('pointermove', (e) => {
  if (!drag.card) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.active) {
    const jarak = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
    if (drag.touch) { if (jarak > 8) dragReset(); }  // bergerak sebelum ditahan = menggulir
    else if (jarak > 6) dragStart();
    return;
  }
  dragMove();
});
document.addEventListener('pointerup', () => { if (drag.active) dragDrop(); else dragReset(); });
document.addEventListener('pointercancel', dragReset);
document.addEventListener('touchmove', (e) => { if (drag.active) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => { if (drag.card) e.preventDefault(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag.active) dragReset(); });


/* =========================================================
   8. ROUTER & INIT
   ========================================================= */
const ROUTES = [
  [/^ringkasan$/, 'nav.ringkasan', () => vRingkasan()],
  [/^penulisan$/, 'nav.penulisan', () => vBab()],
  [/^penulisan\/papan$/, 'nav.papan', () => vPapan(), true],
  [/^penulisan\/terlambat$/, 'nav.terlambat', () => vTerlambat()],
  [/^bab\/(\d+)$/, 'nav.bab', (m) => vBabDetail({ id: m[1] })],
  [/^masukan$/, 'nav.masukan', () => vMasukan(false)],
  [/^masukan\/semua$/, 'nav.logMasukan', () => vMasukan(true)],
  [/^log$/, 'nav.logBimbingan', () => vBimbingan()],
  [/^log\/ai$/, 'nav.logAi', () => vAiLog()],
  [/^lainnya$/, 'nav.lainnya', () => vLainnya()],
  [/^todo$/, 'nav.todo', () => vTodo()],
  [/^bacaan$/, 'nav.bacaan', () => vBacaan()],
  [/^linimasa$/, 'nav.linimasa', () => vLinimasa()],
  [/^syarat$/, 'nav.syarat', () => vSyarat()],
  [/^prompt$/, 'nav.prompt', () => vPrompt()],
  [/^akses$/, 'nav.akses', () => vAkses()],
  [/^akun$/, 'nav.akun', () => vAkun()]
];

function resolveRoute() {
  let key = location.hash.replace(/^#\/?/, '') || 'ringkasan';
  if (!allowed(key)) key = 'ringkasan';
  for (const r of ROUTES) {
    const m = key.match(r[0]);
    if (m) return { key: key, title: t(r[1]), view: () => r[2](m), wide: !!r[3] };
  }
  return { key: 'ringkasan', title: t('nav.ringkasan'), view: () => vRingkasan(), wide: false };
}

let lastKey = null;
function render() {
  const app = $('#app');
  if (state.phase === 'boot') { app.innerHTML = '<div class="boot"><div class="spinner" role="status" aria-label="' + esc(t('common.loading')) + '"></div></div>'; return; }
  if (state.phase === 'login' || !state.user) { app.innerHTML = vLogin(); document.title = t('login.docTitle'); setTimeout(() => { const f = $('#lg-email'); if (f && !f.value) f.focus(); }, 30); lastKey = null; return; }
  if (state.phase === 'error') { app.innerHTML = vLoadError(); return; }
  const r = resolveRoute();
  currentKey = r.key;
  const keepScroll = r.key === lastKey;
  const y = window.scrollY;
  const bx = keepScroll && $('.board-desktop') ? $('.board-desktop').scrollLeft : 0;
  app.innerHTML = shell(state.data ? r.view() : vLoading(), r.key, r.wide);
  window.scrollTo(0, keepScroll ? y : 0);
  if (bx && $('.board-desktop')) $('.board-desktop').scrollLeft = bx;
  lastKey = r.key;
  document.title = r.title + ' – Thesis Tracker';
  snapshot.save();
}

/** Memuat ulang data di belakang layar (tanpa kerangka), mis. setelah "Coba lagi" atau saat koneksi kembali. */
async function refreshData() {
  try {
    const res = await api.call('data.bootstrap');
    state.user = res.user; state.data = res.data; state.offline = false;
    render();
  } catch (e) { if (e.code !== 'NETWORK') handleErr(e); }
}

async function loadData() {
  state.phase = 'app'; state.data = null; render();
  try {
    const res = await api.call('data.bootstrap');
    state.user = res.user;
    state.data = res.data;
    state.offline = false;
    state.phase = 'app';
    render();
  } catch (e) {
    if (e.code === 'AUTH_REQUIRED') return;
    // Offline: tampilkan salinan baca-saja bila ada (K10)
    const snap = e.code === 'NETWORK' ? snapshot.load() : null;
    if (snap) {
      Object.assign(state, { user: snap.user, data: snap.data, offline: true, snapshotAt: snap.at, phase: 'app' });
      render();
      return;
    }
    state.loadError = e.message; state.loadErrorCode = e.code; state.phase = 'error'; render();
  }
}

window.addEventListener('hashchange', () => { closeSheet(); render(); });
window.addEventListener('online', () => { if (state.offline) refreshData(); else if (state.phase === 'error' && state.loadErrorCode === 'NETWORK') loadData(); });

/* PWA */
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; if (currentKey === 'akun' && state.phase === 'app') render(); });
window.addEventListener('appinstalled', () => { installPrompt = null; if (currentKey === 'akun' && state.phase === 'app') render(); });
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* tanpa service worker, aplikasi tetap jalan */ }); });
}

(function init() {
  setLang(detectLang());
  session.load();
  if (!session.token) { state.phase = 'login'; render(); return; }
  state.user = { name: '', email: '', role: 'supervisor' }; // sementara, diganti hasil bootstrap
  loadData();
})();
