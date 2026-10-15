# PRD: PDF Compressor (Browser-Based)

## 1. Latar Belakang
File scan laporan praktikum (laprak) biasanya 50 MB+, sedangkan LMS hanya menerima maksimal 2 MB. Kompresor PDF biasa hanya bisa mengecilkan sedikit. Dibutuhkan alat yang bisa dikompres ekstrem, mudah dipakai (drag and drop, tanpa terminal), dan bisa diatur manual.

## 2. Tujuan
- Mengecilkan PDF scan dari 50 MB+ menjadi di bawah 2 MB dengan teks tetap terbaca.
- Bisa dipakai dari HP maupun laptop, tanpa instalasi.
- Pengguna punya kontrol penuh (DPI, kualitas, mode warna) atau cukup pilih preset.

## 3. Non-Goals
- Tidak ada backend, akun, atau upload ke server.
- Tidak ada OCR, edit teks, atau edit halaman (v1).
- Tidak mempertahankan teks yang bisa diseleksi pada mode re-render (scan memang berupa gambar).

## 4. Pengguna
Mahasiswa teknik yang mengumpulkan laprak hasil scan/foto ke LMS dengan batas ukuran ketat. Sering memakai HP.

## 5. Fitur

### 5.1 Input
- Drag and drop area besar + tombol "Pilih File" (wajib untuk HP).
- Mendukung banyak file PDF sekaligus (antrean).
- Validasi: hanya PDF; tampilkan error jelas jika file rusak atau terproteksi password.

### 5.2 Preset
| Preset | DPI | Kualitas JPEG | Mode Warna | Keterangan |
|---|---|---|---|---|
| Lossless | - | - | Asli | Tidak di-render ulang. Hanya optimasi struktur PDF (hapus metadata, object streams). Hasil bisa hampir sama ukurannya. |
| High Quality | 200 | 85 | Warna | Hasil tajam, ukuran masih besar. |
| Balanced | 150 | 70 | Grayscale | Keseimbangan ukuran dan keterbacaan. |
| Low Quality | 110 | 50 | Grayscale | Ukuran kecil, teks masih terbaca. |
| Extreme | 85 | 35 | Grayscale | Target di bawah 2 MB untuk scan tebal. |
| Extreme B/W | 100 | - | Hitam-putih (threshold) | Paling kecil, cocok tulisan/ketikan. |
| Custom | bebas | bebas | bebas | Otomatis aktif saat pengguna mengubah slider manual. |

Memilih preset mengisi nilai slider; mengubah slider memindahkan preset ke Custom.

### 5.3 Pengaturan Manual
- **DPI:** slider 50-300 (step 5) + input angka.
- **Kualitas JPEG:** slider 1-100 + input angka.
- **Mode warna:** Warna / Grayscale / Hitam-putih (dengan slider threshold 0-255, default 160).
- **Maks. sisi gambar (opsional):** batasi piksel terpanjang per halaman.
- **Target ukuran (opsional):** toggle "Auto-fit ke target", default 1,8 MB.

### 5.4 Auto-Fit ke Target
Jika diaktifkan dan hasil melebihi target:
1. Turunkan kualitas bertahap (mis. -8 per iterasi) sampai batas minimum (20).
2. Jika masih besar, turunkan DPI bertahap (mis. -10) sampai batas minimum (60).
3. Jika masih besar, beralih ke grayscale, lalu hitam-putih.
4. Jika semua gagal, tampilkan pesan jelas: "Tidak bisa mencapai target tanpa merusak keterbacaan" beserta hasil terbaik.

Log setiap iterasi di UI (mis. "Percobaan 3: 100 dpi, Q 42 → 2,3 MB").

### 5.5 Proses
1. Baca PDF dengan pdf.js.
2. Render tiap halaman ke canvas sesuai DPI (ukuran halaman PDF dalam poin × DPI / 72).
3. Terapkan mode warna (grayscale/threshold).
4. Encode ke JPEG sesuai kualitas.
5. Susun ulang jadi PDF dengan pdf-lib, ukuran halaman tetap sama dengan aslinya.
6. Hitung ukuran akhir.

Pemrosesan di Web Worker/OffscreenCanvas bila didukung, supaya UI tidak freeze. Halaman diproses satu per satu agar memori HP tidak habis.

### 5.6 Output
- Per file: nama asli, ukuran sebelum, ukuran sesudah, persentase penghematan, badge hijau jika ≤ target dan merah jika tidak.
- Tombol Download per file (nama: `namafile-compressed.pdf`).
- Tombol "Download Semua (ZIP)" untuk banyak file.
- Preview halaman pertama hasil kompresi (thumbnail) untuk cek keterbacaan.
- Jika hasil lebih besar dari file asli, simpan file asli dan beri tahu pengguna.

### 5.7 Progres
Progress bar per file dan per halaman ("Halaman 7/32"), tombol Batal.

## 6. UX / UI
- Satu halaman, mobile-first, tema terang/gelap mengikuti sistem.
- Urutan: area drop → preset (chip) → pengaturan lanjutan (collapsible) → tombol Kompres → daftar hasil.
- Teks antarmuka berbahasa Indonesia.
- Tombol minimal 44px agar nyaman disentuh.
- Pengaturan terakhir tersimpan di localStorage.

## 7. Teknis
- Frontend saja: HTML + JavaScript (boleh Vite/vanilla; tanpa framework berat).
- Library: pdf.js (render), pdf-lib (susun PDF), JSZip (ZIP).
- Library di-bundle/dilokalkan agar bisa dipakai offline setelah dibuka sekali.
- Privasi: semua diproses di perangkat, tidak ada request jaringan untuk data file.
- Hosting statis (GitHub Pages / Netlify).
- Batas aman: batasi canvas maksimum (~16 juta piksel) untuk menghindari crash di HP; turunkan skala otomatis jika terlampaui.

## 8. Kriteria Keberhasilan
- PDF scan 50 MB, 20-30 halaman → ≤ 2 MB dengan preset Extreme, teks masih terbaca.
- Preset dan slider saling sinkron.
- Auto-fit berhasil mencapai target atau memberi pesan jelas.
- Tidak crash untuk file ~100 MB di HP kelas menengah.
- Dapat dipakai penuh dengan drag and drop / tap tanpa terminal.

## 9. Risiko
| Risiko | Mitigasi |
|---|---|
| Memori HP habis pada file besar | Proses per halaman, bebaskan canvas, batasi ukuran canvas |
| Teks tidak terbaca di preset ekstrem | Preview + preset B/W + peringatan di UI |
| Lossless hampir tidak mengecilkan | Jelaskan di UI bahwa scan perlu mode re-render |
| PDF berpassword/rusak | Pesan error jelas, lewati file, lanjutkan antrean |

## 10. Pengembangan Lanjutan (v2)
- Pembersihan scan (auto-contrast, deskew).
- Pilih halaman tertentu atau hapus halaman.
- Gabung beberapa PDF jadi satu sebelum kompres.
- Instalasi sebagai PWA.
