import JSZip from 'jszip';

// Download utility
export function downloadFile(data, filename) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadZIP(files, zipName = 'kompresi-pdf.zip') {
  const zip = new JSZip();
  
  files.forEach(file => {
    zip.file(file.filename, file.blob, { binary: true });
  });
  
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadFile(blob, zipName);
}

export function downloadAll(files) {
  if (files.length === 1) {
    const file = files[0];
    downloadFile(file.blob, file.filename);
    return Promise.resolve();
  }
  return downloadZIP(files);
}
