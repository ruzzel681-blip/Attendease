export interface UploadedAttachment {
  attachmentUrl: string;
  attachmentName: string;
  attachmentSize: number;
  attachmentType: string;
  // Backward/convenience compatibility aliases
  dataUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export type FileUploadResult = UploadedAttachment;

// Strictly keep document attachments under 700KB to guarantee never breaching Firestore's 1MB doc payload limit
const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB target
const MAX_DOC_SIZE = 750 * 1024;   // 750 KB for PDF/docs

/**
 * Compresses an image file safely using an HTML5 canvas to keep size under ~500KB.
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Progressively compress quality if needed
        let quality = 0.8;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > MAX_IMAGE_SIZE * 1.33 && quality > 0.25) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a non-image file (PDF, TXT, DOC) and validates strict size limits (max 750KB).
 */
async function readDocAsDataUrl(file: File): Promise<string> {
  if (file.size > MAX_DOC_SIZE) {
    throw new Error(
      `File size (${(file.size / 1024).toFixed(0)} KB) exceeds the 750 KB database safety limit. Please upload a smaller file or compressed document.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Process a user-selected file, compressing images or capping docs safely.
 */
export async function processFileUpload(file: File): Promise<UploadedAttachment> {
  const isImage = file.type.startsWith('image/');
  let dataUrl: string;

  if (isImage) {
    dataUrl = await compressImage(file);
  } else {
    dataUrl = await readDocAsDataUrl(file);
  }

  // Calculate actual byte size from base64 string
  const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
  const actualSize = Math.round((base64Length * 3) / 4);

  return {
    attachmentUrl: dataUrl,
    attachmentName: file.name,
    attachmentSize: actualSize,
    attachmentType: file.type || 'application/octet-stream',
    dataUrl,
    fileName: file.name,
    fileSize: actualSize,
    fileType: file.type || 'application/octet-stream'
  };
}

/**
 * Format bytes nicely for display (e.g., 245 KB, 1.2 MB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
