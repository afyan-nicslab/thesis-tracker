# AGENTS — Aturan kerja untuk asisten AI di repo ini

**Status:** v1.2, 27 Oktober 2026

File ini dibaca oleh asisten AI (Claude, Codex, dan sejenisnya) sebelum menyentuh kode di repo ini. Isinya: apa proyek ini, bagaimana cara bekerja dengan pemiliknya, dan aturan yang tidak boleh dilanggar.

---

## 1. Proyek ini

Thesis Tracker v2: aplikasi web pribadi untuk memantau perjalanan tesis S2 dari concept note sampai Sidang. Penggunanya pemilik (baca-tulis) dan maksimal dua pembimbing (baca, plus menulis masukan).

**Urutan baca sebelum bekerja**

1. `docs/PRD.md`: apa yang dibangun dan kriteria penerimaannya
2. `docs/ARCHITECTURE.md`: bagaimana bagian-bagiannya terhubung, kontrak API, model data
3. `docs/DESIGN-SYSTEM.md`: tampilan, token, komponen, bahasa antarmuka
4. File ini

Bila ada yang bertentangan, urutan kewenangannya: PRD → ARCHITECTURE → DESIGN-SYSTEM → kode yang sudah ada. Bila sebuah permintaan bertentangan dengan dokumen, tanyakan dulu, lalu perbarui dokumennya bila keputusan berubah.

## 2. Cara bekerja dengan pemilik

Pemilik baru belajar coding dan memakai macOS.

- **Satu langkah per giliran.** Setiap langkah berisi: tujuan, apa yang dikerjakan, di mana, cara mengecek berhasil. Tunggu konfirmasi sebelum lanjut.
- **Berikan file lengkap yang siap tempel**, bukan potongan "ganti baris 120". Sebutkan nama file dan lokasinya.
- **Utamakan antarmuka web** (editor GitHub, editor Apps Script, Google Sheets). Bila Terminal benar-benar perlu, berikan perintah macOS lengkap dan jelaskan apa fungsinya.
- **Jelaskan dengan bahasa sederhana dulu**, istilah teknis menyusul. Analogi bisnis boleh.
- **Setiap langkah diakhiri cara uji** yang bisa dilakukan pemilik sendiri, dengan hasil yang diharapkan.
- Bila ada error, minta pemilik menyalin pesan error lengkap atau tangkapan layar, bukan menebak.

## 3. Aturan keamanan (tidak boleh dilanggar)

1. **Tidak ada rahasia di repo, chat, atau dokumen.** `PIN_PEPPER`, PIN, token, dan isi Script Properties tidak pernah ditulis, dicetak ke log, atau diminta untuk ditempel di chat.
2. **Tidak ada data pribadi di repo.** Repo ini publik. Nama pembimbing, isi catatan, log bimbingan, dan log AI hanya ada di Google Sheet.
3. **Server tidak percaya browser.** Setiap aksi di `doPost` melewati: cek token → `authorize()` → validasi input → baru baca/tulis. Jangan pernah melewati salah satunya, termasuk "sementara untuk tes".
4. **PIN tidak pernah disimpan apa adanya.** Hanya hash HMAC-SHA256 dengan salt per pengguna dan `PIN_PEPPER` (ARCHITECTURE 4.1).
5. **Token tidak pernah masuk URL** dan tidak pernah dicetak ke `console.log` atau `Logger.log`.
6. **`doGet` tidak mengembalikan data**, hanya cek hidup.
7. **Tidak ada `innerHTML` berisi data mentah.** Semua teks dari data lewat `esc()` atau `textContent`.
8. **Teks pengguna yang ditulis ke Sheet** dicegah dijalankan sebagai rumus (ARCHITECTURE bagian 6).
9. **Tidak ada library JavaScript dari luar.** Satu-satunya sumber luar adalah Google Fonts.

## 4. Konvensi kode

### Frontend (`index.html`, `styles.css`, `app.js`)

- HTML, CSS, JavaScript biasa (ES2020). Tanpa framework, tanpa build, tanpa TypeScript.
- Semua warna, jarak, dan sudut memakai token dari DESIGN-SYSTEM bagian 10. Tidak ada kode warna yang ditulis langsung di komponen.
- Ikon: SVG inline dari Lucide. Tidak memakai emoji sebagai ikon.
- `app.js` mengikuti urutan bagian di ARCHITECTURE bagian 2. Setiap bagian diawali komentar judul.
- Semua panggilan server lewat `api.call(action, payload)`. Tidak ada `fetch` lain.
- Nilai turunan (progres bab, masukan terbuka, terlambat, penghitung x/10) dihitung di frontend lewat fungsi hitung, tidak disimpan.
- "Tersimpan" hanya ditampilkan setelah `api.call` berhasil. Bila gagal, kembalikan tampilan ke keadaan sebelumnya dan tampilkan pesan.
- Tidak memakai `alert()`, `confirm()`, atau `prompt()`; gunakan banner dan sheet dari DESIGN-SYSTEM.
- Komentar kode dalam Bahasa Indonesia sederhana, menjelaskan *mengapa*, bukan mengulang *apa*.

### Backend (`apps-script/Code.gs`)

- Satu router: `doPost(e)` → tabel `ACTIONS = { 'auth.login': fn, ... }`.
- Setiap aksi tulis dibungkus `LockService.getScriptLock()`.
- Baris dicari lewat `id`. Tanggal disimpan sebagai teks `YYYY-MM-DD`. Zona waktu proyek Asia/Jakarta.
- Respons selalu `{ok:true, data}` atau `{ok:false, error:{code, message}}` dengan kode dari ARCHITECTURE bagian 5.
- Fungsi yang hanya boleh dijalankan pemilik dari editor (mis. `setupSheet()`, `createOwner()`, `resetOwnerPin()`) diletakkan di bagian "Fungsi editor", **tanpa** akhiran `_` (fungsi berakhiran `_` tidak muncul di menu Run editor). Fungsi ini aman karena `doPost` hanya menjalankan aksi yang terdaftar di tabel `ACTIONS`; fungsi editor tidak pernah didaftarkan di sana.

### Bahasa antarmuka

Ikuti DESIGN-SYSTEM bagian 9: Bahasa Indonesia, huruf kapital hanya di awal kalimat, kata kerja aktif, pesan error yang jelas tanpa minta maaf.

## 5. Definisi "selesai" untuk setiap perubahan

Sebelum menyatakan sebuah langkah selesai, pastikan:

- [ ] Tampil benar di lebar HP (375 px) dan laptop (1280 px)
- [ ] Tampil benar di mode terang dan gelap
- [ ] Bisa dipakai dengan keyboard; fokus terlihat
- [ ] Keadaan memuat, kosong, dan gagal sudah ditangani
- [ ] Bila menyentuh hak akses: diuji dengan akun pemilik dan akun pembimbing
- [ ] Bila menyentuh backend: diuji dengan permintaan tanpa token dan dengan token pembimbing, dan keduanya ditolak bila memang tidak berhak
- [ ] Tidak ada rahasia atau data pribadi yang masuk ke commit
- [ ] Dokumen di `docs/` diperbarui bila ada keputusan yang berubah

## 6. Cara menerbitkan perubahan

| Bagian | Cara |
| --- | --- |
| Frontend | Edit file di GitHub (ikon pensil) → Commit changes. GitHub Pages diperbarui dalam 1–2 menit; muat ulang halaman dengan Cmd+Shift+R |
| Backend | Edit di editor Apps Script → Simpan → Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan. **Jangan** "Deployment baru", karena URL `/exec` akan berubah. Lalu salin isi `Code.gs` ke `apps-script/Code.gs` di repo |
| Isi tracker | Ubah langsung di Google Sheet; muat ulang aplikasi |

## 7. Rencana pembangunan

Dikerjakan berurutan. Setiap tahap dipecah lagi menjadi langkah kecil saat dikerjakan. Atas keputusan pemilik (27 Okt 2026), Tahap 4–10 dibangun sebagai satu paket; pengujiannya tetap mengikuti kolom "Selesai bila" per tahap.

| Tahap | Isi | Selesai bila |
| --- | --- | --- |
| 1 | Repo baru, unggah dokumen, aktifkan GitHub Pages | Alamat Pages menampilkan README |
| 2 | Google Sheet baru + proyek Apps Script; jalankan `setupSheet()` | 16 tab dengan kolom sesuai ARCHITECTURE bagian 6 |
| 3 | `PIN_PEPPER`, akun pemilik, aksi `auth.*`, deployment Web App | Uji login berhasil, PIN salah ditolak, kunci 15 menit berjalan |
| 4 | Kerangka frontend: token CSS, tata letak, halaman Masuk | Bisa masuk dan keluar dari HP dan laptop |
| 5 | `data.bootstrap` + halaman Ringkasan | Jalur milestone dan progres bab tampil dari Sheet |
| 6 | Penulisan: Bab, Subbab, Papan Penulisan, Terlambat | Progres bab berubah saat tahap subbab diubah |
| 7 | Masukan: buat, ubah status, Masukan Terbuka, Log Masukan | Hitungan masukan terbuka per bab benar |
| 8 | Persiapan: To-Do, Bacaan, Linimasa, Syarat, Kehadiran | Semua bisa dicentang dan diberi catatan |
| 9 | Log Bimbingan dan Log AI Disclosure, termasuk ekspor ringkasan | Penghitung x/10 benar; ekspor bisa disalin |
| 10 | Kelola Akses, Ganti PIN, tampilan pembimbing | Semua uji hak akses di PRD lulus |
| 11 | Isi Sheet dengan konten final (task, linimasa, prompt, subbab) | Isi sesuai kondisi semester 3 |
| 12 | Uji penerimaan PRD bagian 9, lalu peralihan dari v1 | Semua centang lulus; v1 dimatikan |
