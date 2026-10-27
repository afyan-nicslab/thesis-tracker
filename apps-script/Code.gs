/**
 * Thesis Tracker v2 — Backend (Google Apps Script)
 * Bagian 1: skema tabel dan fungsi editor setupSheet()
 *
 * Acuan: docs/ARCHITECTURE.md bagian 6 (model data).
 * File ini disalin ke repo di apps-script/Code.gs, jadi TIDAK BOLEH
 * berisi rahasia apa pun (PIN, PIN_PEPPER, token, alamat Sheet).
 */

// ============================================================
// SKEMA: nama tab dan urutan kolomnya
// ============================================================
const SCHEMA = {
  Users:        ['email', 'name', 'role', 'salt', 'pin_hash', 'active', 'created_at', 'last_login_at', 'pin_changed_at'],
  Sessions:     ['token_hash', 'email', 'created_at', 'expires_at', 'remember', 'revoked'],
  Phases:       ['id', 'name', 'focus', 'color', 'order'],
  Tasks:        ['id', 'phase_id', 'title', 'desc', 'duration', 'tags', 'order', 'done', 'note', 'updated_at'],
  Readings:     ['id', 'title', 'author', 'type', 'order', 'done', 'verify_status', 'note', 'updated_at'],
  Chapters:     ['id', 'doc', 'number', 'title', 'target_date', 'order'],
  Sections:     ['id', 'chapter_id', 'number', 'title', 'stage', 'due_date', 'words', 'updated_at'],
  Feedback:     ['id', 'title', 'chapter_id', 'from', 'received_at', 'status', 'action', 'bimbingan_id', 'created_by', 'updated_at'],
  Bimbingan:    ['id', 'date', 'supervisor', 'mode', 'topic', 'input', 'follow_up', 'created_at'],
  AILog:        ['id', 'date', 'tool', 'purpose', 'thesis_part', 'help_type', 'note', 'created_at'],
  Requirements: ['id', 'stage', 'text', 'source', 'done', 'evidence', 'order'],
  Attendance:   ['id', 'date', 'type', 'title', 'note'],
  Milestones:   ['id', 'name', 'order', 'status', 'date'],
  Timeline:     ['id', 'month', 'title', 'desc', 'order'],
  Prompts:      ['id', 'title', 'category', 'body', 'order'],
  Audit:        ['ts', 'email', 'action', 'entity', 'entity_id']
};

// Nama tab bawaan Google Sheets yang boleh dihapus bila masih kosong
const DEFAULT_SHEET_NAMES = ['Sheet1', 'Sheet 1', 'Lembar1', 'Lembar 1'];


// ============================================================
// FUNGSI EDITOR
// Dijalankan pemilik dari editor Apps Script (menu Run), bukan lewat web.
// Tidak pernah didaftarkan di tabel ACTIONS, jadi tidak bisa dipanggil
// dari halaman tracker.
// ============================================================

/**
 * Membuat semua tab sesuai SCHEMA beserta baris judul kolom.
 * Aman dijalankan ulang: tab yang sudah ada tidak dihapus, dan judul kolom
 * yang sudah terisi tidak ditimpa (hanya diberi peringatan bila berbeda).
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const laporan = [];

  Object.keys(SCHEMA).forEach(function (nama) {
    const kolom = SCHEMA[nama];
    let sh = ss.getSheetByName(nama);

    if (!sh) {
      sh = ss.insertSheet(nama);
      laporan.push('Dibuat    : ' + nama);
    } else {
      laporan.push('Sudah ada : ' + nama);
    }

    // Pastikan jumlah kolom cukup untuk skema
    if (sh.getMaxColumns() < kolom.length) {
      sh.insertColumnsAfter(sh.getMaxColumns(), kolom.length - sh.getMaxColumns());
    }

    // Tulis judul kolom hanya bila baris 1 masih kosong
    const header = sh.getRange(1, 1, 1, kolom.length);
    const lama = header.getValues()[0];
    const kosong = lama.every(function (v) { return v === ''; });
    if (kosong) {
      header.setValues([kolom]);
    } else if (lama.join('|') !== kolom.join('|')) {
      laporan.push('  PERINGATAN: judul kolom tab ' + nama + ' berbeda dari skema; tidak diubah.');
    }
    header.setFontWeight('bold');
    sh.setFrozenRows(1);

    // Semua sel diformat sebagai teks biasa agar isian pengguna tidak
    // dijalankan sebagai rumus dan tanggal tidak bergeser zona waktu
    sh.getRange(1, 1, sh.getMaxRows(), kolom.length).setNumberFormat('@');

    // Buang kolom kosong berlebih di kanan agar tab rapi
    const lebih = sh.getMaxColumns() - kolom.length;
    if (lebih > 0) {
      sh.deleteColumns(kolom.length + 1, lebih);
    }
  });

  // Hapus tab bawaan bila masih kosong
  DEFAULT_SHEET_NAMES.forEach(function (namaBawaan) {
    const sh = ss.getSheetByName(namaBawaan);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sh);
      laporan.push('Dihapus   : ' + namaBawaan + ' (tab bawaan yang kosong)');
    }
  });

  Logger.log(laporan.join('\n'));
  Logger.log('Selesai: ' + Object.keys(SCHEMA).length + ' tab sesuai skema.');
}


// ============================================================
// RAHASIA (Script Properties)
// Nilai rahasia hanya disimpan di Project Settings > Script Properties,
// tidak pernah di kode, Sheet, log, atau repo.
// ============================================================
const PROP_PEPPER = 'PIN_PEPPER';

/** Mengambil PIN_PEPPER; menghentikan proses bila belum diatur. */
function getPepper_() {
  const nilai = PropertiesService.getScriptProperties().getProperty(PROP_PEPPER);
  if (!nilai) {
    throw new Error('PIN_PEPPER belum diatur. Jalankan initPepper() dari editor.');
  }
  return nilai;
}

/**
 * FUNGSI EDITOR — membuat PIN_PEPPER acak, cukup sekali seumur proyek.
 * Nilainya sengaja tidak ditampilkan di log. Bila sudah ada, tidak diubah,
 * karena mengganti pepper membuat semua PIN harus di-reset.
 */
function initPepper() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(PROP_PEPPER)) {
    Logger.log('PIN_PEPPER sudah ada. Tidak diubah.');
    return;
  }
  // Tiga UUID acak digabung tanpa tanda hubung: 96 karakter heksadesimal
  const pepper = [Utilities.getUuid(), Utilities.getUuid(), Utilities.getUuid()]
    .join('')
    .replace(/-/g, '');
  props.setProperty(PROP_PEPPER, pepper);
  Logger.log('PIN_PEPPER dibuat: ' + pepper.length + ' karakter acak. Nilainya sengaja tidak ditampilkan.');
}


// ============================================================
// UTILITAS UMUM
// ============================================================
const TZ = 'Asia/Jakarta';

/** Waktu sekarang sebagai teks ISO, zona Jakarta (mis. 2026-10-27T09:15:00+07:00). */
function nowIso_() {
  return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** Mengambil tab berdasarkan nama; berhenti bila tab tidak ada. */
function getSheet_(nama) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nama);
  if (!sh) throw new Error('Tab ' + nama + ' tidak ditemukan. Jalankan setupSheet().');
  return sh;
}

/**
 * Mencegah teks pengguna dijalankan sebagai rumus Sheets:
 * teks yang diawali = + - @ diberi tanda kutip tunggal di depannya.
 */
function safeText_(nilai) {
  const teks = String(nilai === undefined || nilai === null ? '' : nilai);
  return /^[=+\-@]/.test(teks) ? "'" + teks : teks;
}

/** Membaca seluruh baris sebuah tab sebagai daftar objek {kolom: nilai}. */
function readRows_(nama) {
  const sh = getSheet_(nama);
  const kolom = SCHEMA[nama];
  const jumlah = sh.getLastRow() - 1;
  if (jumlah < 1) return [];
  return sh.getRange(2, 1, jumlah, kolom.length).getValues().map(function (baris, i) {
    const obj = { _row: i + 2 };
    kolom.forEach(function (k, j) {
      let v = baris[j];
      // Buang tanda kutip pelindung dari safeText_ bila ikut tersimpan
      if (typeof v === 'string' && /^'[=+\-@]/.test(v)) v = v.slice(1);
      obj[k] = v;
    });
    return obj;
  });
}

/** Menambah satu baris ke sebuah tab, mengikuti urutan kolom di SCHEMA. */
function appendRow_(nama, obj) {
  const baris = SCHEMA[nama].map(function (k) { return safeText_(obj[k]); });
  getSheet_(nama).appendRow(baris);
}

/** Mengubah beberapa kolom pada satu baris (nomor baris dari readRows_). */
function updateRow_(nama, nomorBaris, perubahan) {
  const sh = getSheet_(nama);
  const kolom = SCHEMA[nama];
  Object.keys(perubahan).forEach(function (k) {
    const j = kolom.indexOf(k);
    if (j < 0) throw new Error('Kolom ' + k + ' tidak ada di tab ' + nama);
    sh.getRange(nomorBaris, j + 1).setValue(safeText_(perubahan[k]));
  });
}


// ============================================================
// PIN: aturan dan hash
// ============================================================

/** Mengembalikan pesan kesalahan bila PIN tidak memenuhi aturan, atau '' bila valid. */
function validatePin_(pin) {
  if (!/^\d{6,12}$/.test(pin)) return 'PIN harus 6 sampai 12 digit angka.';
  if (/^(\d)\1+$/.test(pin)) return 'PIN tidak boleh berupa angka yang sama berulang.';
  const naik = '01234567890123456789';
  const turun = '98765432109876543210';
  if (naik.indexOf(pin) >= 0 || turun.indexOf(pin) >= 0) return 'PIN tidak boleh berupa urutan angka.';
  return '';
}

/** Mengubah deretan byte menjadi teks heksadesimal (hanya 0-9 dan a-f). */
function toHex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/**
 * Hash PIN: hex(HMAC-SHA256(kunci = PIN_PEPPER, pesan = salt + ":" + pin)).
 * Memakai hex, bukan base64, karena base64 bisa diawali "+" yang akan
 * dianggap rumus oleh Sheets.
 */
function hashPin_(salt, pin) {
  return toHex_(Utilities.computeHmacSha256Signature(salt + ':' + pin, getPepper_()));
}

/** SHA-256 sebuah teks, dalam bentuk hex. Dipakai untuk menyimpan token sesi. */
function sha256Hex_(teks) {
  return toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, teks, Utilities.Charset.UTF_8));
}

/** Membandingkan dua teks tanpa berhenti di karakter pertama yang berbeda. */
function safeEqual_(a, b) {
  a = String(a); b = String(b);
  let beda = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    beda |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return beda === 0;
}


// ============================================================
// MENU ADMIN DI GOOGLE SHEET
// Hanya pemilik akun Google (yang bisa membuka Sheet ini) yang melihat menu.
// ============================================================

/** Dijalankan otomatis setiap kali Sheet dibuka: menambahkan menu Thesis Tracker. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Thesis Tracker')
    .addItem('Buat akun pemilik…', 'menuCreateOwner')
    .addItem('Reset PIN pemilik…', 'menuResetOwnerPin')
    .addToUi();
}

/** Meminta satu isian lewat kotak dialog; mengembalikan null bila dibatalkan. */
function ask_(judul, pesan) {
  const ui = SpreadsheetApp.getUi();
  const jawab = ui.prompt(judul, pesan, ui.ButtonSet.OK_CANCEL);
  if (jawab.getSelectedButton() !== ui.Button.OK) return null;
  return jawab.getResponseText().trim();
}

/** Meminta PIN baru dua kali dan memeriksa aturannya; null bila dibatalkan atau gagal. */
function askNewPin_(judul) {
  const ui = SpreadsheetApp.getUi();
  const pin = ask_(judul, 'PIN baru (6–12 digit angka, bukan urutan atau angka berulang):');
  if (pin === null) return null;
  const salah = validatePin_(pin);
  if (salah) { ui.alert(salah); return null; }
  const ulang = ask_(judul, 'Ketik ulang PIN baru:');
  if (ulang === null) return null;
  if (ulang !== pin) { ui.alert('PIN tidak sama. Tidak ada yang disimpan.'); return null; }
  return pin;
}

/** Menu: membuat akun pemilik pertama. Ditolak bila pemilik sudah ada. */
function menuCreateOwner() {
  const ui = SpreadsheetApp.getUi();
  const pemilikAda = readRows_('Users').some(function (u) { return u.role === 'owner'; });
  if (pemilikAda) {
    ui.alert('Akun pemilik sudah ada. Gunakan "Reset PIN pemilik" bila lupa PIN.');
    return;
  }

  const email = ask_('Buat akun pemilik', 'Email untuk masuk ke tracker:');
  if (email === null) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ui.alert('Format email tidak valid.'); return; }

  const nama = ask_('Buat akun pemilik', 'Nama yang ditampilkan:');
  if (nama === null || nama === '') return;

  const pin = askNewPin_('Buat akun pemilik');
  if (pin === null) return;

  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    const salt = Utilities.getUuid();
    const sekarang = nowIso_();
    appendRow_('Users', {
      email: email.toLowerCase(),
      name: nama,
      role: 'owner',
      salt: salt,
      pin_hash: hashPin_(salt, pin),
      active: 'TRUE',
      created_at: sekarang,
      last_login_at: '',
      pin_changed_at: sekarang
    });
  } finally {
    kunci.releaseLock();
  }
  ui.alert('Akun pemilik dibuat untuk ' + email.toLowerCase() + '. PIN tidak disimpan apa adanya, hanya hash-nya.');
}

/** Menu: mengganti PIN akun pemilik (untuk saat lupa PIN). */
function menuResetOwnerPin() {
  const ui = SpreadsheetApp.getUi();
  const pemilik = readRows_('Users').filter(function (u) { return u.role === 'owner'; })[0];
  if (!pemilik) { ui.alert('Belum ada akun pemilik. Gunakan "Buat akun pemilik".'); return; }

  const pin = askNewPin_('Reset PIN pemilik');
  if (pin === null) return;

  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    const salt = Utilities.getUuid();
    updateRow_('Users', pemilik._row, {
      salt: salt,
      pin_hash: hashPin_(salt, pin),
      pin_changed_at: nowIso_()
    });
  } finally {
    kunci.releaseLock();
  }
  ui.alert('PIN pemilik diganti.');
}


// ============================================================
// API WEB: pintu masuk, respons, dan error
// Acuan: docs/ARCHITECTURE.md bagian 3–5
// ============================================================
const APP_VERSION = '2.0.0-tahap3';
const SESSION_HOURS = 12;        // sesi biasa
const REMEMBER_DAYS = 30;        // sesi "Ingat perangkat ini"
const LOCK_FAILS = 5;            // salah PIN per akun sebelum terkunci
const LOCK_SECONDS = 15 * 60;    // lama terkunci per akun
const GLOBAL_FAILS = 30;         // batas total salah PIN semua akun
const GLOBAL_SECONDS = 60 * 60;  // jendela batas total
const SESSION_CACHE_SECONDS = 300;

// Aksi yang boleh dipanggil tanpa sesi
const PUBLIC_ACTIONS = ['auth.login'];

// Daftar aksi yang bisa dipanggil dari halaman tracker.
// Fungsi editor (setupSheet, initPepper, menu) sengaja TIDAK ada di sini.
const ACTIONS = {
  'auth.login': actLogin_,
  'auth.logout': actLogout_,
  'auth.me': actMe_,
  'auth.changePin': actChangePin_
};

// Peran yang boleh menjalankan tiap aksi (ARCHITECTURE 4.4)
const ROLE_RULES = {
  'auth.logout': ['owner', 'supervisor'],
  'auth.me': ['owner', 'supervisor'],
  'auth.changePin': ['owner', 'supervisor']
};

/** Membuat error dengan kode yang dikenali frontend. */
function fail_(kode, pesan) {
  const e = new Error(pesan);
  e.code = kode;
  return e;
}

/** Membungkus objek menjadi respons JSON. */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Cek hidup. Tidak pernah mengembalikan data tracker. */
function doGet() {
  return json_({ ok: true, app: 'thesis-tracker', version: APP_VERSION });
}

/** Satu pintu untuk semua aksi: baca body → cek sesi → cek peran → jalankan aksi. */
function doPost(e) {
  let hasil;
  try {
    let body;
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '');
    } catch (err) {
      throw fail_('VALIDATION', 'Permintaan tidak valid.');
    }
    if (!body || typeof body.action !== 'string' || !ACTIONS.hasOwnProperty(body.action)) {
      throw fail_('VALIDATION', 'Aksi tidak dikenal.');
    }

    let user = null;
    if (PUBLIC_ACTIONS.indexOf(body.action) < 0) {
      user = requireSession_(body.token);
      authorize_(user, body.action);
    }
    hasil = { ok: true, data: ACTIONS[body.action](body, user) || {} };
  } catch (err) {
    if (err.code) {
      hasil = { ok: false, error: { code: err.code, message: err.message } };
    } else {
      // Error tak terduga: catat pesannya saja (tanpa isi permintaan, agar PIN/token tidak ikut tercatat)
      console.error('SERVER: ' + err.message);
      hasil = { ok: false, error: { code: 'SERVER', message: 'Terjadi kesalahan di server. Coba lagi.' } };
    }
  }
  return json_(hasil);
}

/** Menolak bila peran pengguna tidak diizinkan menjalankan aksi ini. */
function authorize_(user, aksi) {
  const boleh = ROLE_RULES[aksi] || [];
  if (boleh.indexOf(user.role) < 0) {
    throw fail_('FORBIDDEN', 'Kamu tidak punya akses untuk tindakan ini.');
  }
}


// ============================================================
// SESI
// ============================================================

/** Membuat sesi baru; mengembalikan token asli (hanya hash-nya yang disimpan). */
function createSession_(email, ingat) {
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  const sekarang = new Date();
  const kedaluwarsa = new Date(sekarang.getTime() + (ingat ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600 * 1000);
  appendRow_('Sessions', {
    token_hash: sha256Hex_(token),
    email: email,
    created_at: nowIso_(),
    expires_at: Utilities.formatDate(kedaluwarsa, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    remember: ingat ? 'TRUE' : 'FALSE',
    revoked: 'FALSE'
  });
  return { token: token, expiresAt: kedaluwarsa.toISOString() };
}

/** Memeriksa token; mengembalikan {email, name, role} atau menolak dengan AUTH_REQUIRED. */
function requireSession_(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    throw fail_('AUTH_REQUIRED', 'Sesi tidak ada atau sudah berakhir. Silakan masuk lagi.');
  }
  const hash = sha256Hex_(token);
  const cache = CacheService.getScriptCache();
  const tersimpan = cache.get('sess:' + hash);
  if (tersimpan) {
    const s = JSON.parse(tersimpan);
    if (s.exp > Date.now()) return s.user;
  }

  const sesi = readRows_('Sessions').filter(function (r) { return r.token_hash === hash; })[0];
  if (!sesi || String(sesi.revoked).toUpperCase() === 'TRUE' || new Date(sesi.expires_at).getTime() <= Date.now()) {
    throw fail_('AUTH_REQUIRED', 'Sesi tidak ada atau sudah berakhir. Silakan masuk lagi.');
  }
  const u = findActiveUser_(sesi.email);
  if (!u) throw fail_('AUTH_REQUIRED', 'Sesi tidak ada atau sudah berakhir. Silakan masuk lagi.');

  const user = { email: u.email, name: u.name, role: u.role };
  const exp = new Date(sesi.expires_at).getTime();
  const detik = Math.min(SESSION_CACHE_SECONDS, Math.floor((exp - Date.now()) / 1000));
  if (detik > 0) cache.put('sess:' + hash, JSON.stringify({ exp: exp, user: user }), detik);
  return user;
}

/** Mencari akun aktif berdasarkan email (huruf kecil). */
function findActiveUser_(email) {
  email = String(email || '').trim().toLowerCase();
  return readRows_('Users').filter(function (u) {
    return String(u.email).toLowerCase() === email && String(u.active).toUpperCase() === 'TRUE';
  })[0] || null;
}


// ============================================================
// PEMBATASAN PERCOBAAN (CacheService)
// ============================================================

/** Kunci cache per akun; email di-hash agar aman dipakai sebagai nama kunci. */
function failKey_(email) {
  return 'fail:' + sha256Hex_(String(email || '').toLowerCase()).slice(0, 32);
}

/** Menolak dengan AUTH_LOCKED bila akun atau seluruh sistem sedang terkunci. */
function checkNotLocked_(email) {
  const cache = CacheService.getScriptCache();
  if (Number(cache.get('fail:global') || 0) >= GLOBAL_FAILS ||
      Number(cache.get(failKey_(email)) || 0) >= LOCK_FAILS) {
    throw fail_('AUTH_LOCKED', 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
  }
}

/** Mencatat satu percobaan gagal untuk akun ini dan untuk hitungan global. */
function recordFail_(email) {
  const cache = CacheService.getScriptCache();
  const kunci = failKey_(email);
  cache.put(kunci, String(Number(cache.get(kunci) || 0) + 1), LOCK_SECONDS);
  cache.put('fail:global', String(Number(cache.get('fail:global') || 0) + 1), GLOBAL_SECONDS);
}


// ============================================================
// AKSI: auth.*
// ============================================================

/** auth.login — input: email, pin, remember. */
function actLogin_(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const pin = String(body.pin || '');
  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    checkNotLocked_(email);
    const u = findActiveUser_(email);
    let cocok = false;
    if (u && /^\d{6,12}$/.test(pin)) {
      cocok = safeEqual_(hashPin_(String(u.salt), pin), String(u.pin_hash));
    } else {
      hashPin_('penyeimbang-waktu', '000000'); // agar waktu respons mirip saat email tidak terdaftar
    }
    if (!cocok) {
      recordFail_(email);
      throw fail_('AUTH_INVALID', 'Email atau PIN salah.');
    }
    CacheService.getScriptCache().remove(failKey_(email));
    const sesi = createSession_(email, body.remember === true);
    updateRow_('Users', u._row, { last_login_at: nowIso_() });
    return {
      token: sesi.token,
      expiresAt: sesi.expiresAt,
      user: { email: u.email, name: u.name, role: u.role }
    };
  } finally {
    kunci.releaseLock();
  }
}

/** auth.logout — mencabut sesi yang sedang dipakai. */
function actLogout_(body) {
  const hash = sha256Hex_(body.token);
  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    const sesi = readRows_('Sessions').filter(function (r) { return r.token_hash === hash; })[0];
    if (sesi) updateRow_('Sessions', sesi._row, { revoked: 'TRUE' });
    CacheService.getScriptCache().remove('sess:' + hash);
  } finally {
    kunci.releaseLock();
  }
  return {};
}

/** auth.me — mengembalikan identitas pemilik sesi. Dipakai untuk uji dan saat halaman dibuka. */
function actMe_(body, user) {
  return { user: user };
}

/** auth.changePin — input: oldPin, newPin. */
function actChangePin_(body, user) {
  const pinLama = String(body.oldPin || '');
  const pinBaru = String(body.newPin || '');
  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    checkNotLocked_(user.email);
    const u = findActiveUser_(user.email);
    if (!u || !/^\d{6,12}$/.test(pinLama) || !safeEqual_(hashPin_(String(u.salt), pinLama), String(u.pin_hash))) {
      recordFail_(user.email);
      throw fail_('AUTH_INVALID', 'PIN lama salah.');
    }
    const salah = validatePin_(pinBaru);
    if (salah) throw fail_('VALIDATION', salah);
    const salt = Utilities.getUuid();
    updateRow_('Users', u._row, { salt: salt, pin_hash: hashPin_(salt, pinBaru), pin_changed_at: nowIso_() });
  } finally {
    kunci.releaseLock();
  }
  return {};
}
