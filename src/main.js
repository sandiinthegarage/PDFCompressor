import { PRESETS, getDefaultPreset } from './utils/helpers.js';
import { saveSettings, loadSettings, formatSize, formatNumber, formatDuration } from './utils/storage.js';
import { downloadFile, downloadZIP, downloadAll } from './utils/download.js';

let currentSettings = {
  preset: getDefaultPreset(),
  dpi: 150,
  quality: 70,
  colorMode: 'grayscale',
  threshold: 160,
  maxSize: Infinity,
  autoFit: false,
  targetSize: 1.8
};

let fileQueue = [];
let isProcessing = false;
let pdfjsLib = null;
let PDFDocument = null;

// ============ DOM Elements ============
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const fileQueue_el = document.getElementById('fileQueue');
const fileList = document.getElementById('fileList');
const fileCount_el = document.getElementById('fileCount');

const presetChips = document.querySelectorAll('.chip');
const dpiSlider = document.getElementById('dpiSlider');
const dpiInput = document.getElementById('dpiInput');
const dpiValue = document.getElementById('dpiValue');
const qualitySlider = document.getElementById('qualitySlider');
const qualityInput = document.getElementById('qualityInput');
const qualityValue = document.getElementById('qualityValue');
const colorModeSelect = document.getElementById('colorMode');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdInput = document.getElementById('thresholdInput');
const thresholdValue = document.getElementById('thresholdValue');
const bwThresholdGroup = document.getElementById('bwThresholdGroup');
const maxSizeInput = document.getElementById('maxSize');
const autoFitToggle = document.getElementById('autoFitToggle');
const targetSizeInput = document.getElementById('targetSize');

const compressBtn = document.getElementById('compressBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cancelBtn = document.getElementById('cancelBtn');

const resultsContainer = document.getElementById('resultsContainer');
const resultsList = document.getElementById('resultsList');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// ============ Load PDF Libraries ============
async function loadLibraries() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    const pdfLib = await import('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
    
    // Gunakan worker bawaan paket
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  }
}

// ============ Load Settings ============
function loadSavedSettings() {
  const saved = loadSettings();
  if (saved) {
    currentSettings = { ...currentSettings, ...saved };
    updateUIFromSettings();
  }
}

function updateUIFromSettings() {
  dpiSlider.value = currentSettings.dpi;
  dpiInput.value = currentSettings.dpi;
  dpiValue.textContent = currentSettings.dpi;
  
  qualitySlider.value = currentSettings.quality;
  qualityInput.value = currentSettings.quality;
  qualityValue.textContent = currentSettings.quality;
  
  colorModeSelect.value = currentSettings.colorMode;
  updateThresholdVisibility();
  
  thresholdSlider.value = currentSettings.threshold;
  thresholdInput.value = currentSettings.threshold;
  thresholdValue.textContent = currentSettings.threshold;
  
  if (currentSettings.maxSize !== Infinity) {
    maxSizeInput.value = currentSettings.maxSize;
  }
  
  autoFitToggle.checked = currentSettings.autoFit;
  targetSizeInput.value = currentSettings.targetSize;
  
  updatePresetUI();
}

// ============ Preset Management ============
function setPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;
  
  currentSettings.preset = presetKey;
  
  if (preset.dpi !== null) {
    currentSettings.dpi = preset.dpi;
    dpiSlider.value = preset.dpi;
    dpiInput.value = preset.dpi;
    dpiValue.textContent = preset.dpi;
  }
  
  if (preset.quality !== null) {
    currentSettings.quality = preset.quality;
    qualitySlider.value = preset.quality;
    qualityInput.value = preset.quality;
    qualityValue.textContent = preset.quality;
  }
  
  currentSettings.colorMode = preset.colorMode;
  colorModeSelect.value = preset.colorMode;
  updateThresholdVisibility();
  
  if (preset.threshold !== null) {
    currentSettings.threshold = preset.threshold;
    thresholdSlider.value = preset.threshold;
    thresholdInput.value = preset.threshold;
    thresholdValue.textContent = preset.threshold;
  }
  
  updatePresetUI();
  saveSettings(currentSettings);
}

function updatePresetUI() {
  presetChips.forEach(chip => {
    const presetKey = chip.dataset.preset;
    if (presetKey === currentSettings.preset) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function switchToCustom() {
  currentSettings.preset = 'custom';
  updatePresetUI();
}

// ============ Settings Event Listeners ============
presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    setPreset(chip.dataset.preset);
  });
});

dpiSlider.addEventListener('input', (e) => {
  currentSettings.dpi = parseInt(e.target.value);
  dpiValue.textContent = currentSettings.dpi;
  dpiInput.value = currentSettings.dpi;
  switchToCustom();
  saveSettings(currentSettings);
});

dpiInput.addEventListener('input', (e) => {
  let val = parseInt(e.target.value) || 150;
  val = Math.max(50, Math.min(300, val));
  currentSettings.dpi = val;
  dpiSlider.value = val;
  dpiValue.textContent = val;
  switchToCustom();
  saveSettings(currentSettings);
});

qualitySlider.addEventListener('input', (e) => {
  currentSettings.quality = parseInt(e.target.value);
  qualityValue.textContent = currentSettings.quality;
  qualityInput.value = currentSettings.quality;
  switchToCustom();
  saveSettings(currentSettings);
});

qualityInput.addEventListener('input', (e) => {
  let val = parseInt(e.target.value) || 70;
  val = Math.max(1, Math.min(100, val));
  currentSettings.quality = val;
  qualitySlider.value = val;
  qualityValue.textContent = val;
  switchToCustom();
  saveSettings(currentSettings);
});

colorModeSelect.addEventListener('change', (e) => {
  currentSettings.colorMode = e.target.value;
  updateThresholdVisibility();
  switchToCustom();
  saveSettings(currentSettings);
});

function updateThresholdVisibility() {
  if (currentSettings.colorMode === 'bw') {
    bwThresholdGroup.removeAttribute('hidden');
  } else {
    bwThresholdGroup.setAttribute('hidden', '');
  }
}

thresholdSlider.addEventListener('input', (e) => {
  currentSettings.threshold = parseInt(e.target.value);
  thresholdValue.textContent = currentSettings.threshold;
  thresholdInput.value = currentSettings.threshold;
  switchToCustom();
  saveSettings(currentSettings);
});

thresholdInput.addEventListener('input', (e) => {
  let val = parseInt(e.target.value) || 160;
  val = Math.max(0, Math.min(255, val));
  currentSettings.threshold = val;
  thresholdSlider.value = val;
  thresholdValue.textContent = val;
  switchToCustom();
  saveSettings(currentSettings);
});

maxSizeInput.addEventListener('input', (e) => {
  const val = e.target.value ? parseInt(e.target.value) : Infinity;
  currentSettings.maxSize = isFinite(val) ? val : Infinity;
  saveSettings(currentSettings);
});

autoFitToggle.addEventListener('change', (e) => {
  currentSettings.autoFit = e.target.checked;
  targetSizeInput.removeAttribute('hidden');
  saveSettings(currentSettings);
});

// ============ File Handling ============
selectBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  handleFiles(Array.from(e.target.files));
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer.files));
});

function handleFiles(files) {
  const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
  
  if (pdfFiles.length === 0) {
    alert('Pilih file PDF!');
    return;
  }
  
  fileQueue = pdfFiles;
  updateFileQueueUI();
  compressBtn.removeAttribute('disabled');
}

function updateFileQueueUI() {
  fileQueue_el.removeAttribute('hidden');
  fileCount_el.textContent = fileQueue.length;
  fileList.innerHTML = '';
  
  fileQueue.forEach((file, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${file.name} (${formatSize(file.size)})</span>
      <button class="remove-btn" data-idx="${idx}">✕</button>
    `;
    fileList.appendChild(li);
    
    li.querySelector('.remove-btn').addEventListener('click', () => {
      fileQueue.splice(idx, 1);
      updateFileQueueUI();
      if (fileQueue.length === 0) {
        compressBtn.setAttribute('disabled', '');
        fileQueue_el.setAttribute('hidden', '');
      }
    });
  });
}

// ============ Color Mode Helper ============
function applyColorMode(imageData, mode, threshold = 160) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (mode === 'grayscale' || mode === 'bw') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const val = mode === 'bw' ? (gray >= threshold ? 255 : 0) : gray;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
  }
}

// ============ Compression ============
compressBtn.addEventListener('click', startCompression);
cancelBtn.addEventListener('click', cancelCompression);

async function startCompression() {
  if (fileQueue.length === 0) return;
  if (isProcessing) return;
  
  isProcessing = true;
  compressBtn.setAttribute('disabled', '');
  progressContainer.removeAttribute('hidden');
  resultsContainer.setAttribute('hidden', '');
  resultsList.innerHTML = '';
  downloadAllBtn.setAttribute('hidden', '');
  
  // Load libraries if not yet
  await loadLibraries();
  
  const results = [];
  
  for (let i = 0; i < fileQueue.length; i++) {
    const file = fileQueue[i];
    
    // Update progress UI
    progressText.textContent = `Loading ${file.name} (${i + 1}/${fileQueue.length})`;
    
    try {
      const result = await compressSinglePDF(file, currentSettings);
      results.push(result);
    } catch (error) {
      console.error('Error compressing', file.name, error);
      results.push({
        filename: file.name,
        originalSize: file.size,
        compressedSize: file.size,
        error: error.message,
        success: false
      });
    }
  }
  
  displayResults(results);
  cleanup();
}

async function compressSinglePDF(file, settings) {
  const startTime = Date.now();
  console.log('Starting compression for:', file.name);
  
  // Load PDF
  const loadingTask = pdfjsLib.getDocument({ data: await file.arrayBuffer() });
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  
  console.log('PDF loaded, pages:', numPages);
  
  const compressedPages = [];
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Update page progress
    const percent = Math.round((pageNum / numPages) * 100);
    progressFill.style.width = percent + '%';
    progressText.textContent = `${file.name}: halaman ${pageNum}/${numPages} (${percent}%)`;
    
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    
    const dpi = settings.dpi || 150;
    const scale = dpi / 72;
    let canvasWidth = Math.floor(viewport.width * scale);
    let canvasHeight = Math.floor(viewport.height * scale);
    
    // Limit canvas size (16M pixels)
    const maxPixels = 16777216;
    if (canvasWidth * canvasHeight > maxPixels) {
      const ratio = Math.sqrt(maxPixels / (canvasWidth * canvasHeight));
      canvasWidth = Math.floor(canvasWidth * ratio);
      canvasHeight = Math.floor(canvasHeight * ratio);
    }
    
    // Apply maxSize if set
    if (settings.maxSize && settings.maxSize < Infinity) {
      const maxSide = Math.max(canvasWidth, canvasHeight);
      if (maxSide > settings.maxSize) {
        const sizeRatio = settings.maxSize / maxSide;
        canvasWidth = Math.floor(canvasWidth * sizeRatio);
        canvasHeight = Math.floor(canvasHeight * sizeRatio);
      }
    }
    
    console.log('Canvas size:', canvasWidth, 'x', canvasHeight);
    
    // Create regular canvas (bukan OffscreenCanvas)
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext('2d');
    
    const renderViewport = page.getViewport({ scale: canvasWidth / viewport.width });
    
    await page.render({ canvasContext: context, viewport: renderViewport }).promise;
    
    const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
    applyColorMode(imageData, settings.colorMode, settings.threshold);
    context.putImageData(imageData, 0, 0);
    
    const quality = (settings.quality || 70) / 100;
    
    // Convert to blob via toBlob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    const arrayBuffer = await blob.arrayBuffer();
    
    compressedPages.push({
      imageBytes: new Uint8Array(arrayBuffer),
      width: viewport.width,
      height: viewport.height
    });
    
    console.log('Page', pageNum, 'processed');
  }
  
  // Build new PDF
  const newPdfDoc = await PDFDocument.create();
  
  for (const pageData of compressedPages) {
    const image = await newPdfDoc.embedJpg(pageData.imageBytes);
    const page = newPdfDoc.addPage([pageData.width, pageData.height]);
    page.drawImage(image, { x: 0, y: 0, width: pageData.width, height: pageData.height });
  }
  
  const pdfBytes = await newPdfDoc.save();
  const compressedSize = pdfBytes.byteLength;
  const originalSize = file.size;
  
  console.log('Original:', originalSize, 'Compressed:', compressedSize);
  
  let finalPdfBytes = pdfBytes;
  let warning = null;
  if (compressedSize >= originalSize) {
    warning = 'Hasil lebih besar dari asli, menggunakan file asli';
    finalPdfBytes = new Uint8Array(await file.arrayBuffer());
  }
  
  const savedBytes = originalSize - finalPdfBytes.byteLength;
  const percentage = (savedBytes / originalSize) * 100;
  const match = settings.autoFit ? (finalPdfBytes.byteLength <= settings.targetSize * 1024 * 1024) : true;
  
  return {
    filename: file.name,
    originalSize,
    compressedSize: finalPdfBytes.byteLength,
    compressedPdf: finalPdfBytes,
    savedBytes,
    percentage,
    match,
    warning,
    processingTime: (Date.now() - startTime) / 1000,
    success: true
  };
}

function cancelCompression() {
  cleanup();
}

function cleanup() {
  isProcessing = false;
  compressBtn.removeAttribute('disabled');
}

function displayResults(results) {
  progressContainer.setAttribute('hidden', '');
  resultsContainer.removeAttribute('hidden');
  resultsList.innerHTML = '';
  
  const allFiles = [];
  
  results.forEach((result, idx) => {
    if (!result.success || result.error) {
      const card = createErrorCard(result);
      resultsList.appendChild(card);
      return;
    }
    
    const card = createResultCard(result);
    resultsList.appendChild(card);
    
    allFiles.push({
      filename: result.filename.replace('.pdf', '-compressed.pdf'),
      blob: new Blob([result.compressedPdf], { type: 'application/pdf' })
    });
  });
  
  if (allFiles.length > 0) {
    downloadAllBtn.removeAttribute('hidden');
    downloadAllBtn.onclick = () => downloadZIP(allFiles, 'hasil-kompresi-pdf.zip');
  }
}

function createResultCard(result) {
  const card = document.createElement('div');
  card.className = 'result-card';
  
  const badgeClass = result.match ? 'success' : 'fail';
  const badgeText = result.match ? '✓ Sesuai Target' : '✗ Melebihi Target';
  
  const percentage = Math.round(Math.abs(result.percentage));
  const savedSize = formatSize(result.savedBytes);
  
  card.innerHTML = `
    <div class="result-header">
      <div class="result-name">${result.filename}</div>
      <div class="result-badge ${badgeClass}">${badgeText}</div>
    </div>
    <div class="result-stats">
      <div>
        <div class="stat-label">Sebelum</div>
        <div class="stat-value">${formatSize(result.originalSize)}</div>
      </div>
      <div>
        <div class="stat-label">Sesudah</div>
        <div class="stat-value">${formatSize(result.compressedSize)}</div>
      </div>
      <div>
        <div class="stat-label">Penghematan</div>
        <div class="stat-value">${percentage}% (${savedSize})</div>
      </div>
    </div>
    <button class="btn btn-primary download-btn">Download</button>
  `;
  
  const downloadBtn = card.querySelector('.download-btn');
  downloadBtn.onclick = () => {
    downloadFile(result.compressedPdf, result.filename.replace('.pdf', '-compressed.pdf'));
  };
  
  return card;
}

function createErrorCard(result) {
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-header">
      <div class="result-name">${result.filename}</div>
      <div class="result-badge fail">❌ Error</div>
    </div>
    <p style="color: var(--danger);">${result.warning || result.error}</p>
  `;
  return card;
}

// ============ Initialize ============
document.addEventListener('DOMContentLoaded', () => {
  loadSavedSettings();
  updateThresholdVisibility();
  
  // Pre-load PDF.js worker
  loadLibraries();
});
