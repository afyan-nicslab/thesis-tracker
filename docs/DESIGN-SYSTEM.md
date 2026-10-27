# DESIGN-SYSTEM — Thesis Tracker v2

**Pemilik:** Afyan Cholil Asy'ari · **Status:** v0.3, 27 Oktober 2026
**Dokumen terkait:** PRD.md v0.5 (K7: struktur ala templat Notion, visual ala Apple)

---

## 1. Prinsip

Tracker ini terasa seperti aplikasi bawaan iPhone dan Mac: tenang, rapi, dan langsung bisa dipakai tanpa penjelasan.

1. **Konten di depan, hiasan di belakang.** Latar abu-abu muda, isi di kartu putih, tanpa gradasi atau bayangan tebal.
2. **Satu warna aksen.** Biru sistem dipakai untuk semua yang bisa diketuk. Warna lain hanya membawa makna (tahap, status).
3. **Hierarki lewat ukuran dan ketebalan huruf**, bukan lewat warna atau huruf kapital.
4. **Satu momen menonjol:** jalur milestone di halaman Ringkasan (concept note sampai Sidang), ditampilkan besar dengan tahap aktif disorot. Bagian lain tetap sederhana.
5. **Jujur soal status.** "Tersimpan" hanya tampil setelah server membalas sukses. Memuat ditunjukkan dengan indikator putar, bukan bilah progres buatan.

**Batas peniruan.** Yang diambil adalah gaya visual Apple (Human Interface Guidelines) sebagai acuan. Logo Apple, file font SF Pro, dan ikon SF Symbols tidak dipakai, karena lisensinya terbatas untuk aplikasi di platform Apple. Penggantinya dijelaskan di bagian 3 dan 6.

## 2. Warna

Nilai di bawah mengikuti warna sistem iOS. Mode gelap mengikuti pengaturan perangkat.

| Token | Terang | Gelap | Dipakai untuk |
| --- | --- | --- | --- |
| `--bg` | #F2F2F7 | #000000 | Latar halaman (grouped background) |
| `--surface` | #FFFFFF | #1C1C1E | Kartu, daftar, sidebar |
| `--surface-2` | #F2F2F7 | #2C2C2E | Sheet di atas kartu, kolom papan |
| `--fill` | rgba(118,118,128,.12) | rgba(118,118,128,.24) | Kolom input, track segmented control |
| `--label` | #000000 | #FFFFFF | Teks utama |
| `--label-2` | rgba(60,60,67,.60) | rgba(235,235,245,.60) | Teks sekunder, keterangan |
| `--label-3` | rgba(60,60,67,.30) | rgba(235,235,245,.30) | Placeholder, nonaktif |
| `--separator` | rgba(60,60,67,.29) | rgba(84,84,88,.60) | Garis tipis antarbaris |
| `--tint` | #007AFF | #0A84FF | Isi tombol utama, centang, bilah progres |
| `--tint-text` | #0066CC | #2997FF | Teks tautan dan tombol teks (kontras lebih aman untuk teks kecil) |

**Warna makna**

| Token | Terang | Gelap | Makna |
| --- | --- | --- | --- |
| `--gray` | #8E8E93 | #8E8E93 | Belum mulai |
| `--orange` | #FF9500 | #FF9F0A | Draf; Masukan dikerjakan |
| `--yellow` | #FFCC00 | #FFD60A | Revisi |
| `--teal` | #30B0C7 | #40C8E0 | Di pembimbing; dokumen Concept Note |
| `--green` | #34C759 | #30D158 | Final; Masukan selesai; syarat terpenuhi |
| `--red` | #FF3B30 | #FF453A | Terlambat; Masukan terbuka; aksi berbahaya; error |
| `--indigo` | #5856D6 | #5E5CE6 | Dokumen Proposal |
| `--purple` | #AF52DE | #BF5AF2 | Dokumen Tesis |

**Aturan**

- Warna makna dipakai sebagai titik (dot), ikon, atau latar tipis (15%). **Teks di atasnya tetap memakai `--label`**, karena oranye dan kuning di atas putih sulit dibaca.
- Status tidak boleh hanya dibedakan lewat warna; selalu ada teksnya ("Terlambat", "Selesai").
- Warna lama v1 (krem #f5f4f0, teal #01696f, Instrument Serif) dipensiunkan.

## 3. Tipografi

**Font:** `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

Di iPhone dan Mac, baris ini otomatis memakai font sistem Apple (SF). Di Windows dan Android, Inter (dimuat dari Google Fonts) menjadi pengganti terdekat, sehingga pembimbing yang memakai laptop Windows tetap mendapat tampilan serupa. File SF Pro tidak di-embed.

| Gaya | Ukuran / tinggi baris | Ketebalan | Dipakai untuk |
| --- | --- | --- | --- |
| Large Title | 34 / 41 px | 700 | Judul halaman di atas |
| Title 1 | 28 / 34 | 700 | Tahap aktif di jalur milestone |
| Title 2 | 22 / 28 | 700 | Judul sheet, judul bab di halaman detail |
| Title 3 | 20 / 25 | 600 | Judul bagian, empty state |
| Headline | 17 / 22 | 600 | Judul baris dan kartu |
| Body | 17 / 22 | 400 | Teks utama |
| Callout | 16 / 21 | 400 | Isi catatan dan masukan |
| Subheadline | 15 / 20 | 400 | Keterangan baris, angka persen |
| Footnote | 13 / 18 | 400 | Judul dan catatan kaki grup daftar |
| Caption | 12 / 16 | 500 | Label kapsul, tanggal kecil |

- Judul 28 px ke atas memakai `letter-spacing: -0.02em`.
- Angka (persen, hari, hitungan) memakai `font-variant-numeric: tabular-nums` agar tidak bergoyang saat berubah.
- Huruf kapital semua tidak dipakai untuk label. Semua judul memakai huruf kapital di awal kalimat saja (sentence case).
- Panjang baris teks maksimal ±70 karakter (lebar isi 680 px).

## 4. Jarak, sudut, dan material

| Token | Nilai | Catatan |
| --- | --- | --- |
| Jarak dasar | 4 px | Semua jarak kelipatan 4: 8, 12, 16, 20, 24, 32, 44 |
| Margin halaman | 16 px (HP), 20 px (≥768), 32 px (≥1024) | |
| Tinggi minimum target ketuk | 44 px | Berlaku untuk semua tombol dan baris |
| `--r-sm` | 8 px | Baris terpilih di sidebar, kapsul kecil |
| `--r-md` | 10 px | Input, kartu di papan |
| `--r-lg` | 12 px | Grup daftar, tombol besar, kolom papan |
| `--r-xl` | 16 px | Sheet dan dialog |
| `--r-full` | 9999 px | Kapsul label, bilah progres |
| Garis pemisah | 0.5 px (layar retina), 1 px (lainnya) | Inset 16 px dari kiri, sejajar teks |
| Material bar | `background: rgba(249,249,249,.8)` gelap `rgba(29,29,31,.72)`; `backdrop-filter: saturate(180%) blur(20px)` | Untuk nav bar dan tab bar yang tembus pandang |
| Bayangan | Hanya untuk segmented control terpilih dan sheet | Kartu biasa tidak berbayang |

## 5. Tata letak

**Breakpoint:** HP < 768 px · Tablet 768–1023 px · Laptop ≥ 1024 px

**HP:** judul besar yang mengecil menjadi nav bar tembus pandang saat digulir, dan tab bar di bawah (5 tab).

| Tab | Isi |
| --- | --- |
| Ringkasan | Jalur milestone, progres bab, syarat yang belum terpenuhi |
| Penulisan | Bab, Papan Penulisan, Terlambat |
| Masukan | Masukan Terbuka, Log Masukan |
| Log | Log Bimbingan, Log AI Disclosure |
| Lainnya | To-Do Persiapan, Bacaan, Linimasa, Syarat, Prompt, Kelola Akses, Akun |

**Laptop:** sidebar kiri 260 px (gaya daftar sumber di aplikasi Mail/Notes), dikelompokkan: Ringkasan · Penulisan · Masukan · Persiapan · Administrasi · Pengaturan. Isi di tengah, lebar maksimal 680 px untuk daftar dan 100% untuk papan.

**Akun pembimbing** hanya melihat menu yang diizinkan K6. Tombol ubah tidak ditampilkan, dan di nav bar muncul kapsul kecil "Hanya baca" pada halaman yang tidak bisa diubah.

```
HP — Ringkasan                      HP — Sign-in
┌──────────────────────────┐        ┌──────────────────────────┐
│ Ringkasan        (Large) │        │                          │
│                          │        │        [ikon app]        │
│ Jalur menuju Sidang      │        │   Masuk ke Thesis        │
│ ● Concept note    Selesai│        │   Tracker                │
│ ◉ Pengajuan pembimbing   │        │                          │
│   (Title 1, disorot)     │        │ ┌──────────────────────┐ │
│ ○ Seminar proposal       │        │ │ Email                │ │
│ ○ Bimbingan 0/10         │        │ ├──────────────────────┤ │
│ ○ Seminar hasil          │        │ │ PIN          ••••••  │ │
│ ○ Sidang                 │        │ └──────────────────────┘ │
│                          │        │ Ingat perangkat ini  [◯] │
│ Progres bab              │        │                          │
│ ┌──────────────────────┐ │        │ ┌──────────────────────┐ │
│ │ I Pendahuluan    38% │ │        │ │        Masuk         │ │
│ │ ▓▓▓▓░░░░░░           │ │        │ └──────────────────────┘ │
│ ├──────────────────────┤ │        │ Email atau PIN salah.    │
│ │ II Tinjauan ...   0% │ │        │                          │
│ └──────────────────────┘ │        │                          │
├──────────────────────────┤        └──────────────────────────┘
│ Ring. Tulis Masuk. Log ⋯ │
└──────────────────────────┘
```

## 6. Ikon

- Set ikon: **Lucide** (lisensi ISC, bebas dipakai), disisipkan sebagai SVG inline, `stroke-width: 1.75`.
- Ukuran: 24 px di tab bar, 18 px di sidebar, 20 px di baris daftar.
- Warna ikon mengikuti teks di sebelahnya; ikon di tab/sidebar aktif memakai `--tint`.
- Emoji tidak dipakai sebagai ikon (v1 memakai emoji di fase dan tombol).

## 7. Komponen

| Komponen | Spesifikasi |
| --- | --- |
| **Grup daftar (inset grouped)** | Latar `--surface`, sudut `--r-lg`, baris minimal 44 px, padding horizontal 16 px, pemisah inset. Judul grup di atas (Footnote, `--label-2`) dan catatan kaki di bawah (Footnote). Catatan kaki inilah pengganti kotak callout Notion untuk penjelasan singkat |
| **Baris daftar** | Ikon atau titik warna di kiri, judul (Headline atau Body), teks detail di kanan (`--label-2`), chevron bila membuka halaman lain |
| **Lingkaran centang** | Diameter 22 px, garis 1.5 px `--label-3`; saat dicentang terisi `--tint` dengan tanda centang putih. Dipakai untuk task, bacaan, dan syarat |
| **Kapsul label** | Tinggi 22 px, `--r-full`, latar warna makna 15%, titik 6 px warna penuh, teks Caption `--label` |
| **Bilah progres** | Tinggi 6 px, track `--fill`, isi `--tint` (berubah `--green` di 100%), angka persen di kanan (Subheadline, tabular) |
| **Baris bab** | Judul bab (Headline), di bawahnya bilah progres, lalu dua baris Footnote: "2 dari 5 subbab final" dan "Target 20 Des 2026, 55 hari lagi". Kapsul merah "3 masukan terbuka" bila ada |
| **Papan Penulisan** | Laptop dan tablet: lima kolom per tahap (lebar minimal 170 px, muat sekaligus di laptop), latar `--surface-2`, sudut `--r-lg`; kartu subbab `--surface`, sudut `--r-md`, tanpa bayangan. Seret: kursor tangan, kartu asal memudar, salinan kartu mengikuti kursor dengan miring 2° dan bayangan, kolom tujuan tersorot latar `--tint` 12% dan garis `--tint`; setelah dilepas kartu menunggu server ("Menyimpan…"). HP: segmented control untuk memilih tahap + daftar; pindah tahap lewat pilihan tahap di kartu |
| **Segmented control** | Track `--fill`, sudut 9 px; segmen terpilih `--surface` dengan bayangan halus, sudut 7 px. Dipakai untuk filter (Semua / Belum / Selesai) |
| **Tombol** | Utama: latar `--tint`, teks putih Headline, tinggi 50 px (HP) / 36 px (laptop), sudut `--r-lg`. Sekunder (tinted): latar `--tint` 15%, teks `--tint-text`. Teks: hanya `--tint-text`. Berbahaya: memakai `--red` |
| **Input** | Latar `--fill`, tanpa border, tinggi 44 px, sudut `--r-md`. Fokus: cincin 3 px `--tint` 40%. Input PIN: `type="password"`, `inputmode="numeric"`, `autocomplete="current-password"` |
| **Sheet** | HP: muncul dari bawah, sudut atas `--r-xl`, garis pegangan 36 × 5 px. Laptop: dialog di tengah, lebar 480 px. Dipakai untuk mengisi masukan, log bimbingan, dan catatan |
| **Status simpan** | Di samping tombol: indikator putar + "Menyimpan…", lalu ikon centang + "Tersimpan" **setelah server membalas**, atau ikon peringatan + "Gagal menyimpan" + tombol "Coba lagi" |
| **Banner** | Pengganti `alert()`: kotak `--r-lg` dengan latar warna makna 15%, ikon, dan pesan; tetap di halaman sampai ditutup atau masalah selesai |
| **Empty state** | Ikon 48 px `--label-3`, judul Title 3, satu kalimat Footnote, dan satu tombol aksi bila relevan |
| **Memuat** | Indikator putar di tengah saat pertama kali; baris kerangka (skeleton) abu-abu untuk daftar |

## 8. Gerak

- Durasi 250 ms, kurva `cubic-bezier(.25,.1,.25,1)`; sheet 350 ms dengan kurva `cubic-bezier(.32,.72,0,1)`.
- Gerak hanya muncul sebagai respons tindakan: sheet naik, centang terisi, bilah progres bertambah. Tidak ada animasi saat halaman dibuka.
- `prefers-reduced-motion: reduce` → semua perpindahan menjadi pudar instan tanpa geser.

## 9. Bahasa antarmuka

- Bahasa Indonesia, kalimat pendek, kata kerja aktif. Nama tombol sama dengan hasilnya: "Simpan catatan" → "Tersimpan"; "Tandai selesai" → kapsul "Selesai".
- Pesan error menyebut apa yang terjadi dan apa yang bisa dilakukan, tanpa meminta maaf. Contoh: "Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi."
- Pesan gagal masuk selalu "Email atau PIN salah.", tanpa menyebut mana yang salah atau sisa percobaan, agar tidak membocorkan email mana yang terdaftar. Saat terkunci: "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
- Empty state mengarahkan tindakan. Contoh: "Belum ada masukan terbuka. Masukan baru dari pembimbing akan muncul di sini."
- Istilah konsisten: Bab, Subbab, Tahap, Masukan, Log Bimbingan, Log AI Disclosure.

## 10. Token CSS (acuan untuk kode)

```css
:root {
  --bg:#F2F2F7; --surface:#FFFFFF; --surface-2:#F2F2F7;
  --fill:rgba(118,118,128,.12);
  --label:#000; --label-2:rgba(60,60,67,.6); --label-3:rgba(60,60,67,.3);
  --separator:rgba(60,60,67,.29);
  --tint:#007AFF; --tint-text:#0066CC;
  --gray:#8E8E93; --orange:#FF9500; --yellow:#FFCC00; --teal:#30B0C7;
  --green:#34C759; --red:#FF3B30; --indigo:#5856D6; --purple:#AF52DE;
  --bar:rgba(249,249,249,.8);
  --r-sm:8px; --r-md:10px; --r-lg:12px; --r-xl:16px; --r-full:9999px;
  --font:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --ease:cubic-bezier(.25,.1,.25,1); --ease-sheet:cubic-bezier(.32,.72,0,1);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:#000; --surface:#1C1C1E; --surface-2:#2C2C2E;
    --fill:rgba(118,118,128,.24);
    --label:#FFF; --label-2:rgba(235,235,245,.6); --label-3:rgba(235,235,245,.3);
    --separator:rgba(84,84,88,.6);
    --tint:#0A84FF; --tint-text:#2997FF;
    --orange:#FF9F0A; --yellow:#FFD60A; --teal:#40C8E0;
    --green:#30D158; --red:#FF453A; --indigo:#5E5CE6; --purple:#BF5AF2;
    --bar:rgba(29,29,31,.72);
  }
}
```

## 11. Keputusan desain terbuka

| Kode | Pertanyaan | Rekomendasi | Status |
| --- | --- | --- | --- |
| D1 | Warna aksen | Biru sistem Apple. Bisa diganti kapan saja cukup dengan mengubah `--tint` dan `--tint-text` | **Diputuskan 26 Okt 2026** |
| D2 | Tombol ganti tema manual | Tidak perlu; ikuti pengaturan perangkat seperti aplikasi Apple | **Disetujui 26 Okt 2026** |
