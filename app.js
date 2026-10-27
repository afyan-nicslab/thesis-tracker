/* Thesis Tracker v2 — logika halaman
   Acuan: docs/ARCHITECTURE.md bagian 2. Urutan bagian:
   1 config · 2 util · 3 api & sesi · 4 state & hitung · 5 komponen · 6 views · 7 aksi UI · 8 router & init
   Aturan: semua teks dari data lewat esc(); semua panggilan server lewat api.call(). */
'use strict';

/* =========================================================
   1. CONFIG
   ========================================================= */
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxzzjxSbVnCuCAVUy1zWdDUcuMh2ovlZeZKrsrHImHOQiAe1juPd-rvFE7s_LUSQe4/exec',
  VERSION: '2.0.0',
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
/** Mengubah YYYY-MM-DD atau ISO menjadi objek Date (tengah hari Jakarta agar tidak bergeser hari). */
function toDate(v) {
  if (!v) return null;
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00+07:00') : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
/** "27 Okt 2026" */
function fmtDate(v) {
  const d = toDate(v);
  return d ? new Intl.DateTimeFormat('id-ID', { timeZone: CONFIG.TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(d) : '';
}
/** "27 Okt 2026, 09.15" */
function fmtDateTime(v) {
  const d = toDate(v);
  return d ? new Intl.DateTimeFormat('id-ID', { timeZone: CONFIG.TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d) : '';
}
/** "November 2026" dari "2026-11" atau tanggal. */
function fmtMonth(v) {
  const s = String(v || '');
  const d = toDate(/^\d{4}-\d{2}$/.test(s) ? s + '-15' : s);
  return d ? new Intl.DateTimeFormat('id-ID', { timeZone: CONFIG.TZ, month: 'long', year: 'numeric' }).format(d) : s;
}
/** Selisih hari dari hari ini ke tanggal (positif = masa depan). */
function daysFromToday(ymd) {
  const a = toDate(todayStr()), b = toDate(String(ymd).slice(0, 10));
  return a && b ? Math.round((b - a) / 86400000) : null;
}
/** Teks relatif: "hari ini", "besok", "5 hari lagi", "lewat 3 hari". */
function relDays(ymd) {
  const n = daysFromToday(ymd);
  if (n === null) return '';
  if (n === 0) return 'hari ini';
  if (n === 1) return 'besok';
  if (n === -1) return 'kemarin';
  return n > 0 ? n + ' hari lagi' : 'lewat ' + Math.abs(n) + ' hari';
}
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
   3. API & SESI
   ========================================================= */
class ApiError extends Error {
  constructor(code, message) { super(message); this.code = code; }
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
    } catch (e) { /* penyimpanan browser tidak tersedia: sesi hanya hidup selama halaman terbuka */ }
  },
  clear() {
    this.token = null;
    try { sessionStorage.removeItem('tt_token'); localStorage.removeItem('tt_token'); } catch (e) { /* abaikan */ }
  }
};

const api = {
  /** Satu-satunya pintu ke server. Menambahkan token dan menerjemahkan error. */
  async call(action, payload) {
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
      throw new ApiError('NETWORK', 'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.');
    }
    if (!res || !res.ok) {
      const err = (res && res.error) || { code: 'SERVER', message: 'Terjadi kesalahan di server. Coba lagi.' };
      if (err.code === 'AUTH_REQUIRED' && action !== 'auth.login') {
        session.clear();
        state.user = null; state.data = null; state.phase = 'login';
        render();
        showBanner('Sesi sudah berakhir. Silakan masuk lagi.', 'orange');
      }
      throw new ApiError(err.code, err.message);
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
  todoFilter: 'semua',
  papanStage: 0,
  openPrompts: new Set(),
  loadError: ''
};

const STAGES = [
  { v: 0, label: 'Belum mulai', c: 'var(--gray)' },
  { v: 1, label: 'Draf', c: 'var(--orange)' },
  { v: 2, label: 'Revisi', c: 'var(--yellow)' },
  { v: 3, label: 'Di pembimbing', c: 'var(--teal)' },
  { v: 4, label: 'Final', c: 'var(--green)' }
];
const FB_STATUS = { open: { label: 'Terbuka', c: 'var(--red)' }, doing: { label: 'Dikerjakan', c: 'var(--orange)' }, done: { label: 'Selesai', c: 'var(--green)' } };
const FROM = { P1: 'Pembimbing 1', P2: 'Pembimbing 2', PENGUJI: 'Penguji Sempro' };
const DOCS = { CN: { label: 'Concept Note', c: 'var(--teal)' }, PROP: { label: 'Proposal', c: 'var(--indigo)' }, TESIS: { label: 'Tesis', c: 'var(--purple)' } };
const VERIFY = { '': { label: 'Belum dicek', c: 'var(--gray)' }, 'perlu-cek': { label: 'Perlu dicek', c: 'var(--orange)' }, 'terverifikasi': { label: 'Terverifikasi', c: 'var(--green)' } };
const REQ_STAGES = [
  { v: 'sempro', label: 'Seminar proposal' },
  { v: 'semhas', label: 'Seminar hasil' },
  { v: 'sidang', label: 'Sidang tesis' }
];
const HELP_TYPES = ['Tutor', 'Kritik', 'Cek logika', 'Lainnya'];
const BIMBINGAN_MIN = 10, SEMPRO_ATTEND_MIN = 5, TOTAL_ATTEND_MIN = 10;

const isOwner = () => !!state.user && state.user.role === 'owner';
const D = () => state.data || {};
const rows = (t) => D()[t] || [];
const byId = (t, id) => rows(t).find(r => Number(r.id) === Number(id));

/** Mengganti baris di state dengan versi dari server (atau menambahkannya). */
function replaceRow(t, row) {
  const list = rows(t);
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
  if (!ch) return 'Bab tidak ditemukan';
  return ch.number ? 'Bab ' + ch.number + ' ' + ch.title : ch.title;
}
function sectionLabel(s) { return (s.number ? s.number + ' ' : '') + s.title; }
const bimbinganCount = () => rows('bimbingan').length;
const semproAttendance = () => rows('attendance').filter(a => a.type === 'sempro').length;
const totalAttendance = () => rows('attendance').length;
function reqProgress(stage) {
  const list = rows('requirements').filter(r => r.stage === stage);
  return { done: list.filter(r => r.done).length, total: list.length };
}


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
const stageCap = (v) => { const s = STAGES[Number(v) || 0]; return cap(s.label, s.c); };
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
/** Judul halaman. Pembimbing melihat kapsul "Hanya baca" kecuali di halaman yang bisa ia ubah. */
const SUPERVISOR_WRITABLE = ['Masukan', 'Akun', 'Lainnya'];
function pageHead(title, sub, tools) {
  const ro = (!isOwner() && state.user && SUPERVISOR_WRITABLE.indexOf(title) < 0) ? cap('Hanya baca', 'var(--gray)', 'readonly-cap') : '';
  return '<header class="page-head"><div><h1 class="t-large">' + esc(title) + ro + '</h1>' +
    (sub ? '<p class="sub t-sub muted">' + sub + '</p>' : '') + '</div>' +
    (tools ? '<div class="page-tools">' + tools + '</div>' : '') + '</header>';
}
function seg(items, current) {
  return '<nav class="seg" aria-label="Pilihan tampilan">' + items.map(it =>
    '<a href="' + it[0] + '" class="' + (it[0] === current ? 'on' : '') + '"' + (it[0] === current ? ' aria-current="page"' : '') + '>' + esc(it[1]) + '</a>').join('') + '</nav>';
}

/* Banner melayang (pengganti alert) */
function showBanner(msg, color, sticky) {
  let area = $('.toast-area');
  if (!area) { area = document.createElement('div'); area.className = 'toast-area'; document.body.appendChild(area); }
  const el = document.createElement('div');
  el.className = 'banner'; el.setAttribute('role', 'alert'); el.style.setProperty('--c', 'var(--' + (color || 'red') + ')');
  el.innerHTML = icon(color === 'green' ? 'check' : 'alert') + '<div class="grow">' + esc(msg) + '</div><button type="button" aria-label="Tutup">' + icon('x') + '</button>';
  el.querySelector('button').addEventListener('click', () => el.remove());
  area.innerHTML = ''; area.appendChild(el);
  if (!sticky) setTimeout(() => el.remove(), color === 'red' ? 8000 : 4000);
}
function handleErr(e) {
  if (e && e.code === 'AUTH_REQUIRED') return; // sudah diarahkan ke halaman Masuk
  showBanner((e && e.message) || 'Terjadi kesalahan. Coba lagi.', 'red');
}

/* Sheet: formulir yang muncul dari bawah (HP) atau dialog di tengah (laptop) */
let sheetCleanup = null;
function closeSheet() { if (sheetCleanup) sheetCleanup(); }
/**
 * opts: { title, body (HTML berisi field), submitLabel, onSubmit(values) → Promise, extraLeft (HTML), readOnly }
 * onSubmit melempar error → pesan tampil di sheet; berhasil → sheet tertutup.
 */
function openSheet(opts) {
  closeSheet();
  const lastFocus = document.activeElement;
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sheet = document.createElement('div');
  sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', opts.title);
  sheet.innerHTML = '<div class="grabber"></div><form novalidate>' +
    '<div class="sheet-head"><h2 class="t-2">' + esc(opts.title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
    opts.body +
    '<div class="sheet-foot"><span class="save-status" aria-live="polite"></span><div class="btns">' + (opts.extraLeft || '') +
    (opts.readOnly ? '' : '<button type="submit" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '">' + esc(opts.submitLabel || 'Simpan') + '</button>') +
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
    status.className = 'save-status'; status.innerHTML = '<span class="spinner sm"></span>Menyimpan…';
    try {
      await opts.onSubmit(values, form);
      closeSheet();
      render();
    } catch (err) {
      btns.forEach(b => { b.disabled = false; });
      status.className = 'save-status err';
      status.innerHTML = icon('alert') + esc(err.message || 'Gagal menyimpan. Coba lagi.');
      if (err.code === 'AUTH_REQUIRED') closeSheet();
    }
  });
  const first = $('input:not([type=hidden]), select, textarea', sheet);
  setTimeout(() => (first || $('[data-close]', sheet)).focus(), 60);
  if (opts.afterOpen) opts.afterOpen(sheet);
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


/* =========================================================
   6. VIEWS
   Setiap view mengembalikan HTML. Event ditangani lewat data-act (bagian 7).
   ========================================================= */

/* ---------- Kerangka: sidebar, tab bar ---------- */
const OWNER_ONLY = ['todo', 'prompt', 'akses'];
const SIDEBAR = [
  { items: [['ringkasan', 'Ringkasan', 'home']] },
  { title: 'Penulisan', items: [['penulisan', 'Bab', 'book'], ['penulisan/papan', 'Papan Penulisan', 'columns'], ['penulisan/terlambat', 'Terlambat', 'clock']] },
  { title: 'Masukan', items: [['masukan', 'Masukan terbuka', 'message'], ['masukan/semua', 'Log masukan', 'list']] },
  { title: 'Persiapan', items: [['todo', 'To-Do', 'checklist'], ['bacaan', 'Bacaan', 'bookmark'], ['linimasa', 'Linimasa', 'calendar']] },
  { title: 'Administrasi', items: [['syarat', 'Syarat', 'shield'], ['log', 'Log Bimbingan', 'users'], ['log/ai', 'Log AI Disclosure', 'sparkle']] },
  { title: 'Alat', items: [['prompt', 'Prompt', 'terminal']] },
  { title: 'Pengaturan', items: [['akses', 'Kelola Akses', 'key'], ['akun', 'Akun', 'user']] }
];
const TABS = [['ringkasan', 'Ringkasan', 'home'], ['penulisan', 'Penulisan', 'book'], ['masukan', 'Masukan', 'message'], ['log', 'Log', 'clipboard'], ['lainnya', 'Lainnya', 'more']];
function tabOf(key) {
  if (key === 'ringkasan') return 'ringkasan';
  if (key.startsWith('penulisan') || key.startsWith('bab')) return 'penulisan';
  if (key.startsWith('masukan')) return 'masukan';
  if (key.startsWith('log')) return 'log';
  return 'lainnya';
}
const allowed = (key) => isOwner() || OWNER_ONLY.indexOf(key.split('/')[0]) < 0;

function shell(content, routeKey, wide) {
  const counts = { 'masukan': openFeedback().length, 'penulisan/terlambat': overdueSections().length };
  const side = SIDEBAR.map(g => {
    const items = g.items.filter(it => allowed(it[0]));
    if (!items.length) return '';
    return '<div class="group">' + (g.title ? '<div class="group-title t-foot muted">' + esc(g.title) + '</div>' : '') +
      items.map(it => '<a href="#/' + it[0] + '" class="' + (routeKey === it[0] || (it[0] === 'penulisan' && routeKey.startsWith('bab/')) ? 'on' : '') + '">' +
        icon(it[2]) + '<span>' + esc(it[1]) + '</span>' + (counts[it[0]] ? '<span class="count num">' + counts[it[0]] + '</span>' : '') + '</a>').join('') + '</div>';
  }).join('');
  const tab = tabOf(routeKey);
  return '<div class="shell">' +
    '<nav class="sidebar" aria-label="Menu utama"><div class="brand t-head">Thesis Tracker</div>' + side +
    '<div class="me t-foot"><div class="t-sub">' + esc(state.user.name) + '</div><div class="muted">' + (isOwner() ? 'Pemilik' : 'Pembimbing') + '</div></div></nav>' +
    '<main class="main' + (wide ? ' wide' : '') + '" id="main">' + content + '</main>' +
    '<nav class="tabbar" aria-label="Menu utama">' + TABS.map(t => '<a href="#/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + icon(t[2]) + '<span>' + esc(t[1]) + '</span></a>').join('') + '</nav>' +
    '</div>';
}

/* ---------- Masuk ---------- */
function vLogin() {
  return '<main class="login"><form class="login-card" data-form="login" novalidate>' +
    '<div class="app-mark">' + icon('grad') + '</div>' +
    '<h1 class="t-1">Thesis Tracker</h1><p class="lead t-sub muted">Masuk untuk melihat progres tesis.</p>' +
    '<div class="stack">' +
    '<label class="visually-hidden" for="lg-email">Email</label><input class="input" id="lg-email" name="email" type="email" autocomplete="username" placeholder="Email" required>' +
    '<label class="visually-hidden" for="lg-pin">PIN</label><input class="input" id="lg-pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" required>' +
    '</div>' +
    '<div class="toggle-row"><span>Ingat perangkat ini</span><label class="switch"><input type="checkbox" name="remember" aria-label="Ingat perangkat ini"><span></span></label></div>' +
    '<button class="btn btn-primary btn-block" type="submit">Masuk</button>' +
    '<p class="err" role="alert"></p>' +
    '</form></main>';
}

/* ---------- Ringkasan ---------- */
function vRingkasan() {
  const ms = rows('milestones');
  const path = ms.length ? '<ol class="path" aria-label="Jalur menuju Sidang">' + ms.map(m => {
    let when = '';
    if (/bimbingan/i.test(m.name)) when = bimbinganCount() + ' dari ' + BIMBINGAN_MIN + ' kali';
    if (m.date) when = (when ? when + '. ' : '') + (m.status === 'done' ? 'Selesai ' : 'Target ') + fmtDate(m.date);
    const inner = '<span class="dot">' + (m.status === 'done' ? icon('check') : '') + '</span>' +
      '<span class="name">' + esc(m.name) + '</span>' + (when ? '<span class="when">' + esc(when) + '</span>' : '');
    return '<li class="' + esc(m.status) + '">' + (isOwner()
      ? '<button class="step" data-act="edit-milestone" data-id="' + m.id + '" aria-label="Ubah status ' + esc(m.name) + '">' + inner + '</button>'
      : '<div class="step">' + inner + '</div>') + '</li>';
  }).join('') + '</ol>' : emptyState('grad', 'Jalur belum diisi', 'Jalankan seedStructure() di editor Apps Script untuk mengisi jalur menuju Sidang.');

  const late = overdueSections().length, open = openFeedback().length;
  const sp = reqProgress('sempro');
  const stats = '<div class="stats">' +
    '<a class="stat' + (late ? ' alert' : '') + '" href="#/penulisan/terlambat"><div class="n">' + late + '</div><div class="l">Subbab terlambat</div></a>' +
    '<a class="stat' + (open ? ' alert' : '') + '" href="#/masukan"><div class="n">' + open + '</div><div class="l">Masukan terbuka</div></a>' +
    '<a class="stat" href="#/log"><div class="n">' + bimbinganCount() + '<small> / ' + BIMBINGAN_MIN + '</small></div><div class="l">Bimbingan</div></a>' +
    '<a class="stat" href="#/syarat"><div class="n">' + sp.done + '<small> / ' + sp.total + '</small></div><div class="l">Syarat Sempro</div></a>' +
    '</div>';

  const chs = rows('chapters');
  const prog = chs.length ? group('Progres bab', chs.map(ch => {
    const p = chapterProgress(ch.id);
    return '<a class="row ch-row" href="#/bab/' + ch.id + '"><span class="title t-head">' + esc(chapterLabel(ch)) + '</span>' + bar(p.pct) + '</a>';
  }).join('')) : '';

  const sup = D().supervisors || [];
  const supLine = sup.length ? 'Pembimbing: ' + esc(sup.map(s => s.name).join(', ')) : (isOwner() ? 'Calon pembimbing belum ditambahkan ke tracker.' : '');
  return pageHead('Ringkasan', 'Halo, ' + esc(firstName(state.user.name)) + '. ' + supLine) + path + stats + prog;
}

/* ---------- Penulisan: daftar bab ---------- */
const PEN_SEG = [['#/penulisan', 'Bab'], ['#/penulisan/papan', 'Papan'], ['#/penulisan/terlambat', 'Terlambat']];
function chapterRow(ch) {
  const p = chapterProgress(ch.id);
  const fb = openFeedback(ch.id).length;
  const target = ch.target_date ? 'Target ' + fmtDate(ch.target_date) + ', ' + relDays(ch.target_date) : 'Belum ada tanggal target';
  return '<a class="row ch-row" href="#/bab/' + ch.id + '"><span class="title t-head">' + esc(chapterLabel(ch)) + '</span>' + bar(p.pct) +
    '<span class="lines"><span class="t-foot muted">' + p.final + ' dari ' + p.total + ' subbab final</span><span class="t-foot muted">' + esc(target) + '</span>' +
    (fb ? cap(fb + ' masukan terbuka', 'var(--red)') : '') + '</span></a>';
}
function vBab() {
  const chs = rows('chapters');
  if (!chs.length) return pageHead('Penulisan') + seg(PEN_SEG, '#/penulisan') + emptyState('book', 'Belum ada bab', 'Jalankan seedStructure() di editor Apps Script untuk mengisi bab dan subbab dari Panduan Tesis.');
  const groups = Object.keys(DOCS).map(doc => {
    const list = chs.filter(c => c.doc === doc);
    return list.length ? group(DOCS[doc].label, list.map(chapterRow).join('')) : '';
  }).join('');
  return pageHead('Penulisan') + seg(PEN_SEG, '#/penulisan') + groups;
}

/* ---------- Detail bab ---------- */
function sectionRow(s, withChapter) {
  const late = isOverdue(s);
  const meta = [];
  if (withChapter) meta.push(esc(chapterLabel(byId('chapters', s.chapter_id))));
  if (s.due_date) meta.push('<span style="' + (late ? 'color:var(--red)' : '') + '">Tenggat ' + esc(fmtDate(s.due_date)) + ', ' + esc(relDays(s.due_date)) + '</span>');
  if (s.words) meta.push(esc(s.words.toLocaleString('id-ID')) + ' kata');
  const body = '<span class="grow"><span class="title">' + esc(sectionLabel(s)) + '</span>' + (meta.length ? '<span class="meta small">' + meta.join('<br>') + '</span>' : '') + '</span>' + stageCap(s.stage);
  return isOwner()
    ? '<button class="row" data-act="edit-section" data-id="' + s.id + '">' + body + icon('chevron', 'chev') + '</button>'
    : '<div class="row">' + body + '</div>';
}
function feedbackRow(f, withChapter) {
  const st = FB_STATUS[f.status] || FB_STATUS.open;
  const lines = [];
  if (withChapter) lines.push(esc(chapterLabel(byId('chapters', f.chapter_id))));
  let l2 = (FROM[f.from] || f.from) + ', diterima ' + fmtDate(f.received_at);
  if (isOpenFb(f)) { const n = -daysFromToday(f.received_at); if (n > 0) l2 += ', menunggu ' + n + ' hari'; }
  lines.push(esc(l2));
  return '<button class="row" data-act="edit-feedback" data-id="' + f.id + '"><span class="grow"><span class="title clamp-2">' + esc(f.title) + '</span><span class="meta small">' + lines.join('<br>') + '</span></span>' + cap(st.label, st.c) + icon('chevron', 'chev') + '</button>';
}
function vBabDetail(params) {
  const ch = byId('chapters', params.id);
  if (!ch) return pageHead('Bab tidak ditemukan') + '<a class="btn btn-plain" href="#/penulisan">' + icon('back') + 'Kembali ke Penulisan</a>';
  const p = chapterProgress(ch.id);
  const secs = sectionsOf(ch.id);
  const fbs = rows('feedback').filter(f => Number(f.chapter_id) === Number(ch.id)).sort((a, b) => (isOpenFb(b) - isOpenFb(a)) || String(b.received_at).localeCompare(String(a.received_at)));
  const target = ch.target_date ? fmtDate(ch.target_date) + ', ' + relDays(ch.target_date) : 'Belum diatur';
  const head = '<a class="btn btn-plain" href="#/penulisan" style="margin-left:-6px">' + icon('back') + 'Penulisan</a>' +
    '<header class="page-head"><div><div style="margin-bottom:6px">' + cap(DOCS[ch.doc] ? DOCS[ch.doc].label : ch.doc, DOCS[ch.doc] ? DOCS[ch.doc].c : 'var(--gray)') + '</div><h1 class="t-1">' + esc(chapterLabel(ch)) + '</h1></div></header>' +
    '<div style="margin-bottom:8px">' + bar(p.pct) + '</div><p class="t-foot muted" style="margin:0 0 24px">' + p.final + ' dari ' + p.total + ' subbab final</p>';
  const info = group('', '<div class="row"><span class="grow">Tanggal target</span><span class="detail">' + esc(target) + '</span>' +
    (isOwner() ? '<button class="btn btn-plain" data-act="edit-chapter" data-id="' + ch.id + '">Ubah</button>' : '') + '</div>');
  const secList = secs.length ? group('Subbab', secs.map(s => sectionRow(s)).join(''), isOwner() ? 'Ketuk subbab untuk mengubah tahap, tenggat, atau jumlah kata.' : '') : '';
  const fbList = group('Masukan untuk bab ini', fbs.length ? fbs.map(f => feedbackRow(f)).join('') : '<div class="row muted t-sub">Belum ada masukan.</div>');
  const add = '<button class="btn btn-tinted" data-act="new-feedback" data-ch="' + ch.id + '" style="margin:-16px 0 28px">' + icon('plus') + 'Tambah masukan</button>';
  return head + info + secList + fbList + add;
}

/* ---------- Papan Penulisan ---------- */
function boardCard(s) {
  const ch = byId('chapters', s.chapter_id);
  const late = isOverdue(s);
  const move = isOwner() ? '<label class="visually-hidden" for="mv-' + s.id + '">Pindahkan ke</label><select class="select" id="mv-' + s.id + '" data-change="move-section" data-id="' + s.id + '" style="min-height:32px;padding:4px 30px 4px 10px;font-size:13px;width:auto">' +
    STAGES.map(st => '<option value="' + st.v + '"' + (st.v === Number(s.stage) ? ' selected' : '') + '>' + esc(st.label) + '</option>').join('') + '</select>' : '';
  return '<div class="card"><div class="t-sub">' + esc(sectionLabel(s)) + '</div><div class="t-foot muted">' + esc(chapterLabel(ch)) + '</div>' +
    '<div class="row-b"><span class="t-foot" style="color:' + (late ? 'var(--red)' : 'var(--label-2)') + '">' + (s.due_date ? esc(fmtDate(s.due_date)) : '') + '</span>' + move + '</div></div>';
}
function vPapan() {
  const secs = rows('sections');
  if (!secs.length) return pageHead('Papan Penulisan') + seg(PEN_SEG, '#/penulisan/papan') + emptyState('columns', 'Belum ada subbab', 'Isi bab dan subbab lewat seedStructure() di editor Apps Script.');
  const desktop = '<div class="board board-desktop">' + STAGES.map(st => {
    const list = secs.filter(s => Number(s.stage) === st.v);
    return '<section class="col"><div class="col-head">' + cap(st.label, st.c) + '<span class="t-foot muted num">' + list.length + '</span></div>' + list.map(boardCard).join('') + '</section>';
  }).join('') + '</div>';
  const cur = state.papanStage;
  const nCur = secs.filter(s => Number(s.stage) === cur).length;
  const mobile = '<div class="board-mobile"><div class="seg" role="tablist" style="margin-bottom:8px">' + STAGES.map(st =>
    '<button role="tab" aria-selected="' + (st.v === cur) + '" class="' + (st.v === cur ? 'on' : '') + '" data-act="papan-stage" data-v="' + st.v + '">' + esc(st.label.replace('Di pembimbing', 'Pembimbing').replace('Belum mulai', 'Belum')) + '</button>').join('') + '</div>' +
    '<p class="t-foot muted" style="margin:0 4px 12px">' + nCur + ' subbab di tahap ' + esc(STAGES[cur].label.toLowerCase()) + '</p>' +
    (secs.filter(s => Number(s.stage) === cur).map(boardCard).join('') || '<p class="t-sub muted" style="text-align:center;padding:24px 0">Tidak ada subbab di tahap ini.</p>') + '</div>';
  return pageHead('Papan Penulisan', isOwner() ? 'Pindahkan subbab ke tahap berikutnya lewat pilihan di tiap kartu.' : '') + seg(PEN_SEG, '#/penulisan/papan') + desktop + mobile;
}

/* ---------- Terlambat ---------- */
function vTerlambat() {
  const list = overdueSections();
  return pageHead('Terlambat', list.length ? list.length + ' subbab lewat tenggat dan belum final.' : '') + seg(PEN_SEG, '#/penulisan/terlambat') +
    (list.length ? group('', list.map(s => sectionRow(s, true)).join('')) : emptyState('check', 'Tidak ada yang terlambat', 'Subbab yang lewat tenggat dan belum final akan muncul di sini.'));
}

/* ---------- Masukan ---------- */
const FB_SEG = [['#/masukan', 'Terbuka'], ['#/masukan/semua', 'Log masukan']];
function vMasukan(all) {
  let list = rows('feedback').slice();
  if (all) list.sort((a, b) => String(b.received_at).localeCompare(String(a.received_at)) || b.id - a.id);
  else list = list.filter(isOpenFb).sort((a, b) => String(a.received_at).localeCompare(String(b.received_at)) || a.id - b.id);
  const tools = '<button class="btn btn-primary" data-act="new-feedback">' + icon('plus') + 'Tambah</button>';
  const body = list.length ? group('', list.map(f => feedbackRow(f, true)).join(''), all ? '' : 'Yang paling lama menunggu ada di atas.')
    : emptyState('inbox', all ? 'Belum ada masukan' : 'Tidak ada masukan terbuka', all ? 'Masukan dari pembimbing dan penguji akan tercatat di sini.' : 'Masukan baru dari pembimbing akan muncul di sini.');
  return pageHead('Masukan', '', tools) + seg(FB_SEG, all ? '#/masukan/semua' : '#/masukan') + body;
}

/* ---------- Log Bimbingan dan Log AI ---------- */
const LOG_SEG = [['#/log', 'Bimbingan'], ['#/log/ai', 'AI Disclosure']];
function vBimbingan() {
  const list = rows('bimbingan').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const n = list.length;
  const tools = (n ? '<button class="btn btn-tinted" data-act="copy-bimbingan">' + icon('copy') + 'Salin</button>' : '') +
    (isOwner() ? '<button class="btn btn-primary" data-act="new-bimbingan">' + icon('plus') + 'Tambah</button>' : '');
  const counter = group('', '<div class="row" style="display:block"><span class="t-sub"><span class="counter">' + n + '</span> dari ' + BIMBINGAN_MIN + ' bimbingan</span><div style="margin-top:8px">' + bar(n / BIMBINGAN_MIN * 100) + '</div></div>',
    'Bimbingan minimal 10 kali adalah syarat Seminar Hasil (Panduan Tesis 2025, Bab V).');
  const body = n ? group('Riwayat', list.map(b => '<button class="row" data-act="edit-bimbingan" data-id="' + b.id + '"><span class="grow"><span class="title">' + esc(b.topic) + '</span><span class="meta small">' +
    esc(fmtDate(b.date)) + '<br>' + esc((FROM[b.supervisor] || b.supervisor) + ', ' + String(b.mode).toLowerCase()) + '</span></span>' + icon('chevron', 'chev') + '</button>').join(''))
    : emptyState('users', 'Belum ada bimbingan', isOwner() ? 'Catat setiap pertemuan bimbingan agar kartu bimbingan mudah diisi.' : 'Riwayat bimbingan akan muncul di sini.');
  return pageHead('Log', '', tools) + seg(LOG_SEG, '#/log') + counter + body;
}
function vAiLog() {
  const list = rows('ailog').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  const tools = (list.length ? '<button class="btn btn-tinted" data-act="copy-ailog">' + icon('copy') + 'Salin</button>' : '') +
    (isOwner() ? '<button class="btn btn-primary" data-act="new-ailog">' + icon('plus') + 'Tambah</button>' : '');
  const body = list.length ? group('', list.map(a => '<button class="row" data-act="edit-ailog" data-id="' + a.id + '"><span class="grow"><span class="title clamp-2">' + esc(a.purpose) + '</span><span class="meta small">' +
    esc(fmtDate(a.date) + ', ' + a.tool) + (a.thesis_part ? '<br>' + esc(a.thesis_part) : '') + '</span></span>' + cap(a.help_type, 'var(--indigo)') + icon('chevron', 'chev') + '</button>').join(''),
    'Tombol Salin menyusun ringkasan untuk formulir AI disclosure saat mendaftar Seminar Proposal dan Sidang.')
    : emptyState('sparkle', 'Belum ada catatan AI', isOwner() ? 'Catat setiap kali AI membantu pengerjaan tesis, untuk bahan formulir AI disclosure.' : 'Catatan penggunaan AI akan muncul di sini.');
  return pageHead('Log', '', tools) + seg(LOG_SEG, '#/log/ai') + body;
}

/* ---------- Lainnya (menu HP) ---------- */
function vLainnya() {
  const item = (key, label, ic, color, detail) => allowed(key)
    ? '<a class="row has-icon" href="#/' + key + '"><span class="lead-icon" style="background:' + color + '">' + icon(ic) + '</span><span class="grow">' + esc(label) + '</span>' + (detail ? '<span class="detail num">' + esc(detail) + '</span>' : '') + icon('chevron', 'chev') + '</a>' : '';
  const rd = rows('readings'); const tk = rows('tasks');
  return pageHead('Lainnya') +
    group('Persiapan', item('todo', 'To-Do', 'checklist', 'var(--orange)', tk.length ? tk.filter(t => t.done).length + '/' + tk.length : '') + item('bacaan', 'Bacaan', 'bookmark', 'var(--indigo)', rd.length ? rd.filter(r => r.done).length + '/' + rd.length : '') + item('linimasa', 'Linimasa', 'calendar', 'var(--red)')) +
    group('Administrasi', item('syarat', 'Syarat', 'shield', 'var(--green)')) +
    (isOwner() ? group('Alat', item('prompt', 'Prompt', 'terminal', 'var(--gray)')) : '') +
    group('Pengaturan', item('akses', 'Kelola Akses', 'key', 'var(--teal)') + item('akun', 'Akun', 'user', 'var(--gray)'));
}

/* ---------- To-Do ---------- */
function vTodo() {
  const tasks = rows('tasks');
  const f = state.todoFilter;
  const segHtml = '<div class="seg" role="tablist">' + [['semua', 'Semua'], ['belum', 'Belum'], ['selesai', 'Selesai']].map(o =>
    '<button role="tab" aria-selected="' + (o[0] === f) + '" class="' + (o[0] === f ? 'on' : '') + '" data-act="todo-filter" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  if (!tasks.length) return pageHead('To-Do') + emptyState('checklist', 'Belum ada task', 'Isi task di tab Tasks pada Google Sheet, lalu muat ulang halaman ini.');
  const done = tasks.filter(t => t.done).length;
  const phases = rows('phases');
  const groups = (phases.length ? phases : [{ id: null, name: 'Task', focus: '' }]).map(ph => {
    let list = tasks.filter(t => ph.id === null || Number(t.phase_id) === Number(ph.id));
    if (f === 'belum') list = list.filter(t => !t.done);
    if (f === 'selesai') list = list.filter(t => t.done);
    if (!list.length) return '';
    return group(ph.name, list.map(t => '<div class="row' + (t.done ? ' done' : '') + '">' + checkBtn(t.done, 'toggle-task', t.id, 'Tandai selesai: ' + t.title) +
      '<button class="grow" data-act="edit-task" data-id="' + t.id + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(t.title) + '</span>' +
      ((t.desc || t.duration || t.note) ? '<span class="meta small clamp-2">' + esc([t.duration, t.desc].filter(Boolean).join('. ')) + (t.note ? ' ' + cap('Ada catatan', 'var(--tint)') : '') + '</span>' : '') + '</button></div>').join(''), ph.focus ? esc(ph.focus) : '');
  }).join('');
  return pageHead('To-Do', done + ' dari ' + tasks.length + ' selesai') + segHtml + (groups || '<p class="t-sub muted" style="text-align:center">Tidak ada task untuk filter ini.</p>');
}

/* ---------- Bacaan ---------- */
function vBacaan() {
  const list = rows('readings');
  if (!list.length) return pageHead('Bacaan') + emptyState('bookmark', 'Belum ada bacaan', 'Impor daftar bacaan ke tab Readings di Google Sheet, lalu muat ulang halaman ini.');
  const types = [];
  list.forEach(r => { if (types.indexOf(r.type) < 0) types.push(r.type); });
  const done = list.filter(r => r.done).length;
  return pageHead('Bacaan', done + ' dari ' + list.length + ' selesai dibaca') + types.map(tp => group(tp || 'Lainnya', list.filter(r => r.type === tp).map(r => {
    const v = VERIFY[r.verify_status] || VERIFY[''];
    return '<div class="row' + (r.done ? ' done' : '') + '">' + checkBtn(r.done, 'toggle-reading', r.id, 'Tandai sudah dibaca: ' + r.title) +
      '<button class="grow" data-act="edit-reading" data-id="' + r.id + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(r.title) + '</span><span class="meta small">' + esc(r.author) + '</span></button>' +
      (r.verify_status ? cap(v.label, v.c) : '') + '</div>';
  }).join(''))).join('');
}

/* ---------- Linimasa ---------- */
function vLinimasa() {
  const list = rows('timeline');
  if (!list.length) return pageHead('Linimasa') + emptyState('calendar', 'Linimasa masih kosong', 'Isi rencana per bulan di tab Timeline pada Google Sheet (kolom month berformat YYYY-MM).');
  const months = [];
  list.forEach(t => { const m = String(t.month).slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
  months.sort();
  const now = todayStr().slice(0, 7);
  return pageHead('Linimasa', 'Rencana per bulan menuju Sidang.') + months.map(m => group(fmtMonth(m) + (m === now ? ' (bulan ini)' : ''),
    list.filter(t => String(t.month).slice(0, 7) === m).map(t => '<div class="row"><span class="grow"><span class="title">' + esc(t.title) + '</span>' + (t.desc ? '<span class="meta small">' + esc(t.desc) + '</span>' : '') + '</span></div>').join(''))).join('');
}

/* ---------- Syarat ---------- */
function vSyarat() {
  const reqs = rows('requirements');
  const sp = semproAttendance(), tot = totalAttendance();
  const reqGroups = REQ_STAGES.map(st => {
    const list = reqs.filter(r => r.stage === st.v);
    if (!list.length) return '';
    const pr = reqProgress(st.v);
    return group(st.label + ' (' + pr.done + ' dari ' + pr.total + ')', list.map(r => {
      let hint = '';
      if (/minimal 5 kali/.test(r.text)) hint = 'Tercatat ' + sp + ' dari ' + SEMPRO_ATTEND_MIN + ' kehadiran Sempro.';
      if (/minimal 10 kali/.test(r.text) && /hadir/i.test(r.text)) hint = 'Tercatat ' + tot + ' dari ' + TOTAL_ATTEND_MIN + ' kehadiran.';
      if (/Bimbingan minimal 10/.test(r.text)) hint = 'Tercatat ' + bimbinganCount() + ' dari ' + BIMBINGAN_MIN + ' bimbingan.';
      const meta = [r.source, hint, r.evidence ? 'Bukti: ' + r.evidence : ''].filter(Boolean).map(esc).join('<br>');
      return '<div class="row' + (r.done ? ' done' : '') + '">' + checkBtn(r.done, 'toggle-req', r.id, 'Tandai terpenuhi: ' + r.text) +
        (isOwner() ? '<button class="grow" data-act="edit-req" data-id="' + r.id + '" style="background:none;border:0;padding:0;text-align:left">' : '<span class="grow">') +
        '<span class="title">' + esc(r.text) + '</span><span class="meta small">' + meta + '</span>' + (isOwner() ? '</button>' : '</span>') + '</div>';
    }).join(''));
  }).join('');
  const att = rows('attendance').slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const attGroup = group('Kehadiran Sempro dan sidang (' + tot + ')',
    (att.length ? att.map(a => '<div class="row"><span class="grow"><span class="title">' + esc(a.title) + '</span><span class="meta small">' + esc(fmtDate(a.date) + ', ' + (a.type === 'sempro' ? 'Seminar proposal' : 'Sidang')) + (a.note ? '<br>' + esc(a.note) : '') + '</span></span>' +
      (isOwner() ? '<button class="icon-btn" data-act="del-attendance" data-id="' + a.id + '" aria-label="Hapus kehadiran ' + esc(a.title) + '">' + icon('x') + '</button>' : '') + '</div>').join('')
      : '<div class="row muted t-sub">Belum ada kehadiran tercatat.</div>'),
    'Sempro dihadiri: ' + sp + ' dari ' + SEMPRO_ATTEND_MIN + ' (syarat Sempro). Total: ' + tot + ' dari ' + TOTAL_ATTEND_MIN + ' (syarat Seminar Hasil).');
  const addAtt = isOwner() ? '<button class="btn btn-tinted" data-act="new-attendance" style="margin:-16px 0 28px">' + icon('plus') + 'Tambah kehadiran</button>' : '';
  return pageHead('Syarat', 'Syarat administrasi dari Panduan Tesis Tazkia 2025.') +
    (reqGroups || emptyState('shield', 'Belum ada syarat', 'Jalankan seedStructure() di editor Apps Script untuk mengisi syarat dari Panduan Tesis.')) + attGroup + addAtt;
}

/* ---------- Prompt ---------- */
function vPrompt() {
  const list = rows('prompts');
  if (!list.length) return pageHead('Prompt') + emptyState('terminal', 'Belum ada prompt', 'Isi prompt di tab Prompts pada Google Sheet. Utamakan prompt untuk kritik dan tutor, bukan menulis teks jadi.');
  return pageHead('Prompt', 'Prompt untuk kritik dan belajar, sesuai batas AI 15% Tazkia.') + group('', list.map(p => {
    const open = state.openPrompts.has(p.id);
    return '<div class="row" style="display:block"><div style="display:flex;align-items:center;gap:12px"><button class="grow" data-act="toggle-prompt" data-id="' + p.id + '" aria-expanded="' + open + '" style="background:none;border:0;padding:0;text-align:left"><span class="title">' + esc(p.title) + '</span>' +
      (p.category ? '<span class="meta small">' + esc(p.category) + '</span>' : '') + '</button><button class="btn btn-tinted" data-act="copy-prompt" data-id="' + p.id + '">' + icon('copy') + 'Salin</button></div>' +
      (open ? '<div class="prompt-body">' + esc(p.body) + '</div>' : '') + '</div>';
  }).join(''));
}

/* ---------- Kelola Akses ---------- */
function vAkses() {
  if (!state.users) {
    loadUsers();
    return pageHead('Kelola Akses') + '<div class="skel"></div><div class="skel"></div>';
  }
  const tools = '<button class="btn btn-primary" data-act="new-user">' + icon('plus') + 'Pembimbing</button>';
  return pageHead('Kelola Akses', 'Hanya akun di daftar ini yang bisa masuk.', tools) + group('', state.users.map(u => {
    const me = u.email === state.user.email;
    return '<div class="row"><span class="grow"><span class="title">' + esc(u.name) + ' ' + cap(u.role === 'owner' ? 'Pemilik' : 'Pembimbing', u.role === 'owner' ? 'var(--tint)' : 'var(--teal)') + '</span>' +
      '<span class="meta small">' + esc(u.email) + '<br>' + (u.last_login_at ? 'Terakhir masuk ' + esc(fmtDateTime(u.last_login_at)) : 'Belum pernah masuk') + '</span></span>' +
      (me ? '' : '<div class="row-actions"><button class="btn btn-plain" data-act="reset-user-pin" data-email="' + esc(u.email) + '">Reset PIN</button>' +
        '<label class="switch" title="Aktif"><input type="checkbox" data-change="user-active" data-email="' + esc(u.email) + '"' + (u.active ? ' checked' : '') + ' aria-label="Akun ' + esc(u.name) + ' aktif"><span></span></label></div>') + '</div>';
  }).join(''), 'Menonaktifkan akun langsung mengeluarkan akun itu dari semua perangkat. Berikan PIN awal pembimbing lewat jalur pribadi; pembimbing bisa menggantinya sendiri di halaman Akun.');
}

/* ---------- Akun ---------- */
function vAkun() {
  const u = state.user;
  return pageHead('Akun') +
    group('', '<div class="row"><span class="grow">Nama</span><span class="detail">' + esc(u.name) + '</span></div>' +
      '<div class="row"><span class="grow">Email</span><span class="detail">' + esc(u.email) + '</span></div>' +
      '<div class="row"><span class="grow">Peran</span><span class="detail">' + (isOwner() ? 'Pemilik' : 'Pembimbing') + '</span></div>') +
    '<section class="group-wrap"><h2 class="group-label">Ganti PIN</h2><form class="list" data-form="change-pin" novalidate style="padding:16px">' +
    fText('oldPin', 'PIN lama', '', 'type="password" inputmode="numeric" autocomplete="current-password"') +
    fText('newPin', 'PIN baru (6–12 digit, bukan urutan atau angka berulang)', '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
    fText('newPin2', 'Ketik ulang PIN baru', '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
    '<div class="sheet-foot"><span class="save-status" aria-live="polite"></span><button class="btn btn-primary" type="submit">Ganti PIN</button></div></form></section>' +
    '<button class="btn btn-danger btn-block" data-act="logout">' + icon('logout') + 'Keluar</button>' +
    '<p class="t-foot faint" style="text-align:center;margin-top:20px">Thesis Tracker ' + CONFIG.VERSION + '</p>';
}

/* ---------- Memuat dan gagal memuat ---------- */
function vLoading() { return '<div class="skel" style="height:41px;width:60%;margin:8px 0 24px"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>'; }
function vLoadError() {
  return '<main class="login"><div class="login-card" style="text-align:center">' + icon('alert') .replace('class=""', 'class="" style="width:48px;height:48px;color:var(--orange)"') +
    '<h1 class="t-2" style="margin:12px 0 8px">Data belum bisa dimuat</h1><p class="t-sub muted">' + esc(state.loadError) + '</p>' +
    '<button class="btn btn-primary btn-block" data-act="retry-load" style="margin-top:16px">Coba lagi</button>' +
    '<button class="btn btn-plain" data-act="logout" style="margin-top:12px">Keluar</button></div></main>';
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

function sheetFeedback(f, presetChapter) {
  const isNew = !f;
  const mine = f && String(f.created_by).toLowerCase() === String(state.user.email).toLowerCase();
  const canEdit = isNew || isOwner() || mine;
  if (!rows('chapters').length) { showBanner('Belum ada bab. Isi bab lewat seedStructure() dulu.', 'orange'); return; }
  let body;
  if (isNew) {
    body = fArea('title', 'Isi masukan', '', 'rows="3" maxlength="200" required') +
      fSelect('chapterId', 'Bab', chapterOptions(), presetChapter || rows('chapters')[0].id) +
      '<div class="form-grid">' + fSelect('from', 'Dari', Object.keys(FROM).map(k => [k, FROM[k]]), 'P1') + fDate('receivedAt', 'Tanggal diterima', todayStr()) + '</div>' +
      fArea('action', 'Langkahku (opsional)', '', 'rows="2" maxlength="2000"');
  } else if (canEdit) {
    body = fInfo([['Bab', chapterLabel(byId('chapters', f.chapter_id))], ['Dari', FROM[f.from] || f.from], ['Diterima', fmtDate(f.received_at)]]) +
      fArea('title', 'Isi masukan', f.title, 'rows="3" maxlength="200"') +
      fSelect('status', 'Status', Object.keys(FB_STATUS).map(k => [k, FB_STATUS[k].label]), f.status) +
      fArea('action', 'Langkahku', f.action, 'rows="3" maxlength="2000"');
  } else {
    body = fInfo([['Bab', chapterLabel(byId('chapters', f.chapter_id))], ['Dari', FROM[f.from] || f.from], ['Diterima', fmtDate(f.received_at)], ['Status', (FB_STATUS[f.status] || {}).label], ['Langkah', f.action]]) +
      '<p class="t-callout" style="margin:0 0 8px">' + esc(f.title) + '</p>';
  }
  openSheet({
    title: isNew ? 'Masukan baru' : 'Masukan',
    body: body,
    readOnly: !canEdit,
    submitLabel: isNew ? 'Tambah masukan' : 'Simpan',
    onSubmit: async (v) => {
      if (isNew) {
        if (!v.title.trim()) throw new ApiError('VALIDATION', 'Isi masukan wajib diisi.');
        replaceRow('feedback', await api.call('feedback.create', { title: v.title, chapterId: Number(v.chapterId), from: v.from, receivedAt: v.receivedAt, nextStep: v.action }));
      } else {
        replaceRow('feedback', await api.call('feedback.update', { id: f.id, title: v.title, status: v.status, nextStep: v.action }));
      }
    }
  });
}

const BIMBINGAN_MODES = [['Tatap muka', 'Tatap muka'], ['Daring', 'Daring']];
function sheetBimbingan(b) {
  const isNew = !b;
  const v0 = b || { date: todayStr(), supervisor: 'P1', mode: 'Tatap muka', topic: '', input: '', follow_up: '' };
  if (!isOwner()) {
    openSheet({ title: 'Bimbingan', readOnly: true, body: fInfo([['Tanggal', fmtDate(v0.date)], ['Pembimbing', FROM[v0.supervisor]], ['Cara', v0.mode], ['Topik', v0.topic], ['Masukan', v0.input], ['Tindak lanjut', v0.follow_up]]) });
    return;
  }
  openSheet({
    title: isNew ? 'Bimbingan baru' : 'Ubah bimbingan',
    body: '<div class="form-grid">' + fDate('date', 'Tanggal', v0.date) + fSelect('supervisor', 'Pembimbing', [['P1', 'Pembimbing 1'], ['P2', 'Pembimbing 2']], v0.supervisor) + '</div>' +
      fSelect('mode', 'Cara bimbingan', BIMBINGAN_MODES, v0.mode) + fText('topic', 'Topik', v0.topic, 'maxlength="200"') +
      fArea('input', 'Masukan pembimbing', v0.input, 'rows="3"') + fArea('followUp', 'Tindak lanjut', v0.follow_up, 'rows="2"'),
    submitLabel: isNew ? 'Tambah bimbingan' : 'Simpan',
    onSubmit: async (v) => {
      replaceRow('bimbingan', await api.call(isNew ? 'bimbingan.create' : 'bimbingan.update', Object.assign(isNew ? {} : { id: b.id }, v)));
    }
  });
}

function sheetAiLog(a) {
  const isNew = !a;
  const v0 = a || { date: todayStr(), tool: '', purpose: '', thesis_part: '', help_type: 'Kritik', note: '' };
  if (!isOwner()) {
    openSheet({ title: 'Catatan AI', readOnly: true, body: fInfo([['Tanggal', fmtDate(v0.date)], ['Alat', v0.tool], ['Tujuan', v0.purpose], ['Bagian tesis', v0.thesis_part], ['Jenis bantuan', v0.help_type], ['Catatan', v0.note]]) });
    return;
  }
  openSheet({
    title: isNew ? 'Catatan AI baru' : 'Ubah catatan AI',
    body: '<div class="form-grid">' + fDate('date', 'Tanggal', v0.date) + fText('tool', 'Alat AI', v0.tool, 'maxlength="100" placeholder="mis. Claude"') + '</div>' +
      fArea('purpose', 'Tujuan', v0.purpose, 'rows="2" maxlength="1000" placeholder="mis. Mengkritik logika rumusan masalah"') +
      '<div class="form-grid">' + fText('thesisPart', 'Bagian tesis', v0.thesis_part, 'maxlength="200" placeholder="mis. Bab I"') + fSelect('helpType', 'Jenis bantuan', HELP_TYPES.map(h => [h, h]), v0.help_type) + '</div>' +
      fArea('note', 'Catatan', v0.note, 'rows="2"'),
    submitLabel: isNew ? 'Tambah catatan' : 'Simpan',
    onSubmit: async (v) => {
      replaceRow('ailog', await api.call(isNew ? 'ailog.create' : 'ailog.update', Object.assign(isNew ? {} : { id: a.id }, v)));
    }
  });
}

function summaryBimbingan() {
  const list = rows('bimbingan').slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return 'Log bimbingan tesis (' + list.length + ' kali)\n\n' + list.map((b, i) =>
    (i + 1) + '. ' + fmtDate(b.date) + ', ' + (FROM[b.supervisor] || b.supervisor) + ' (' + b.mode + ')\n   Topik: ' + b.topic +
    (b.input ? '\n   Masukan: ' + b.input : '') + (b.follow_up ? '\n   Tindak lanjut: ' + b.follow_up : '')).join('\n\n');
}
function summaryAiLog() {
  const list = rows('ailog').slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return 'Catatan penggunaan AI dalam penyusunan tesis (' + list.length + ' catatan)\n\n' + list.map((a, i) =>
    (i + 1) + '. ' + fmtDate(a.date) + ', ' + a.tool + ' (' + a.help_type + ')\n   Tujuan: ' + a.purpose +
    (a.thesis_part ? '\n   Bagian tesis: ' + a.thesis_part : '') + (a.note ? '\n   Catatan: ' + a.note : '')).join('\n\n');
}

async function loadUsers() {
  try {
    const res = await api.call('admin.users.list');
    state.users = res.users;
    render();
  } catch (e) { handleErr(e); }
}

const UI = {
  'toggle-task': (el) => toggleDone('tasks', 'task.update', el.dataset.id, el),
  'toggle-reading': (el) => toggleDone('readings', 'reading.update', el.dataset.id, el),
  'toggle-req': (el) => toggleDone('requirements', 'requirement.update', el.dataset.id, el),

  'edit-task': (el) => {
    const t = byId('tasks', el.dataset.id);
    openSheet({
      title: 'Catatan task',
      body: '<p class="t-head" style="margin:0 0 4px">' + esc(t.title) + '</p>' + (t.desc ? '<p class="t-sub muted" style="margin:0 0 16px">' + esc(t.desc) + '</p>' : '') +
        fArea('note', 'Catatan', t.note, 'rows="5" maxlength="5000"'),
      onSubmit: async (v) => { replaceRow('tasks', await api.call('task.update', { id: t.id, note: v.note })); }
    });
  },
  'edit-reading': (el) => {
    const r = byId('readings', el.dataset.id);
    if (!isOwner()) { openSheet({ title: 'Bacaan', readOnly: true, body: fInfo([['Judul', r.title], ['Sumber', r.author], ['Status', r.done ? 'Sudah dibaca' : 'Belum dibaca']]) }); return; }
    openSheet({
      title: 'Bacaan',
      body: '<p class="t-head" style="margin:0 0 4px">' + esc(r.title) + '</p><p class="t-sub muted" style="margin:0 0 16px">' + esc(r.author) + '</p>' +
        fSelect('verifyStatus', 'Status verifikasi referensi', Object.keys(VERIFY).map(k => [k, VERIFY[k].label]), r.verify_status) +
        fArea('note', 'Catatan', r.note, 'rows="4" maxlength="5000"'),
      onSubmit: async (v) => { replaceRow('readings', await api.call('reading.update', { id: r.id, verifyStatus: v.verifyStatus, note: v.note })); }
    });
  },
  'edit-req': (el) => {
    const r = byId('requirements', el.dataset.id);
    openSheet({
      title: 'Syarat',
      body: '<p class="t-head" style="margin:0 0 16px">' + esc(r.text) + '</p>' + fArea('evidence', 'Bukti atau catatan (mis. tanggal unggah di SMILE)', r.evidence, 'rows="3" maxlength="1000"'),
      onSubmit: async (v) => { replaceRow('requirements', await api.call('requirement.update', { id: r.id, evidence: v.evidence })); }
    });
  },
  'edit-section': (el) => {
    const s = byId('sections', el.dataset.id);
    openSheet({
      title: sectionLabel(s),
      body: fSelect('stage', 'Tahap', STAGES.map(st => [st.v, st.label]), s.stage) +
        '<div class="form-grid">' + fDate('dueDate', 'Tenggat', s.due_date) + fText('words', 'Jumlah kata', s.words === null ? '' : s.words, 'type="number" min="0" inputmode="numeric"') + '</div>',
      onSubmit: async (v) => { replaceRow('sections', await api.call('section.update', { id: s.id, stage: Number(v.stage), dueDate: v.dueDate, words: v.words === '' ? '' : Number(v.words) })); }
    });
  },
  'edit-chapter': (el) => {
    const c = byId('chapters', el.dataset.id);
    openSheet({
      title: 'Tanggal target',
      body: '<p class="t-sub muted" style="margin:0 0 16px">' + esc(chapterLabel(c)) + '</p>' + fDate('targetDate', 'Tanggal target', c.target_date),
      onSubmit: async (v) => { replaceRow('chapters', await api.call('chapter.update', { id: c.id, targetDate: v.targetDate })); }
    });
  },
  'edit-milestone': (el) => {
    const m = byId('milestones', el.dataset.id);
    openSheet({
      title: m.name,
      body: fSelect('status', 'Status', [['todo', 'Belum'], ['active', 'Sedang berjalan'], ['done', 'Selesai']], m.status) + fDate('date', 'Tanggal (target atau selesai)', m.date),
      onSubmit: async (v) => { replaceRow('milestones', await api.call('milestone.update', { id: m.id, status: v.status, date: v.date })); }
    });
  },
  'new-feedback': (el) => sheetFeedback(null, el.dataset.ch ? Number(el.dataset.ch) : null),
  'edit-feedback': (el) => sheetFeedback(byId('feedback', el.dataset.id)),
  'new-bimbingan': () => sheetBimbingan(null),
  'edit-bimbingan': (el) => sheetBimbingan(byId('bimbingan', el.dataset.id)),
  'new-ailog': () => sheetAiLog(null),
  'edit-ailog': (el) => sheetAiLog(byId('ailog', el.dataset.id)),
  'copy-bimbingan': async () => showBanner(await copyText(summaryBimbingan()) ? 'Ringkasan bimbingan tersalin.' : 'Gagal menyalin. Coba lagi.', 'green'),
  'copy-ailog': async () => showBanner(await copyText(summaryAiLog()) ? 'Ringkasan AI disclosure tersalin.' : 'Gagal menyalin. Coba lagi.', 'green'),
  'copy-prompt': async (el) => showBanner(await copyText(byId('prompts', el.dataset.id).body) ? 'Prompt tersalin.' : 'Gagal menyalin. Coba lagi.', 'green'),
  'toggle-prompt': (el) => { const id = Number(el.dataset.id); state.openPrompts.has(id) ? state.openPrompts.delete(id) : state.openPrompts.add(id); render(); },
  'new-attendance': () => openSheet({
    title: 'Kehadiran baru',
    body: '<div class="form-grid">' + fDate('date', 'Tanggal', todayStr()) + fSelect('type', 'Jenis', [['sempro', 'Seminar proposal'], ['sidang', 'Sidang']], 'sempro') + '</div>' +
      fText('title', 'Judul atau nama penyaji', '', 'maxlength="200"') + fArea('note', 'Catatan (opsional)', '', 'rows="2" maxlength="1000"'),
    submitLabel: 'Tambah kehadiran',
    onSubmit: async (v) => { replaceRow('attendance', await api.call('attendance.create', v)); }
  }),
  'del-attendance': (el) => {
    const a = byId('attendance', el.dataset.id);
    openSheet({
      title: 'Hapus kehadiran?', danger: true, submitLabel: 'Hapus',
      body: '<p class="t-sub" style="margin:0 0 8px">' + esc(a.title) + ', ' + esc(fmtDate(a.date)) + '. Catatan ini akan dihapus dari Sheet.</p>',
      onSubmit: async () => {
        await api.call('attendance.delete', { id: a.id });
        state.data.attendance = rows('attendance').filter(x => Number(x.id) !== Number(a.id));
      }
    });
  },
  'todo-filter': (el) => { state.todoFilter = el.dataset.v; render(); },
  'papan-stage': (el) => { state.papanStage = Number(el.dataset.v); render(); },
  'new-user': () => openSheet({
    title: 'Tambah pembimbing',
    body: fText('name', 'Nama', '', 'maxlength="100" autocomplete="off"') + fText('email', 'Email', '', 'type="email" maxlength="200" autocomplete="off"') +
      fText('pin', 'PIN awal (6–12 digit)', '', 'type="password" inputmode="numeric" autocomplete="new-password"') + fText('pin2', 'Ketik ulang PIN awal', '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
      '<p class="t-foot muted" style="margin:0">Berikan PIN awal lewat jalur pribadi. Pembimbing bisa menggantinya di halaman Akun.</p>',
    submitLabel: 'Tambah',
    onSubmit: async (v) => {
      if (v.pin !== v.pin2) throw new ApiError('VALIDATION', 'PIN tidak sama.');
      const u = await api.call('admin.users.create', { name: v.name, email: v.email, pin: v.pin });
      state.users.push(u);
    }
  }),
  'reset-user-pin': (el) => openSheet({
    title: 'Reset PIN',
    body: '<p class="t-sub muted" style="margin:0 0 16px">' + esc(el.dataset.email) + '</p>' +
      fText('pin', 'PIN baru (6–12 digit)', '', 'type="password" inputmode="numeric" autocomplete="new-password"') + fText('pin2', 'Ketik ulang PIN baru', '', 'type="password" inputmode="numeric" autocomplete="new-password"') +
      '<p class="t-foot muted" style="margin:0">Akun ini akan dikeluarkan dari semua perangkat.</p>',
    submitLabel: 'Reset PIN',
    onSubmit: async (v) => {
      if (v.pin !== v.pin2) throw new ApiError('VALIDATION', 'PIN tidak sama.');
      await api.call('admin.users.resetPin', { email: el.dataset.email, newPin: v.pin });
    }
  }),
  'logout': async () => {
    try { await api.call('auth.logout'); } catch (e) { /* tetap keluar di perangkat ini */ }
    session.clear();
    Object.assign(state, { user: null, data: null, users: null, phase: 'login' });
    location.hash = '#/ringkasan';
    render();
  },
  'retry-load': () => loadData()
};

const CHANGE = {
  'move-section': async (el) => {
    const id = Number(el.dataset.id);
    const lama = byId('sections', id).stage;
    el.disabled = true;
    try {
      replaceRow('sections', await api.call('section.update', { id: id, stage: Number(el.value) }));
      render();
    } catch (e) { el.value = lama; el.disabled = false; handleErr(e); }
  },
  'user-active': async (el) => {
    const aktif = el.checked;
    el.disabled = true;
    try {
      await api.call('admin.users.setActive', { email: el.dataset.email, active: aktif });
      const u = state.users.find(x => x.email === el.dataset.email);
      if (u) u.active = aktif;
      el.disabled = false;
      showBanner(aktif ? 'Akun diaktifkan.' : 'Akun dinonaktifkan dan dikeluarkan dari semua perangkat.', 'green');
    } catch (e) { el.checked = !aktif; el.disabled = false; handleErr(e); }
  }
};

const FORMS = {
  login: async (form) => {
    const err = $('.err', form), btn = $('button[type=submit]', form);
    const email = form.email.value.trim(), pin = form.pin.value, remember = form.remember.checked;
    if (!email || !pin) { err.textContent = 'Isi email dan PIN.'; return; }
    btn.disabled = true; btn.innerHTML = '<span class="spinner sm" style="border-top-color:#fff"></span>Masuk…'; err.textContent = '';
    try {
      const res = await api.call('auth.login', { email: email, pin: pin, remember: remember });
      session.save(res.token, remember);
      state.user = res.user;
      await loadData();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Masuk';
      form.pin.value = '';
      err.textContent = e.message;
      form.pin.focus();
    }
  },
  'change-pin': async (form) => {
    const status = $('.save-status', form), btn = $('button[type=submit]', form);
    const v = { oldPin: form.oldPin.value, newPin: form.newPin.value };
    if (v.newPin !== form.newPin2.value) { status.className = 'save-status err'; status.innerHTML = icon('alert') + 'PIN baru tidak sama.'; return; }
    btn.disabled = true; status.className = 'save-status'; status.innerHTML = '<span class="spinner sm"></span>Menyimpan…';
    try {
      await api.call('auth.changePin', v);
      form.reset();
      status.className = 'save-status ok'; status.innerHTML = icon('check') + 'PIN diganti';
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


/* =========================================================
   8. ROUTER & INIT
   ========================================================= */
const ROUTES = [
  [/^ringkasan$/, 'Ringkasan', () => vRingkasan()],
  [/^penulisan$/, 'Penulisan', () => vBab()],
  [/^penulisan\/papan$/, 'Papan Penulisan', () => vPapan(), true],
  [/^penulisan\/terlambat$/, 'Terlambat', () => vTerlambat()],
  [/^bab\/(\d+)$/, 'Bab', (m) => vBabDetail({ id: m[1] })],
  [/^masukan$/, 'Masukan', () => vMasukan(false)],
  [/^masukan\/semua$/, 'Log masukan', () => vMasukan(true)],
  [/^log$/, 'Log Bimbingan', () => vBimbingan()],
  [/^log\/ai$/, 'Log AI Disclosure', () => vAiLog()],
  [/^lainnya$/, 'Lainnya', () => vLainnya()],
  [/^todo$/, 'To-Do', () => vTodo()],
  [/^bacaan$/, 'Bacaan', () => vBacaan()],
  [/^linimasa$/, 'Linimasa', () => vLinimasa()],
  [/^syarat$/, 'Syarat', () => vSyarat()],
  [/^prompt$/, 'Prompt', () => vPrompt()],
  [/^akses$/, 'Kelola Akses', () => vAkses()],
  [/^akun$/, 'Akun', () => vAkun()]
];

function resolveRoute() {
  let key = location.hash.replace(/^#\/?/, '') || 'ringkasan';
  if (!allowed(key)) key = 'ringkasan';
  for (const r of ROUTES) {
    const m = key.match(r[0]);
    if (m) return { key: key, title: r[1], view: () => r[2](m), wide: !!r[3] };
  }
  return { key: 'ringkasan', title: 'Ringkasan', view: () => vRingkasan(), wide: false };
}

let lastKey = null;
function render() {
  const app = $('#app');
  if (state.phase === 'boot') { app.innerHTML = '<div class="boot"><div class="spinner" role="status" aria-label="Memuat"></div></div>'; return; }
  if (state.phase === 'login' || !state.user) { app.innerHTML = vLogin(); document.title = 'Masuk – Thesis Tracker'; setTimeout(() => { const f = $('#lg-email'); if (f) f.focus(); }, 30); lastKey = null; return; }
  if (state.phase === 'error') { app.innerHTML = vLoadError(); return; }
  const r = resolveRoute();
  const keepScroll = r.key === lastKey;
  const y = window.scrollY;
  app.innerHTML = shell(state.data ? r.view() : vLoading(), r.key, r.wide);
  window.scrollTo(0, keepScroll ? y : 0);
  lastKey = r.key;
  document.title = r.title + ' – Thesis Tracker';
}

async function loadData() {
  state.phase = 'app'; state.data = null; render();
  try {
    const res = await api.call('data.bootstrap');
    state.user = res.user;
    state.data = res.data;
    state.phase = 'app';
    render();
  } catch (e) {
    if (e.code === 'AUTH_REQUIRED') return;
    state.loadError = e.message; state.phase = 'error'; render();
  }
}

window.addEventListener('hashchange', () => { closeSheet(); render(); });

(function init() {
  session.load();
  if (!session.token) { state.phase = 'login'; render(); return; }
  state.user = { name: '', email: '', role: 'supervisor' }; // sementara, diganti hasil bootstrap
  loadData();
})();
