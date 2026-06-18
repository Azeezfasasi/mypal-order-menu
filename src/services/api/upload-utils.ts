// upload-utils.ts
import {
  calculateTotalSize,
  compressImages,
} from "@/lib/image-compression-utils";
import { apiClient } from "@/services/api/api-client";
import { ENDPOINTS } from "@/services/api/endpoints";

/**
 * Uploads accommodation files with compression
 * Since the backend accepts an array of images, we upload all at once
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Array of uploaded image URLs
 */
export async function uploadAccommodationFiles(
  files: File[],
  options?: {
    compressImages?: boolean;
    maxImageSizeMB?: number;
  },
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const { compressImages: shouldCompress = true, maxImageSizeMB = 1 } =
    options || {};

  try {
    // Step 1: Compress images if enabled
    let filesToUpload = files;
    if (shouldCompress) {
      console.log(`Compressing ${files.length} images...`);
      filesToUpload = await compressImages(files, maxImageSizeMB, 1920);

      const originalSize = calculateTotalSize(files);
      const compressedSize = calculateTotalSize(filesToUpload);
      console.log(
        `Compression complete: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB`,
      );
    }

    // Step 2: Upload all files in a single request
    console.log(`Uploading ${filesToUpload.length} files...`);
    const uploadedUrls = await uploadBatch(filesToUpload);
    console.log(`Successfully uploaded ${uploadedUrls.length} files`);

    return uploadedUrls;
  } catch (error) {
    console.error("Error uploading accommodation files:", error);
    throw error;
  }
}

/**
 * Uploads a batch of files in a single request
 * The backend endpoint accepts multiple images at once
 * @param files - Files to upload
 * @returns Array of uploaded URLs
 */
async function uploadBatch(files: File[]): Promise<string[]> {
  const formData = new FormData();

  // Append all files with the same field name 'images'
  // The backend expects: images: array
  files.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const response = await apiClient.post<{ urls: string[] }>(
      ENDPOINTS.ACCOMMODATIONS.UPLOAD_IMAGES,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 120 second timeout for large batches
      },
    );

    // Response structure: { urls: [...] }
    return response.data.urls || [];
  } catch (error: unknown) {
    // Provide more helpful error messages
    const err = error as {
      code?: string;
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };
    if (err.code === "ECONNABORTED") {
      throw new Error(
        "Upload timeout. Please try with fewer or smaller images.",
      );
    }
    if (err.response?.status === 413) {
      throw new Error(
        "Files too large. Please reduce image sizes or upload fewer images at once.",
      );
    }
    if (err.response?.status === 400) {
      throw new Error(
        err.response?.data?.message || "Invalid file format or data.",
      );
    }
    if (err.message === "Network Error") {
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    }
    throw error;
  }
}

/**
 * Upload a single file with retry logic
 * @param file - File to upload
 * @param retries - Number of retries
 * @returns Uploaded file URL
 */
export async function uploadSingleFile(
  file: File,
  retries: number = 2,
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const urls = await uploadBatch([file]);
      return urls[0];
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Retry ${attempt + 1}/${retries} for ${file.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Upload failed after retries");
}
