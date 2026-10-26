# ARCHITECTURE — Thesis Tracker v2

**Pemilik:** Afyan Cholil Asy'ari · **Status:** v0.2, 26 Oktober 2026
**Dokumen terkait:** PRD.md v1.0 · DESIGN-SYSTEM.md v0.2 · AGENTS.md

---

## 1. Gambaran besar

Tiga bagian yang sama jenisnya dengan v1, tetapi semuanya dibangun baru dari nol (K8): repo GitHub baru, Google Sheet baru, proyek Apps Script baru. Isi tracker tinggal di Sheet (K1), dan setiap permintaan wajib membawa token sesi (K5).

```
 Browser (HP / laptop)                Google Apps Script              Google Sheet
 GitHub Pages                         Web App (Code.gs)               "Thesis Tracker DB v2"
┌────────────────────┐   POST JSON   ┌──────────────────────┐        ┌──────────────────┐
│ index.html         │ ────────────> │ doPost(e)            │ <────> │ Users, Sessions  │
│ styles.css         │  {action,     │  1. cek token        │        │ Tasks, Readings  │
│ app.js             │   token, ...} │  2. cek peran        │        │ Chapters, ...    │
│                    │ <──────────── │  3. validasi input   │        └──────────────────┘
│ token di storage   │  {ok, data}   │  4. baca/tulis Sheet │        Script Properties:
└────────────────────┘               └──────────────────────┘        PIN_PEPPER
```

**Prinsip:** server tidak pernah percaya pada browser. Semua cek hak akses, validasi, dan aturan bisnis dijalankan ulang di Apps Script, walaupun tampilan sudah menyembunyikan tombolnya.

## 2. Frontend

| Aspek | Keputusan |
| --- | --- |
| Hosting | GitHub Pages di repo baru (akun dan nama menyusul). Repo harus publik agar Pages gratis, jadi kode dan dokumen tidak boleh berisi rahasia atau data pribadi |
| Teknologi | HTML, CSS, JavaScript biasa. Tanpa framework, tanpa proses build, tanpa library JS dari luar |
| File | `index.html` (kerangka), `styles.css` (token dan komponen dari DESIGN-SYSTEM.md), `app.js` (logika). Dipecah agar setiap file lebih pendek dan lebih aman ditempel lewat editor GitHub |
| Font | Google Fonts (Inter) sebagai pengganti di perangkat non-Apple; satu-satunya sumber luar |
| Navigasi | Rute hash: `#/ringkasan`, `#/penulisan`, `#/bab/3`, `#/masukan`, `#/log`, `#/lainnya`, `#/masuk` |
| Data | Saat masuk, panggil `data.bootstrap` sekali, simpan di objek `state`, lalu render. Perubahan dikirim per aksi |
| Nilai turunan | Progres bab, hitungan masukan terbuka, tanda terlambat, dan penghitung x/10 **dihitung di frontend** dari data mentah dan tidak disimpan di Sheet |

**Susunan `app.js`** (satu file, dibagi bagian berurutan):

1. `config`: `API_URL`, versi aplikasi
2. `util`: `esc()` untuk escape HTML, format tanggal Asia/Jakarta, `daysBetween()`
3. `api`: satu fungsi `call(action, payload)` yang menambahkan token, menangani error, dan mengarahkan ke `#/masuk` bila sesi habis
4. `state` dan fungsi hitung (`chapterProgress()`, `openFeedbackCount()`, `isOverdue()`)
5. `components`: baris daftar, kapsul, bilah progres, sheet, banner, status simpan
6. `views`: satu fungsi render per halaman
7. `router` dan `init()`

**Aturan render:** semua teks dari data masuk lewat `esc()` atau `textContent`. Tidak ada `innerHTML` yang berisi data mentah.

## 3. Backend (Apps Script)

| Aspek | Keputusan |
| --- | --- |
| Proyek | Proyek Apps Script baru yang terikat ke Google Sheet baru. Tab dan kolom dibuat otomatis oleh fungsi `setupSheet()` yang dijalankan sekali dari editor |
| Deployment | Web App, "Execute as: Me", "Who has access: Anyone". Akses "Anyone" diperlukan agar browser bisa memanggilnya; perlindungan datang dari token, bukan dari pengaturan ini |
| Pembaruan | Selalu lewat Terapkan → Kelola deployment → Edit → Versi baru, agar URL `/exec` tidak berubah. Jangan membuat "Deployment baru" |
| Zona waktu proyek | Asia/Jakarta |
| `doGet` | Hanya mengembalikan `{ok:true, app:"thesis-tracker", version}` sebagai cek hidup. **Tidak ada data** |
| `doPost` | Satu pintu untuk semua aksi (bagian 5) |
| Request | `fetch(API_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify({...})})`. Tipe `text/plain` dipakai agar browser tidak mengirim preflight CORS, yang tidak didukung Apps Script |
| Response | `ContentService` JSON: `{ok:true, data:{...}}` atau `{ok:false, error:{code, message}}` |
| Penulisan | Setiap aksi tulis dibungkus `LockService.getScriptLock()` agar dua penyimpanan bersamaan tidak saling menimpa |
| Salinan kode | Isi `Code.gs` disalin ke repo di `apps-script/Code.gs` setiap kali ada versi baru, sebagai riwayat. File ini tidak boleh berisi rahasia apa pun |

## 4. Autentikasi dan otorisasi

### 4.1 PIN

- Saat akun dibuat atau PIN diganti: `salt = Utilities.getUuid()`, lalu `pin_hash = base64(HMAC-SHA256(key = PIN_PEPPER, pesan = salt + ":" + pin))` dengan `Utilities.computeHmacSha256Signature`.
- Saat masuk: hitung ulang dengan salt pengguna, bandingkan dengan perbandingan waktu-konstan (loop seluruh karakter, bukan `===`).
- PIN minimal 6 digit; tolak urutan (123456, 654321) dan angka berulang (111111).
- `PIN_PEPPER`: teks acak minimal 32 karakter, hanya di Script Properties. Bila hilang atau diganti, semua PIN harus di-reset.

### 4.2 Pembatasan percobaan

Disimpan di `CacheService.getScriptCache()`:

- `fail:<email>`: jumlah gagal per akun, umur 15 menit. Bila mencapai 5, akun ditolak sampai kunci kedaluwarsa.
- `fail:global`: jumlah gagal semua akun, umur 1 jam. Bila melewati 30, semua percobaan masuk ditolak sampai jam berikutnya.
- Email tidak terdaftar tetap dihitung dan mendapat pesan yang sama: "Email atau PIN salah."

### 4.3 Sesi

- Token = gabungan dua `Utilities.getUuid()` tanpa tanda hubung. Yang disimpan di Sheet `Sessions` hanya hash SHA-256-nya, sehingga isi Sheet tidak bisa dipakai untuk masuk.
- Masa berlaku: 12 jam (biasa) atau 30 hari ("Ingat perangkat ini").
- Browser menyimpan token di `sessionStorage` (biasa) atau `localStorage` (diingat). Token tidak pernah masuk URL.
- Keluar: baris sesi ditandai `revoked`, token dihapus dari browser.
- Hasil cek token disimpan sementara di `CacheService` (5 menit) agar tidak membaca Sheet di setiap aksi.

### 4.4 Matriks hak akses

| Aksi | Pemilik | Pembimbing |
| --- | --- | --- |
| `auth.login`, `auth.logout`, `auth.changePin` | Ya | Ya |
| `data.bootstrap` | Semua data | Data tersaring sesuai K6 (tanpa catatan task, Prompts, Users) |
| `task.update`, `reading.update`, `requirement.update`, `attendance.*` | Ya | Tidak |
| `chapter.update`, `section.update` | Ya | Tidak |
| `feedback.create` | Ya | Ya |
| `feedback.update` | Ya | Hanya masukan yang ia buat sendiri |
| `bimbingan.*`, `ailog.*` | Ya | Tidak (hanya baca) |
| `admin.*` | Ya | Tidak |

Aturan ini dicek di server oleh satu fungsi `authorize(user, action, record)` sebelum aksi dijalankan.

## 5. Kontrak API

Semua aksi lewat `doPost`, dengan body `{action, token, ...}` (`auth.login` tanpa token).

| Aksi | Input utama | Output |
| --- | --- | --- |
| `auth.login` | `email, pin, remember` | `token, expiresAt, user{email, name, role}` |
| `auth.logout` | – | `{}` |
| `auth.changePin` | `oldPin, newPin` | `{}` |
| `data.bootstrap` | – | Semua tabel yang boleh dilihat peran tersebut |
| `task.update` | `id, done?, note?` | Baris yang diperbarui |
| `reading.update` | `id, done?, verifyStatus?, note?` | Baris yang diperbarui |
| `chapter.update` | `id, targetDate?` | Baris yang diperbarui |
| `section.update` | `id, stage?, dueDate?, words?` | Baris yang diperbarui |
| `feedback.create` | `title, chapterId, from, receivedAt, action?, bimbinganId?` | Baris baru |
| `feedback.update` | `id, status?, action?, title?` | Baris yang diperbarui |
| `bimbingan.create` / `.update` | `date, supervisor, mode, topic, input, followUp` | Baris baru / diperbarui |
| `ailog.create` / `.update` | `date, tool, purpose, thesisPart, helpType, note` | Baris baru / diperbarui |
| `requirement.update` | `id, done, evidence?` | Baris yang diperbarui |
| `attendance.create` / `.delete` | `date, type, title` | Baris baru / `{}` |
| `admin.users.list` | – | Daftar akun tanpa salt dan hash |
| `admin.users.create` | `email, name, role, pin` | Akun baru |
| `admin.users.setActive` | `email, active` | `{}` |
| `admin.users.resetPin` | `email, newPin` | `{}` |

**Kode error**

| Kode | Arti | Tindakan frontend |
| --- | --- | --- |
| `AUTH_INVALID` | Email atau PIN salah | Tampilkan pesan di form |
| `AUTH_LOCKED` | Terlalu banyak percobaan | Tampilkan pesan terkunci |
| `AUTH_REQUIRED` | Token tidak ada, kedaluwarsa, atau dicabut | Hapus token, buka `#/masuk` |
| `FORBIDDEN` | Peran tidak berhak | Banner error; seharusnya tidak terjadi bila UI benar |
| `VALIDATION` | Input tidak valid | Pesan di dekat isian |
| `NOT_FOUND` | `id` tidak ada | Banner, lalu muat ulang data |
| `SERVER` | Error lain | Banner "Coba lagi" |

**Validasi server:** tipe data, panjang maksimal (judul 200, catatan 5.000 karakter), nilai enum (tahap 0–4, status, peran), format tanggal `YYYY-MM-DD`.

## 6. Model data (Google Sheet "Thesis Tracker DB v2")

Satu tab per tabel. Baris pertama adalah nama kolom. Semua `id` berupa angka bulat yang tidak pernah dipakai ulang.

| Tab | Kolom |
| --- | --- |
| `Users` | email, name, role (`owner`/`supervisor`), salt, pin_hash, active, created_at, last_login_at, pin_changed_at |
| `Sessions` | token_hash, email, created_at, expires_at, remember, revoked |
| `Phases` | id, name, focus, color, order |
| `Tasks` | id, phase_id, title, desc, duration, tags, order, done, note, updated_at |
| `Readings` | id, title, author, type, order, done, verify_status, note, updated_at |
| `Chapters` | id, doc (`CN`/`PROP`/`TESIS`), number, title, target_date, order |
| `Sections` | id, chapter_id, number, title, stage (0–4), due_date, words, updated_at |
| `Feedback` | id, title, chapter_id, from (`P1`/`P2`/`PENGUJI`), received_at, status (`open`/`doing`/`done`), action, bimbingan_id, created_by, updated_at |
| `Bimbingan` | id, date, supervisor (`P1`/`P2`), mode, topic, input, follow_up, created_at |
| `AILog` | id, date, tool, purpose, thesis_part, help_type, note, created_at |
| `Requirements` | id, stage (`sempro`/`semhas`/`sidang`), text, source, done, evidence, order |
| `Attendance` | id, date, type (`sempro`/`sidang`), title, note |
| `Milestones` | id, name, order, status (`todo`/`active`/`done`), date |
| `Timeline` | id, month, title, desc, order |
| `Prompts` | id, title, category, body, order |
| `Audit` | ts, email, action, entity, entity_id |

**Aturan penulisan ke Sheet**

- Kolom berisi teks pengguna diformat sebagai teks biasa (`@`). Selain itu, teks yang diawali `=`, `+`, `-`, atau `@` diberi awalan tanda kutip tunggal, agar tidak dijalankan sebagai rumus.
- Tanggal disimpan sebagai teks `YYYY-MM-DD`, bukan objek tanggal Sheets, untuk menghindari pergeseran zona waktu.
- Baris dicari lewat `id`, tidak pernah lewat nomor baris atau judul.
- Isi (judul task, bacaan, subbab, linimasa, prompt) diubah langsung di Sheet oleh pemilik. Perubahan tampil setelah halaman dimuat ulang.

## 7. Struktur repo

```
<repo-baru>/
├── index.html
├── styles.css
├── app.js
├── apps-script/
│   └── Code.gs           ← salinan backend, tanpa rahasia
├── docs/
│   ├── PRD.md
│   ├── DESIGN-SYSTEM.md
│   └── ARCHITECTURE.md
├── AGENTS.md
└── README.md
```

GitHub Pages disajikan dari branch `main`, folder akar (`/`).

## 8. Batas dan risiko yang diketahui

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Apps Script lambat (sering 1–3 detik per panggilan, perlu verifikasi di pemakaian nyata) | Simpan terasa lambat | Status "Menyimpan…" yang jujur; satu `bootstrap` saat masuk, bukan per halaman |
| Kuota harian Apps Script | Kecil untuk 3 pengguna | Tidak perlu tindakan; dicatat saja |
| Token di `localStorage` bisa dicuri lewat XSS | Akun diambil alih | Semua output di-escape; tanpa library JS dari luar; masa token terbatas; tombol keluar mencabut token |
| Sheet dibagikan tidak sengaja | Data dan email pembimbing terbuka | Sheet tetap Restricted; hash PIN tidak berguna tanpa `PIN_PEPPER` |
| `PIN_PEPPER` hilang | Tidak ada yang bisa masuk | Simpan cadangan pepper di pengelola kata sandi pribadi; prosedur reset lewat editor Apps Script |
| Pemilik lupa PIN | Tidak bisa masuk | Fungsi `resetOwnerPin()` yang hanya bisa dijalankan dari editor Apps Script |

## 9. Peralihan dari v1

v1 (repo, Sheet, dan Apps Script lama) tidak diubah selama v2 dibangun.

1. Isi yang dibawa ke Sheet v2: 20 bacaan dan statusnya, serta status task 1–3 yang dipetakan manual (PRD bagian 7).
2. Setelah semua kriteria penerimaan PRD lulus dan v2 dipakai: matikan deployment Apps Script v1 (Kelola deployment → Arsipkan) dan hapus `PIN_RAHASIA`. Alamat API v1 tercantum di repo lama, jadi tanpa langkah ini data v1 tetap bisa dibaca siapa pun.
3. Repo lama diarsipkan (Settings → Archive this repository) atau README-nya diberi tautan ke alamat baru.
