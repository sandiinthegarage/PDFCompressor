# PDF Compressor

Alat kompresi PDF berbasis browser. Tanpa upload ke server, semua diproses di perangkat Anda.

## Fitur

- Drag & drop atau pilih file PDF
- Multiple files support
- Preset kompresi: Lossless, High Quality, Balanced, Low Quality, Extreme, Extreme B/W
- Pengaturan manual: DPI, Kualitas JPEG, Mode warna, Threshold (B/W)
- Auto-fit ke target ukuran
- Hasil per file dengan preview
- Download per file atau ZIP semua
- Progress bar real-time

## Cara Menggunakan

### Lokal

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

Buka `index.html` di browser.

### Deploy ke GitHub Pages

1. Build project:
   ```bash
   npm run build
   ```

2. Push ke repository GitHub

3. Settings → Pages → branch: `main` → folder: `/dist`

## Teknis

- **Library**: pdf.js, pdf-lib, JSZip (semua lokal)
- **Canvas limit**: 16 juta piksel untuk HP
- **Worker**: OffscreenCanvas untuk performa

## Ketersediaan

- Browser modern (Chrome, Firefox, Safari, Edge)
- Works offline setelah dibuka sekali

## Contoh Penggunaan

1. Seret file PDF ke area drop
2. Pilih preset atau atur manual
3. Klik "Kompres PDF"
4. Download hasilnya

## Catatan

- Lossless hanya optimasi struktur PDF, tidak di-render ulang
- Scan perlu mode re-render (High Quality - Extreme)
- Target ideal: 50 MB → < 2 MB dengan preset Extreme
