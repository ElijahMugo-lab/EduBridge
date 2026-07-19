// Client-side upload compression: images are downscaled and re-encoded as JPEG
// until they fit the target size, so vetting documents stay small in the database.

export type CompressedFile = {
  fileName: string;
  mime: string;
  dataUrl: string;
  sizeKb: number;
  origKb: number;
};

const kbOf = (dataUrl: string) => (dataUrl.length * 0.75) / 1024;

export async function compressImageFile(file: File, maxDim: number, targetKb: number): Promise<CompressedFile> {
  const origKb = file.size / 1024;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    let quality = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (kbOf(dataUrl) > targetKb && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return { fileName: file.name, mime: 'image/jpeg', dataUrl, sizeKb: kbOf(dataUrl), origKb };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Vetting documents: images get compressed; PDFs are accepted as-is up to 600 KB
// (browsers cannot recompress PDFs), otherwise we ask for a photo instead.
export async function prepareVettingDoc(file: File): Promise<CompressedFile> {
  if (file.type === 'application/pdf') {
    if (file.size > 600 * 1024) {
      throw new Error('That PDF is over 600 KB. Upload a clear photo of the document instead; photos are compressed automatically.');
    }
    const dataUrl = await fileToDataUrl(file);
    return { fileName: file.name, mime: file.type, dataUrl, sizeKb: file.size / 1024, origKb: file.size / 1024 };
  }
  if (file.type.startsWith('image/')) {
    return compressImageFile(file, 1400, 350);
  }
  throw new Error('Upload a PDF or a photo of the document.');
}

export const formatKb = (kb: number) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
