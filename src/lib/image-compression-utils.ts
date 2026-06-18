// image-compression-utils.ts

/**
 * Compresses an image file to reduce its size
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum size in MB (default: 1MB)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @returns Compressed file or original if already small enough
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
): Promise<File> {
  // If file is already small enough, return it
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB <= maxSizeMB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.8 and reduce if needed
        let quality = 0.8;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              const compressedSizeMB = blob.size / 1024 / 1024;

              // If still too large and quality can be reduced, try again
              if (compressedSizeMB > maxSizeMB && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
                return;
              }

              // Create a new File from the blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type,
            quality,
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
}

/**
 * Compresses multiple images
 * @param files - Array of image files to compress
 * @param maxSizeMB - Maximum size per image in MB
 * @param maxWidthOrHeight - Maximum width or height in pixels
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
): Promise<File[]> {
  const compressionPromises = files.map((file) =>
    compressImage(file, maxSizeMB, maxWidthOrHeight),
  );

  return Promise.all(compressionPromises);
}

/**
 * Validates image files before upload
 * @param files - Array of files to validate
 * @param maxSizeMB - Maximum size per file in MB
 * @param allowedTypes - Allowed MIME types
 * @returns Object with valid files and error messages
 */
export function validateImageFiles(
  files: File[],
  maxSizeMB: number = 5,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],
): { validFiles: File[]; errors: string[] } {
  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach((file, index) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File ${index + 1} (${file.name}): Invalid file type. Please upload JPEG, PNG, or WebP images.`,
      );
      return;
    }

    // Check file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      errors.push(
        `File ${index + 1} (${file.name}): File size (${fileSizeMB.toFixed(2)}MB) exceeds ${maxSizeMB}MB limit.`,
      );
      return;
    }

    validFiles.push(file);
  });

  return { validFiles, errors };
}

/**
 * Calculates total size of files in MB
 * @param files - Array of files
 * @returns Total size in MB
 */
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0) / 1024 / 1024;
}
