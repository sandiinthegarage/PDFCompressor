# Prompt untuk OpenCode

Baca `prd.md` di folder ini. Itu spesifikasi lengkap dan satu-satunya sumber kebenaran.

Bangun web app PDF compressor sesuai PRD tersebut:
- Single-page, jalan penuh di browser (tanpa backend), mobile-first, UI berbahasa Indonesia.
- Stack: HTML + JavaScript (vanilla atau Vite), pdf.js, pdf-lib, JSZip. Semua library di-bundle lokal, bukan CDN.
- Implementasikan semua fitur di PRD: drag and drop, preset, pengaturan DPI/kualitas/mode warna, auto-fit ke target, hasil per file, ZIP, progres, error handling.
- Jangan tambah fitur di luar PRD. Kalau ada yang ambigu, pilih opsi paling sederhana dan catat di README.

Setelah selesai:
1. Buat `README.md` pendek (cara jalan lokal + deploy ke GitHub Pages/Netlify).
2. Jalankan build dan pastikan tidak ada error.
3. Rangkum apa yang dibuat dan hasil pengujian di bagian "Kriteria Keberhasilan" PRD.
