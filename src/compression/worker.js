import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Setup worker PDF.js via Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

self.onmessage = async (e) => {
  try {
    const { type, data } = e.data;
    if (type === 'compress') {
      await compressFiles(data.files, data.settings);
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      error: error.message || String(error)
    });
  }
};

async function compressFiles(files, settings) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    self.postMessage({
      type: 'progress',
      fileIndex: i,
      totalFiles: files.length,
      currentFile: file.name,
      status: 'loading'
    });
    try {
      const result = await compressSinglePDF(file, settings, i, files.length);
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
  self.postMessage({ type: 'complete', results });
}

async function compressSinglePDF(file, settings, fileIndex, totalFiles) {
  const startTime = Date.now();
  try {
    const loadingTask = pdfjsLib.getDocument({ data: file.arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    self.postMessage({
      type: 'fileProgress',
      fileIndex,
      totalFiles,
      currentFile: file.name,
      totalPages: numPages,
      currentPage: 0
    });

    const compressedPages = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const dpi = settings.dpi || 150;
      const scale = dpi / 72;
      let canvasWidth = Math.floor(viewport.width * scale);
      let canvasHeight = Math.floor(viewport.height * scale);
      
      const maxPixels = 16777216;
      if (canvasWidth * canvasHeight > maxPixels) {
        const ratio = Math.sqrt(maxPixels / (canvasWidth * canvasHeight));
        canvasWidth = Math.floor(canvasWidth * ratio);
        canvasHeight = Math.floor(canvasHeight * ratio);
      }

      const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext('2d');
      const renderViewport = page.getViewport({ scale: canvasWidth / viewport.width });
      
      await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      
      const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
      applyColorMode(imageData, settings.colorMode, settings.threshold);
      context.putImageData(imageData, 0, 0);
      
      const quality = (settings.quality || 70) / 100;
      
      // convertToBlob might trigger DOM access, use transferToImageBitmap instead
      const imageBitmap = canvas.transferToImageBitmap();
      
      // Create temp canvas for JPEG conversion
      const tempCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(imageBitmap, 0, 0);
      
      const blob = await tempCanvas.convertToBlob({ type: 'image/jpeg', quality });
      const arrayBuffer = await blob.arrayBuffer();
      
      compressedPages.push({
        imageBytes: new Uint8Array(arrayBuffer),
        width: viewport.width,
        height: viewport.height
      });

      self.postMessage({
        type: 'fileProgress',
        fileIndex,
        totalFiles,
        currentFile: file.name,
        totalPages: numPages,
        currentPage: pageNum
      });
    }

    const newPdfDoc = await PDFDocument.create();
    for (const pageData of compressedPages) {
      const image = await newPdfDoc.embedJpg(pageData.imageBytes);
      const page = newPdfDoc.addPage([pageData.width, pageData.height]);
      page.drawImage(image, { x: 0, y: 0, width: pageData.width, height: pageData.height });
    }

    const pdfBytes = await newPdfDoc.save();
    const compressedSize = pdfBytes.byteLength;
    const originalSize = file.size;
    
    let finalPdfBytes = pdfBytes;
    let warning = null;
    if (compressedSize >= originalSize) {
      warning = 'Hasil lebih besar dari asli, menggunakan file asli';
      finalPdfBytes = new Uint8Array(file.arrayBuffer);
    }

    return {
      filename: file.name,
      originalSize,
      compressedSize: finalPdfBytes.byteLength,
      compressedPdf: finalPdfBytes,
      percentage: ((compressedSize - originalSize) / originalSize) * 100,
      match: settings.autoFit ? (compressedSize <= settings.targetSize * 1024 * 1024) : true,
      warning,
      processingTime: (Date.now() - startTime) / 1000,
      success: true
    };
  } catch (error) {
    console.error('Error compressSinglePDF:', error);
    throw error;
  }
}

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
