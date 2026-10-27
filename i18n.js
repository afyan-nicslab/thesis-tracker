/* Thesis Tracker v2 — kamus bahasa (F21)
   Acuan: docs/ARCHITECTURE.md bagian 2b dan DESIGN-SYSTEM.md bagian 9 (padanan istilah).
   Aturan: setiap kunci wajib ada di STR.id dan STR.en. Sisipan nilai memakai {nama}. */
'use strict';

const STR = {
  id: {
    'common.save': 'Simpan', 'common.saving': 'Menyimpan…', 'common.add': 'Tambah', 'common.edit': 'Ubah', 'common.delete': 'Hapus',
    'common.copy': 'Salin', 'common.close': 'Tutup', 'common.retry': 'Coba lagi', 'common.loading': 'Memuat',
    'common.readOnly': 'Hanya baca', 'common.viewOptions': 'Pilihan tampilan', 'common.mainMenu': 'Menu utama',
    'common.doneOf': '{n} dari {total} selesai', 'common.noteOptional': 'Catatan (opsional)',

    'nav.ringkasan': 'Ringkasan', 'nav.penulisan': 'Penulisan', 'nav.bab': 'Bab', 'nav.papan': 'Papan Penulisan', 'nav.terlambat': 'Terlambat',
    'nav.masukan': 'Masukan', 'nav.masukanTerbuka': 'Masukan terbuka', 'nav.logMasukan': 'Log masukan', 'nav.log': 'Log',
    'nav.logBimbingan': 'Log Bimbingan', 'nav.logAi': 'Log AI Disclosure', 'nav.lainnya': 'Lainnya', 'nav.todo': 'To-Do',
    'nav.bacaan': 'Bacaan', 'nav.linimasa': 'Linimasa', 'nav.syarat': 'Syarat', 'nav.prompt': 'Prompt', 'nav.akses': 'Kelola Akses', 'nav.akun': 'Akun',
    'navg.penulisan': 'Penulisan', 'navg.masukan': 'Masukan', 'navg.persiapan': 'Persiapan', 'navg.administrasi': 'Administrasi',
    'navg.alat': 'Alat', 'navg.pengaturan': 'Pengaturan',
    'seg.papan': 'Papan', 'seg.open': 'Terbuka', 'seg.bimbingan': 'Bimbingan', 'seg.ai': 'AI Disclosure',
    'role.owner': 'Pemilik', 'role.supervisor': 'Pembimbing',

    'lang.group': 'Bahasa', 'lang.switchTo': 'English',

    'login.lead': 'Masuk untuk melihat progres tesis.', 'login.remember': 'Ingat perangkat ini', 'login.submit': 'Masuk',
    'login.busy': 'Masuk…', 'login.fillBoth': 'Isi email dan PIN.', 'login.docTitle': 'Masuk – Thesis Tracker',

    'stage.0': 'Belum mulai', 'stage.1': 'Draf', 'stage.2': 'Revisi', 'stage.3': 'Di pembimbing', 'stage.4': 'Final',
    'stageShort.0': 'Belum', 'stageShort.1': 'Draf', 'stageShort.2': 'Revisi', 'stageShort.3': 'Pembimbing', 'stageShort.4': 'Final',
    'fb.open': 'Terbuka', 'fb.doing': 'Dikerjakan', 'fb.done': 'Selesai',
    'from.P1': 'Pembimbing 1', 'from.P2': 'Pembimbing 2', 'from.PENGUJI': 'Penguji Sempro',
    'doc.CN': 'Concept Note', 'doc.PROP': 'Proposal', 'doc.TESIS': 'Tesis',
    'verify.none': 'Belum dicek', 'verify.perlu-cek': 'Perlu dicek', 'verify.terverifikasi': 'Terverifikasi',
    'help.Tutor': 'Tutor', 'help.Kritik': 'Kritik', 'help.Cek logika': 'Cek logika', 'help.Lainnya': 'Lainnya',
    'mode.Tatap muka': 'Tatap muka', 'mode.Daring': 'Daring',
    'ms.todo': 'Belum', 'ms.active': 'Sedang berjalan', 'ms.done': 'Selesai', 'ms.dateLabel': 'Tanggal (target atau selesai)',

    'rel.today': 'hari ini', 'rel.tomorrow': 'besok', 'rel.yesterday': 'kemarin', 'rel.in': '{n} hari lagi', 'rel.ago': 'lewat {n} hari',

    'home.pathLabel': 'Jalur menuju Sidang', 'home.bimbinganCount': '{n} dari {min} kali', 'home.doneOn': 'Selesai {date}', 'home.targetOn': 'Target {date}',
    'home.changeStatus': 'Ubah status {name}', 'home.pathEmpty': 'Jalur belum diisi',
    'home.pathEmptyText': 'Jalankan seedStructure() di editor Apps Script untuk mengisi jalur menuju Sidang.',
    'home.statLate': 'Subbab terlambat', 'home.statOpen': 'Masukan terbuka', 'home.statBimbingan': 'Bimbingan', 'home.statSempro': 'Syarat Sempro',
    'home.progress': 'Progres bab', 'home.supervisors': 'Pembimbing: {names}', 'home.noSupervisor': 'Calon pembimbing belum ditambahkan ke tracker.',
    'home.hello': 'Halo, {name}.',

    'ch.label': 'Bab {n} {title}', 'ch.notFound': 'Bab tidak ditemukan', 'ch.backTo': 'Kembali ke Penulisan',
    'ch.targetRel': 'Target {date}, {rel}', 'ch.noTarget': 'Belum ada tanggal target', 'ch.notSet': 'Belum diatur',
    'ch.finalCount': '{n} dari {total} subbab final', 'ch.openFb': '{n} masukan terbuka',
    'ch.empty': 'Belum ada bab', 'ch.emptyText': 'Jalankan seedStructure() di editor Apps Script untuk mengisi bab dan subbab dari Panduan Tesis.',
    'ch.sections': 'Subbab', 'ch.sectionsHint': 'Ketuk subbab untuk mengubah tahap, tenggat, jumlah kata, deskripsi, atau tautan dokumen.',
    'ch.feedback': 'Masukan untuk bab ini', 'ch.noFeedback': 'Belum ada masukan.',
    'sec.due': 'Tenggat {date}, {rel}', 'sec.words': '{n} kata',

    'board.moveTo': 'Pindahkan ke', 'board.empty': 'Belum ada subbab', 'board.emptyText': 'Isi bab dan subbab lewat seedStructure() di editor Apps Script.',
    'board.stageCol': 'Tahap {stage}', 'board.inStage': '{n} subbab di tahap {stage}', 'board.noneInStage': 'Tidak ada subbab di tahap ini.',
    'board.hint': 'Klik kartu untuk mengubah detail subbab. Seret kartu ke tahap lain, atau pakai pilihan tahap di kartu.', 'board.editCard': 'Ubah {name}',

    'late.count': '{n} subbab lewat tenggat dan belum final.', 'late.empty': 'Tidak ada yang terlambat',
    'late.emptyText': 'Subbab yang lewat tenggat dan belum final akan muncul di sini.',

    'fb.fromOn': '{from}, diterima {date}', 'fb.waiting': ', menunggu {n} hari', 'fb.add': 'Tambah masukan', 'fb.new': 'Masukan baru', 'fb.one': 'Masukan',
    'fb.oldestFirst': 'Yang paling lama menunggu ada di atas.', 'fb.emptyAll': 'Belum ada masukan', 'fb.emptyOpen': 'Tidak ada masukan terbuka',
    'fb.emptyAllText': 'Masukan dari pembimbing dan penguji akan tercatat di sini.', 'fb.emptyOpenText': 'Masukan baru dari pembimbing akan muncul di sini.',
    'fb.nextStepOptional': 'Langkahku (opsional)', 'fb.noChapters': 'Belum ada bab. Isi bab lewat seedStructure() dulu.',

    'log.counter': '{n} dari {min} bimbingan', 'log.counterFoot': 'Bimbingan minimal 10 kali adalah syarat Seminar Hasil (Panduan Tesis 2025, Bab V).',
    'log.history': 'Riwayat', 'log.empty': 'Belum ada bimbingan', 'log.emptyOwner': 'Catat setiap pertemuan bimbingan agar kartu bimbingan mudah diisi.',
    'log.emptySup': 'Riwayat bimbingan akan muncul di sini.', 'log.one': 'Bimbingan', 'log.new': 'Bimbingan baru', 'log.edit': 'Ubah bimbingan', 'log.add': 'Tambah bimbingan',
    'ai.foot': 'Tombol Salin menyusun ringkasan untuk formulir AI disclosure saat mendaftar Seminar Proposal dan Sidang.',
    'ai.empty': 'Belum ada catatan AI', 'ai.emptyOwner': 'Catat setiap kali AI membantu pengerjaan tesis, untuk bahan formulir AI disclosure.',
    'ai.emptySup': 'Catatan penggunaan AI akan muncul di sini.', 'ai.one': 'Catatan AI', 'ai.new': 'Catatan AI baru', 'ai.edit': 'Ubah catatan AI', 'ai.add': 'Tambah catatan',
    'ai.toolPh': 'mis. Claude', 'ai.purposePh': 'mis. Mengkritik logika rumusan masalah', 'ai.partPh': 'mis. Bab I',

    'todo.all': 'Semua', 'todo.open': 'Belum', 'todo.done': 'Selesai', 'todo.empty': 'Belum ada task',
    'todo.emptyText': 'Isi task di tab Tasks pada Google Sheet, lalu muat ulang halaman ini.', 'todo.task': 'Task',
    'todo.markDone': 'Tandai selesai: {title}', 'todo.hasNote': 'Ada catatan', 'todo.noneForFilter': 'Tidak ada task untuk filter ini.', 'todo.noteTitle': 'Catatan task',

    'read.empty': 'Belum ada bacaan', 'read.emptyText': 'Impor daftar bacaan ke tab Readings di Google Sheet, lalu muat ulang halaman ini.',
    'read.doneOf': '{n} dari {total} selesai dibaca', 'read.other': 'Lainnya', 'read.markDone': 'Tandai sudah dibaca: {title}',
    'read.one': 'Bacaan', 'read.title': 'Judul', 'read.source': 'Sumber', 'read.isRead': 'Sudah dibaca', 'read.notRead': 'Belum dibaca',
    'read.verifyLabel': 'Status verifikasi referensi',

    'tl.empty': 'Linimasa masih kosong', 'tl.emptyText': 'Isi rencana per bulan di tab Timeline pada Google Sheet (kolom month berformat YYYY-MM).',
    'tl.sub': 'Rencana per bulan menuju Sidang.', 'tl.thisMonth': '(bulan ini)',

    'req.sempro': 'Seminar proposal', 'req.semhas': 'Seminar hasil', 'req.sidang': 'Sidang tesis', 'req.groupTitle': '{stage} ({n} dari {total})',
    'req.hintSempro': 'Tercatat {n} dari {min} kehadiran Sempro.', 'req.hintTotal': 'Tercatat {n} dari {min} kehadiran.',
    'req.hintBimbingan': 'Tercatat {n} dari {min} bimbingan.', 'req.evidence': 'Bukti: {text}', 'req.markDone': 'Tandai terpenuhi: {text}',
    'req.sub': 'Syarat administrasi dari Panduan Tesis Tazkia 2025.', 'req.empty': 'Belum ada syarat',
    'req.emptyText': 'Jalankan seedStructure() di editor Apps Script untuk mengisi syarat dari Panduan Tesis.', 'req.one': 'Syarat',
    'req.evidenceLabel': 'Bukti atau catatan (mis. tanggal unggah di SMILE)',
    'att.group': 'Kehadiran Sempro dan sidang ({n})', 'att.sempro': 'Seminar proposal', 'att.sidang': 'Sidang', 'att.deleteLabel': 'Hapus kehadiran {title}',
    'att.empty': 'Belum ada kehadiran tercatat.', 'att.foot': 'Sempro dihadiri: {sp} dari {spMin} (syarat Sempro). Total: {tot} dari {totMin} (syarat Seminar Hasil).',
    'att.add': 'Tambah kehadiran', 'att.new': 'Kehadiran baru', 'att.deleteTitle': 'Hapus kehadiran?', 'att.deleteText': '{title}, {date}. Catatan ini akan dihapus dari Sheet.',

    'prompt.empty': 'Belum ada prompt', 'prompt.emptyText': 'Isi prompt di tab Prompts pada Google Sheet. Utamakan prompt untuk kritik dan tutor, bukan menulis teks jadi.',
    'prompt.sub': 'Prompt untuk kritik dan belajar, sesuai batas AI 15% Tazkia.',

    'access.addBtn': 'Pembimbing', 'access.sub': 'Hanya akun di daftar ini yang bisa masuk.', 'access.lastLogin': 'Terakhir masuk {date}',
    'access.neverLogin': 'Belum pernah masuk', 'access.resetPin': 'Reset PIN', 'access.active': 'Aktif', 'access.activeLabel': 'Akun {name} aktif',
    'access.foot': 'Menonaktifkan akun langsung mengeluarkan akun itu dari semua perangkat. Berikan PIN awal pembimbing lewat jalur pribadi; pembimbing bisa menggantinya sendiri di halaman Akun.',
    'access.addTitle': 'Tambah pembimbing', 'access.initialPin': 'PIN awal (6–12 digit)', 'access.newPin': 'PIN baru (6–12 digit)',
    'access.addFoot': 'Berikan PIN awal lewat jalur pribadi. Pembimbing bisa menggantinya di halaman Akun.',
    'access.resetFoot': 'Akun ini akan dikeluarkan dari semua perangkat.', 'access.activated': 'Akun diaktifkan.',
    'access.deactivated': 'Akun dinonaktifkan dan dikeluarkan dari semua perangkat.',

    'account.role': 'Peran', 'account.changePin': 'Ganti PIN', 'account.oldPin': 'PIN lama',
    'account.newPinRule': 'PIN baru (6–12 digit, bukan urutan atau angka berulang)', 'account.newPin2': 'Ketik ulang PIN baru',
    'account.pinAgain': 'Ketik ulang PIN', 'account.pinChanged': 'PIN diganti', 'account.logout': 'Keluar',

    'pwa.group': 'Aplikasi', 'pwa.installed': 'Terpasang di perangkat ini', 'pwa.installText': 'Pasang tracker di perangkat ini agar terbuka seperti aplikasi.',
    'pwa.install': 'Pasang aplikasi', 'pwa.iosText': 'Ketuk tombol Bagikan di Safari, lalu pilih "Tambahkan ke Layar Utama".',
    'pwa.iosFoot': 'Setelah terpasang, masuk sekali lagi dan centang "Ingat perangkat ini" agar tidak diminta PIN setiap kali.',
    'pwa.otherText': 'Buka di Chrome atau Edge untuk memasang, atau pakai menu browser "Pasang" atau "Tambahkan ke Dock".',

    'offline.pill': 'Offline. Menampilkan data per {time}', 'offline.title': 'Sedang offline',
    'offline.text': 'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.',
    'offline.accessText': 'Kelola Akses hanya bisa dibuka saat tersambung ke internet.',
    'load.title': 'Data belum bisa dimuat',

    'sync.running': 'Menyinkronkan…', 'sync.sending': 'Mengirim perubahan ke server', 'sync.progressMany': '{done} dari {total} perubahan selesai',
    'sync.done': 'Tersinkron', 'sync.saved': 'Perubahan tersimpan', 'sync.savedMany': '{n} perubahan tersimpan', 'sync.failed': 'Gagal menyinkronkan',

    'copy.bimbingan': 'Ringkasan bimbingan tersalin.', 'copy.ai': 'Ringkasan AI disclosure tersalin.', 'copy.prompt': 'Prompt tersalin.', 'copy.failed': 'Gagal menyalin. Coba lagi.',
    'sum.bimbinganTitle': 'Log bimbingan tesis ({n} kali)', 'sum.aiTitle': 'Catatan penggunaan AI dalam penyusunan tesis ({n} catatan)',

    'field.id': 'id', 'field.status': 'Status', 'field.note': 'Catatan', 'field.verifyStatus': 'Status verifikasi', 'field.targetDate': 'Tanggal target',
    'field.stage': 'Tahap', 'field.dueDate': 'Tenggat', 'field.words': 'Jumlah kata', 'field.feedbackText': 'Isi masukan', 'field.chapter': 'Bab',
    'field.from': 'Dari', 'field.receivedAt': 'Tanggal diterima', 'field.nextStep': 'Langkahku', 'field.bimbingan': 'Log bimbingan', 'field.date': 'Tanggal',
    'field.supervisor': 'Pembimbing', 'field.mode': 'Cara bimbingan', 'field.topic': 'Topik', 'field.input': 'Masukan', 'field.inputLong': 'Masukan pembimbing',
    'field.followUp': 'Tindak lanjut', 'field.tool': 'Alat AI', 'field.purpose': 'Tujuan', 'field.thesisPart': 'Bagian tesis', 'field.helpType': 'Jenis bantuan',
    'field.evidence': 'Bukti', 'field.attendanceType': 'Jenis', 'field.attendanceTitle': 'Judul atau nama penyaji', 'field.email': 'Email', 'field.name': 'Nama',
    'field.active': 'Status aktif',
    'field.desc': 'Deskripsi', 'field.link': 'Tautan dokumen',
    'link.open': 'Buka di {src}', 'link.none': 'Belum ada', 'link.placeholder': 'https://docs.google.com/…',
    'link.hint': 'Tempel alamat dokumen (Google Docs, Drive, Dropbox, OneDrive, Overleaf). Harus diawali https://. Pastikan pembimbing diberi akses di layanan itu.',
    'ch.editDetails': 'Ubah detail bab', 'ch.descPh': 'mis. Fokus Bab I: latar belakang transmisi moneter syariah', 'sec.descPh': 'mis. Tambah data 2025 dan rapikan tabel 1.1',
    'err.urlFormat': '{field} harus berupa alamat yang diawali https://',

    'err.network': 'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.', 'err.server': 'Terjadi kesalahan di server. Coba lagi.',
    'err.generic': 'Terjadi kesalahan. Coba lagi.', 'err.saveFailed': 'Gagal menyimpan. Coba lagi.',
    'err.offline': 'Sedang offline. Perubahan bisa dibuat setelah tersambung.', 'err.session': 'Sesi sudah berakhir. Silakan masuk lagi.',
    'err.login': 'Email atau PIN salah.', 'err.locked': 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.', 'err.oldPin': 'PIN lama salah.',
    'err.forbidden': 'Kamu tidak punya akses untuk tindakan ini.', 'err.ownFeedback': 'Kamu hanya bisa mengubah masukan yang kamu tulis.',
    'err.badRequest': 'Permintaan tidak valid.', 'err.unknownAction': 'Aksi tidak dikenal.', 'err.notFound': 'Data tidak ditemukan. Muat ulang halaman.',
    'err.accountNotFound': 'Akun tidak ditemukan.', 'err.required': '{field} wajib diisi.', 'err.tooLong': '{field} maksimal {max} karakter.',
    'err.dateFormat': '{field} harus berupa tanggal yang valid.', 'err.invalid': '{field} tidak valid.',
    'err.bimbinganRequired': 'Tanggal, pembimbing, cara, dan topik wajib diisi.', 'err.ailogRequired': 'Tanggal, alat, tujuan, dan jenis bantuan wajib diisi.',
    'err.emailFormat': 'Format email tidak valid.', 'err.emailExists': 'Email ini sudah terdaftar.', 'err.selfDeactivate': 'Kamu tidak bisa menonaktifkan akunmu sendiri.',
    'err.ownerPinElsewhere': 'PIN pemilik diganti lewat halaman Akun atau menu di Sheet.',
    'err.pinLength': 'PIN harus 6 sampai 12 digit angka.', 'err.pinRepeat': 'PIN tidak boleh berupa angka yang sama berulang.',
    'err.pinSequence': 'PIN tidak boleh berupa urutan angka.', 'err.pinMismatch': 'PIN tidak sama.'
  },

  en: {
    'common.save': 'Save', 'common.saving': 'Saving…', 'common.add': 'Add', 'common.edit': 'Edit', 'common.delete': 'Delete',
    'common.copy': 'Copy', 'common.close': 'Close', 'common.retry': 'Try again', 'common.loading': 'Loading',
    'common.readOnly': 'Read only', 'common.viewOptions': 'View options', 'common.mainMenu': 'Main menu',
    'common.doneOf': '{n} of {total} done', 'common.noteOptional': 'Note (optional)',

    'nav.ringkasan': 'Overview', 'nav.penulisan': 'Writing', 'nav.bab': 'Chapters', 'nav.papan': 'Writing board', 'nav.terlambat': 'Overdue',
    'nav.masukan': 'Feedback', 'nav.masukanTerbuka': 'Open feedback', 'nav.logMasukan': 'Feedback log', 'nav.log': 'Log',
    'nav.logBimbingan': 'Supervision log', 'nav.logAi': 'AI disclosure log', 'nav.lainnya': 'More', 'nav.todo': 'To-do',
    'nav.bacaan': 'Readings', 'nav.linimasa': 'Timeline', 'nav.syarat': 'Requirements', 'nav.prompt': 'Prompts', 'nav.akses': 'Access', 'nav.akun': 'Account',
    'navg.penulisan': 'Writing', 'navg.masukan': 'Feedback', 'navg.persiapan': 'Preparation', 'navg.administrasi': 'Administration',
    'navg.alat': 'Tools', 'navg.pengaturan': 'Settings',
    'seg.papan': 'Board', 'seg.open': 'Open', 'seg.bimbingan': 'Supervision', 'seg.ai': 'AI disclosure',
    'role.owner': 'Owner', 'role.supervisor': 'Supervisor',

    'lang.group': 'Language', 'lang.switchTo': 'Bahasa Indonesia',

    'login.lead': 'Sign in to see thesis progress.', 'login.remember': 'Remember this device', 'login.submit': 'Sign in',
    'login.busy': 'Signing in…', 'login.fillBoth': 'Enter your email and PIN.', 'login.docTitle': 'Sign in – Thesis Tracker',

    'stage.0': 'Not started', 'stage.1': 'Draft', 'stage.2': 'Revising', 'stage.3': 'With supervisor', 'stage.4': 'Final',
    'stageShort.0': 'Not started', 'stageShort.1': 'Draft', 'stageShort.2': 'Revising', 'stageShort.3': 'Supervisor', 'stageShort.4': 'Final',
    'fb.open': 'Open', 'fb.doing': 'In progress', 'fb.done': 'Done',
    'from.P1': 'Supervisor 1', 'from.P2': 'Supervisor 2', 'from.PENGUJI': 'Proposal examiner',
    'doc.CN': 'Concept note', 'doc.PROP': 'Proposal', 'doc.TESIS': 'Thesis',
    'verify.none': 'Not checked', 'verify.perlu-cek': 'Needs checking', 'verify.terverifikasi': 'Verified',
    'help.Tutor': 'Tutoring', 'help.Kritik': 'Critique', 'help.Cek logika': 'Logic check', 'help.Lainnya': 'Other',
    'mode.Tatap muka': 'In person', 'mode.Daring': 'Online',
    'ms.todo': 'Not started', 'ms.active': 'In progress', 'ms.done': 'Done', 'ms.dateLabel': 'Date (target or completed)',

    'rel.today': 'today', 'rel.tomorrow': 'tomorrow', 'rel.yesterday': 'yesterday', 'rel.in': 'in {n} days', 'rel.ago': '{n} days overdue',

    'home.pathLabel': 'Path to the thesis defense', 'home.bimbinganCount': '{n} of {min} sessions', 'home.doneOn': 'Done {date}', 'home.targetOn': 'Target {date}',
    'home.changeStatus': 'Change status of {name}', 'home.pathEmpty': 'Path not set up yet',
    'home.pathEmptyText': 'Run seedStructure() in the Apps Script editor to fill in the path to the defense.',
    'home.statLate': 'Overdue sections', 'home.statOpen': 'Open feedback', 'home.statBimbingan': 'Supervision', 'home.statSempro': 'Proposal requirements',
    'home.progress': 'Chapter progress', 'home.supervisors': 'Supervisors: {names}', 'home.noSupervisor': 'No supervisor added to the tracker yet.',
    'home.hello': 'Hi, {name}.',

    'ch.label': 'Chapter {n} {title}', 'ch.notFound': 'Chapter not found', 'ch.backTo': 'Back to Writing',
    'ch.targetRel': 'Target {date}, {rel}', 'ch.noTarget': 'No target date', 'ch.notSet': 'Not set',
    'ch.finalCount': '{n} of {total} sections final', 'ch.openFb': '{n} open feedback',
    'ch.empty': 'No chapters yet', 'ch.emptyText': 'Run seedStructure() in the Apps Script editor to fill in chapters and sections from the thesis guide.',
    'ch.sections': 'Sections', 'ch.sectionsHint': 'Tap a section to change its stage, due date, word count, description, or document link.',
    'ch.feedback': 'Feedback on this chapter', 'ch.noFeedback': 'No feedback yet.',
    'sec.due': 'Due {date}, {rel}', 'sec.words': '{n} words',

    'board.moveTo': 'Move to', 'board.empty': 'No sections yet', 'board.emptyText': 'Fill in chapters and sections with seedStructure() in the Apps Script editor.',
    'board.stageCol': '{stage} stage', 'board.inStage': '{n} sections in {stage}', 'board.noneInStage': 'No sections in this stage.',
    'board.hint': 'Click a card to edit the section. Drag a card to another stage, or use the stage picker on the card.', 'board.editCard': 'Edit {name}',

    'late.count': '{n} sections are past due and not final.', 'late.empty': 'Nothing overdue',
    'late.emptyText': 'Sections that are past due and not final will appear here.',

    'fb.fromOn': '{from}, received {date}', 'fb.waiting': ', waiting {n} days', 'fb.add': 'Add feedback', 'fb.new': 'New feedback', 'fb.one': 'Feedback',
    'fb.oldestFirst': 'The longest-waiting items are at the top.', 'fb.emptyAll': 'No feedback yet', 'fb.emptyOpen': 'No open feedback',
    'fb.emptyAllText': 'Feedback from supervisors and examiners will be recorded here.', 'fb.emptyOpenText': 'New feedback from supervisors will appear here.',
    'fb.nextStepOptional': 'My next step (optional)', 'fb.noChapters': 'No chapters yet. Fill them in with seedStructure() first.',

    'log.counter': '{n} of {min} supervision sessions', 'log.counterFoot': 'At least 10 supervision sessions are required for the results seminar (Tazkia Thesis Guide 2025, Chapter V).',
    'log.history': 'History', 'log.empty': 'No supervision sessions yet', 'log.emptyOwner': 'Record each supervision meeting so the supervision card is easy to fill in.',
    'log.emptySup': 'Supervision history will appear here.', 'log.one': 'Supervision session', 'log.new': 'New session', 'log.edit': 'Edit session', 'log.add': 'Add session',
    'ai.foot': 'Copy builds a summary for the AI disclosure form when registering for the proposal seminar and the defense.',
    'ai.empty': 'No AI entries yet', 'ai.emptyOwner': 'Record each time AI helps with the thesis, for the AI disclosure form.',
    'ai.emptySup': 'AI use entries will appear here.', 'ai.one': 'AI entry', 'ai.new': 'New AI entry', 'ai.edit': 'Edit AI entry', 'ai.add': 'Add entry',
    'ai.toolPh': 'e.g. Claude', 'ai.purposePh': 'e.g. Critique the logic of the research questions', 'ai.partPh': 'e.g. Chapter I',

    'todo.all': 'All', 'todo.open': 'Open', 'todo.done': 'Done', 'todo.empty': 'No tasks yet',
    'todo.emptyText': 'Add tasks in the Tasks tab of the Google Sheet, then reload this page.', 'todo.task': 'Tasks',
    'todo.markDone': 'Mark done: {title}', 'todo.hasNote': 'Has note', 'todo.noneForFilter': 'No tasks match this filter.', 'todo.noteTitle': 'Task note',

    'read.empty': 'No readings yet', 'read.emptyText': 'Import the reading list into the Readings tab of the Google Sheet, then reload this page.',
    'read.doneOf': '{n} of {total} read', 'read.other': 'Other', 'read.markDone': 'Mark as read: {title}',
    'read.one': 'Reading', 'read.title': 'Title', 'read.source': 'Source', 'read.isRead': 'Read', 'read.notRead': 'Not read yet',
    'read.verifyLabel': 'Reference check status',

    'tl.empty': 'The timeline is empty', 'tl.emptyText': 'Add monthly plans in the Timeline tab of the Google Sheet (month column as YYYY-MM).',
    'tl.sub': 'Monthly plan toward the defense.', 'tl.thisMonth': '(this month)',

    'req.sempro': 'Proposal seminar', 'req.semhas': 'Results seminar', 'req.sidang': 'Thesis defense', 'req.groupTitle': '{stage} ({n} of {total})',
    'req.hintSempro': '{n} of {min} proposal seminars attended so far.', 'req.hintTotal': '{n} of {min} seminars attended so far.',
    'req.hintBimbingan': '{n} of {min} supervision sessions so far.', 'req.evidence': 'Evidence: {text}', 'req.markDone': 'Mark as met: {text}',
    'req.sub': 'Administrative requirements from the Tazkia Thesis Guide 2025. Items are listed as written in the guide.', 'req.empty': 'No requirements yet',
    'req.emptyText': 'Run seedStructure() in the Apps Script editor to fill in requirements from the thesis guide.', 'req.one': 'Requirement',
    'req.evidenceLabel': 'Evidence or note (e.g. upload date on SMILE)',
    'att.group': 'Seminar and defense attendance ({n})', 'att.sempro': 'Proposal seminar', 'att.sidang': 'Defense', 'att.deleteLabel': 'Delete attendance {title}',
    'att.empty': 'No attendance recorded yet.', 'att.foot': 'Proposal seminars attended: {sp} of {spMin} (proposal requirement). Total: {tot} of {totMin} (results seminar requirement).',
    'att.add': 'Add attendance', 'att.new': 'New attendance', 'att.deleteTitle': 'Delete attendance?', 'att.deleteText': '{title}, {date}. This entry will be removed from the Sheet.',

    'prompt.empty': 'No prompts yet', 'prompt.emptyText': 'Add prompts in the Prompts tab of the Google Sheet. Favor prompts for critique and tutoring, not for writing finished text.',
    'prompt.sub': 'Prompts for critique and learning, within the Tazkia 15% AI limit.',

    'access.addBtn': 'Supervisor', 'access.sub': 'Only accounts on this list can sign in.', 'access.lastLogin': 'Last signed in {date}',
    'access.neverLogin': 'Never signed in', 'access.resetPin': 'Reset PIN', 'access.active': 'Active', 'access.activeLabel': '{name} account active',
    'access.foot': 'Deactivating an account signs it out of every device right away. Share a supervisor’s first PIN privately; they can change it on the Account page.',
    'access.addTitle': 'Add supervisor', 'access.initialPin': 'First PIN (6–12 digits)', 'access.newPin': 'New PIN (6–12 digits)',
    'access.addFoot': 'Share the first PIN privately. The supervisor can change it on the Account page.',
    'access.resetFoot': 'This account will be signed out of every device.', 'access.activated': 'Account activated.',
    'access.deactivated': 'Account deactivated and signed out of every device.',

    'account.role': 'Role', 'account.changePin': 'Change PIN', 'account.oldPin': 'Current PIN',
    'account.newPinRule': 'New PIN (6–12 digits, no sequences or repeated digits)', 'account.newPin2': 'Re-enter new PIN',
    'account.pinAgain': 'Re-enter PIN', 'account.pinChanged': 'PIN changed', 'account.logout': 'Sign out',

    'pwa.group': 'App', 'pwa.installed': 'Installed on this device', 'pwa.installText': 'Install the tracker on this device so it opens like an app.',
    'pwa.install': 'Install app', 'pwa.iosText': 'Tap the Share button in Safari, then choose “Add to Home Screen”.',
    'pwa.iosFoot': 'After installing, sign in once more and turn on “Remember this device” so you are not asked for your PIN every time.',
    'pwa.otherText': 'Open in Chrome or Edge to install, or use the browser’s “Install” or “Add to Dock” menu.',

    'offline.pill': 'Offline. Showing data from {time}', 'offline.title': 'You are offline',
    'offline.text': 'Can’t reach the server. Check your connection, then try again.',
    'offline.accessText': 'Access settings are only available while connected to the internet.',
    'load.title': 'Data could not be loaded',

    'sync.running': 'Syncing…', 'sync.sending': 'Sending changes to the server', 'sync.progressMany': '{done} of {total} changes done',
    'sync.done': 'Synced', 'sync.saved': 'Changes saved', 'sync.savedMany': '{n} changes saved', 'sync.failed': 'Sync failed',

    'copy.bimbingan': 'Supervision summary copied.', 'copy.ai': 'AI disclosure summary copied.', 'copy.prompt': 'Prompt copied.', 'copy.failed': 'Couldn’t copy. Try again.',
    'sum.bimbinganTitle': 'Thesis supervision log ({n} sessions)', 'sum.aiTitle': 'Record of AI use in preparing the thesis ({n} entries)',

    'field.id': 'id', 'field.status': 'Status', 'field.note': 'Note', 'field.verifyStatus': 'Check status', 'field.targetDate': 'Target date',
    'field.stage': 'Stage', 'field.dueDate': 'Due date', 'field.words': 'Word count', 'field.feedbackText': 'Feedback', 'field.chapter': 'Chapter',
    'field.from': 'From', 'field.receivedAt': 'Date received', 'field.nextStep': 'My next step', 'field.bimbingan': 'Supervision session', 'field.date': 'Date',
    'field.supervisor': 'Supervisor', 'field.mode': 'Format', 'field.topic': 'Topic', 'field.input': 'Input', 'field.inputLong': 'Supervisor’s input',
    'field.followUp': 'Follow-up', 'field.tool': 'AI tool', 'field.purpose': 'Purpose', 'field.thesisPart': 'Thesis part', 'field.helpType': 'Type of help',
    'field.evidence': 'Evidence', 'field.attendanceType': 'Type', 'field.attendanceTitle': 'Title or presenter', 'field.email': 'Email', 'field.name': 'Name',
    'field.active': 'Active status',
    'field.desc': 'Description', 'field.link': 'Document link',
    'link.open': 'Open in {src}', 'link.none': 'None yet', 'link.placeholder': 'https://docs.google.com/…',
    'link.hint': 'Paste the document address (Google Docs, Drive, Dropbox, OneDrive, Overleaf). It must start with https://. Make sure supervisors have access in that service.',
    'ch.editDetails': 'Edit chapter details', 'ch.descPh': 'e.g. Chapter I focus: background on Islamic monetary transmission', 'sec.descPh': 'e.g. Add 2025 data and tidy up table 1.1',
    'err.urlFormat': '{field} must be an address starting with https://',

    'err.network': 'Can’t reach the server. Check your connection, then try again.', 'err.server': 'Something went wrong on the server. Try again.',
    'err.generic': 'Something went wrong. Try again.', 'err.saveFailed': 'Couldn’t save. Try again.',
    'err.offline': 'You are offline. Changes can be made once you reconnect.', 'err.session': 'Your session has ended. Please sign in again.',
    'err.login': 'Email or PIN is incorrect.', 'err.locked': 'Too many attempts. Try again in 15 minutes.', 'err.oldPin': 'Current PIN is incorrect.',
    'err.forbidden': 'You don’t have access to do this.', 'err.ownFeedback': 'You can only edit feedback you wrote.',
    'err.badRequest': 'Invalid request.', 'err.unknownAction': 'Unknown action.', 'err.notFound': 'Item not found. Reload the page.',
    'err.accountNotFound': 'Account not found.', 'err.required': '{field} is required.', 'err.tooLong': '{field} can be at most {max} characters.',
    'err.dateFormat': '{field} must be a valid date.', 'err.invalid': '{field} is not valid.',
    'err.bimbinganRequired': 'Date, supervisor, format, and topic are required.', 'err.ailogRequired': 'Date, tool, purpose, and type of help are required.',
    'err.emailFormat': 'Email format is not valid.', 'err.emailExists': 'This email is already registered.', 'err.selfDeactivate': 'You can’t deactivate your own account.',
    'err.ownerPinElsewhere': 'The owner’s PIN is changed on the Account page or from the Sheet menu.',
    'err.pinLength': 'PIN must be 6 to 12 digits.', 'err.pinRepeat': 'PIN can’t be the same digit repeated.',
    'err.pinSequence': 'PIN can’t be a sequence of digits.', 'err.pinMismatch': 'PINs don’t match.'
  }
};

let LANG = 'id';
const LOCALE = () => (LANG === 'id' ? 'id-ID' : 'en-GB');
const hasT = (key) => Object.prototype.hasOwnProperty.call(STR[LANG], key) || Object.prototype.hasOwnProperty.call(STR.id, key);

/** Mengambil teks dalam bahasa aktif dan menyisipkan nilai {nama}. */
function t(key, vals) {
  let s = Object.prototype.hasOwnProperty.call(STR[LANG], key) ? STR[LANG][key]
    : (Object.prototype.hasOwnProperty.call(STR.id, key) ? STR.id[key] : key);
  if (vals) s = s.replace(/\{(\w+)\}/g, (m, k) => (vals[k] !== undefined && vals[k] !== null ? String(vals[k]) : m));
  return s;
}

/** Bahasa awal (K11): pilihan tersimpan, atau bahasa perangkat (Indonesia → id, lainnya → en). */
function detectLang() {
  try { const saved = localStorage.getItem('tt_lang'); if (saved === 'id' || saved === 'en') return saved; } catch (e) { /* abaikan */ }
  const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'id']);
  return /^(id|in)\b/i.test(String(langs[0])) ? 'id' : 'en';
}

/** Mengganti bahasa. persist = true hanya saat pengguna memilih sendiri. */
function setLang(l, persist) {
  LANG = l === 'en' ? 'en' : 'id';
  if (persist) { try { localStorage.setItem('tt_lang', LANG); } catch (e) { /* abaikan */ } }
  document.documentElement.lang = LANG;
}
