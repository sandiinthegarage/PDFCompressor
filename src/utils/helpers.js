// Format ukuran file ke format yang mudah dibaca
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format angka dengan pemisah ribuan
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Debounce function untuk slider input
export function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Konversi poin PDF ke pixel berdasarkan DPI
export function pointsToPixels(points, dpi = 150) {
  return (points * dpi) / 72;
}

// Konversi pixel ke poin PDF
export function pixelsToPoints(pixels, dpi = 150) {
  return (pixels * 72) / dpi;
}

// Hitung ukuran canvas dan scale jika terlalu besar
export function calculateCanvasSize(widthPoints, heightPoints, dpi, maxSize = Infinity) {
  const widthPx = pointsToPixels(widthPoints, dpi);
  const heightPx = pointsToPixels(heightPoints, dpi);
  
  // Cek jika melebihi batas aman
  const pixelCount = widthPx * heightPx;
  const maxPixels = 16_777_216; // 16 juta piksel
  
  let scale = 1;
  
  if (pixelCount > maxPixels) {
    scale = Math.sqrt(maxPixels / pixelCount);
  }
  
  // Cek jika melebihi max size
  const maxSide = Math.max(widthPx, heightPx);
  if (maxSide > maxSize) {
    scale = Math.min(scale, maxSize / maxSide);
  }
  
  return {
    width: Math.floor(widthPx * scale),
    height: Math.floor(heightPx * scale),
    scale
  };
}

// Dapatkan konfigurasi preset
export const PRESETS = {
  lossless: {
    name: 'Lossless',
    dpi: null,
    quality: null,
    colorMode: 'original',
    threshold: null,
    desc: 'Optimasi struktur PDF saja. Tidak di-render ulang.'
  },
  high: {
    name: 'High Quality',
    dpi: 200,
    quality: 85,
    colorMode: 'color',
    threshold: null,
    desc: 'Hasil tajam, ukuran masih besar.'
  },
  balanced: {
    name: 'Balanced',
    dpi: 150,
    quality: 70,
    colorMode: 'grayscale',
    threshold: null,
    desc: 'Keseimbangan ukuran dan keterbacaan.'
  },
  low: {
    name: 'Low Quality',
    dpi: 110,
    quality: 50,
    colorMode: 'grayscale',
    threshold: null,
    desc: 'Ukuran kecil, teks masih terbaca.'
  },
  extreme: {
    name: 'Extreme',
    dpi: 85,
    quality: 35,
    colorMode: 'grayscale',
    threshold: null,
    desc: 'Target di bawah 2 MB untuk scan tebal.'
  },
  'extreme-bw': {
    name: 'Extreme B/W',
    dpi: 100,
    quality: null,
    colorMode: 'bw',
    threshold: 160,
    desc: 'Paling kecil, cocok tulisan/ketikan.'
  }
};

// Dapatkan preset default dari localStorage atau gunakan balanced
export function getDefaultPreset() {
  try {
    const saved = localStorage.getItem('pdfCompressor_preset');
    if (saved && PRESETS[saved]) return saved;
  } catch (e) {}
  return 'balanced';
}

// Simpan pengaturan ke localStorage
export function saveSettings(settings) {
  try {
    localStorage.setItem('pdfCompressor_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Gagal menyimpan pengaturan:', e);
  }
}

// Baca pengaturan dari localStorage
export function loadSettings() {
  try {
    const saved = localStorage.getItem('pdfCompressor_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

// Validasi file PDF
export function isValidPDF(file) {
  if (!file.type && file.name.endsWith('.pdf')) return true;
  return file.type === 'application/pdf';
}

// Cek apakah PDF terproteksi (cek headernya)
export async function checkPDFProtection(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const header = new TextDecoder().decode(arrayBuffer.slice(0, 10));
    if (!header.startsWith('%PDF-')) return false;
    
    // Cek apakah ada tanda password (dicoding)
    const content = new TextDecoder().decode(arrayBuffer);
    if (content.includes('/Encrypt') || content.includes('/Standard')) {
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Gagal memeriksa proteksi PDF:', e);
    return false;
  }
}
