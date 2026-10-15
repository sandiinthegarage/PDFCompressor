// LocalStorage utility
const STORAGE_KEY = 'pdfCompressor_settings';

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Gagal menyimpan pengaturan:', e);
  }
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

export function clearSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

// Format ukuran file
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format angka Indonesia
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Format duration
export function formatDuration(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)} detik`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins} menit ${secs} detik`;
}
