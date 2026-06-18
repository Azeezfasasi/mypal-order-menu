import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileText, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface FileUploaderProps {
  filePreview: string | string[] | null;
  onFileChange: (files: File[] | null) => void; // Always return an array, even for single files
  onFilePreviewChange: (previews: string[] | null) => void;
  inputId: string;
  disabled?: boolean;
  fileType?: string | null; // 'image' or 'pdf' or 'video'
  maxSizeMB?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export function FileUploader({
  filePreview,
  onFileChange,
  onFilePreviewChange,
  inputId,
  disabled = false,
  // fileType,
  maxSizeMB = 2,
  acceptedTypes = ["image/*", ".pdf"],
  label = "Menu file",
  description = "Click to upload or drag and drop file(s) here",
  multiple = false,
  maxFiles,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>(
    Array.isArray(filePreview) ? filePreview : filePreview ? [filePreview] : [],
  );

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum file size is ${maxSizeMB}MB.`;
    }

    // Check file type
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isPDF && !isImage && !isVideo) {
      return "Only image, video files and PDFs are allowed.";
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === "application/pdf") {
        resolve("pdf");
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        // For videos, return an object URL (blob:) for efficient previewing
        try {
          const url = URL.createObjectURL(file);
          resolve(url);
        } catch {
          reject(new Error("Failed to create video preview"));
        }
      } else {
        reject(new Error("Unsupported file type"));
      }
    });
  };

  const processFiles = async (files: File[]) => {
    // Enforce maxFiles when provided (only meaningful in multiple mode)
    if (multiple && typeof maxFiles === "number") {
      const allowed = Math.max(0, maxFiles - previews.length);
      if (allowed === 0) {
        const msg = `Maximum ${maxFiles} files allowed.`;
        toast.error(msg);
        setError(msg);
        onFileChange(null);
        onFilePreviewChange(null);
        return;
      }
      if (files.length > allowed) {
        toast.error(
          `Maximum ${maxFiles} files allowed — only the first ${allowed} will be used.`,
        );
        files = files.slice(0, allowed);
      }
    }

    // Validate each file
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onFileChange(null);
        onFilePreviewChange(null);
        return;
      }
    }

    setError(null);

    try {
      // Create previews for all files
      const newPreviews = await Promise.all(files.map(createFilePreview));

      if (multiple) {
        // In multiple mode, append new previews to existing ones
        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);
        onFilePreviewChange(updatedPreviews);
        onFileChange(files);
      } else {
        // In single mode, replace existing preview with a single-item array
        setPreviews([newPreviews[0]]);
        onFilePreviewChange([newPreviews[0]]);
        onFileChange([files[0]]); // Always return an array
      }
    } catch (err) {
      setError((err as Error).message);
      onFileChange(null);
      onFilePreviewChange(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    processFiles(multiple ? files : [files[0]]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    processFiles(multiple ? files : [files[0]]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearFile = (index?: number) => {
    if (disabled) return;

    if (typeof index === "number" && multiple) {
      // Remove specific file in multiple mode
      const removed = previews[index];
      if (removed && removed.startsWith("blob:")) URL.revokeObjectURL(removed);
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      onFilePreviewChange(newPreviews.length > 0 ? newPreviews : null);
      // Note: We don't have access to the original File objects here,
      // so we'll need to handle this in the parent component
      onFileChange(null);
    } else {
      // Clear all files
      // Revoke any blob URLs we created
      previews.forEach((p) => {
        if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
      });
      onFileChange(null);
      onFilePreviewChange(null);
      setPreviews([]);
      setError(null);
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  useEffect(() => {
    return () => {
      // revoke any blob URLs when component unmounts
      previews.forEach((p) => {
        if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
      });
    };
    // We intentionally do not add previews to dependency array to only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getWrapperClasses = () => {
    let classes =
      "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors duration-200";

    if (disabled) {
      classes += " border-gray-300 opacity-50 pointer-events-none";
    } else if (isDragOver) {
      classes += " border-blue-400 bg-blue-50";
    } else if (error) {
      classes += " border-red-300 bg-red-50";
    } else {
      classes += " border-gray-300 hover:border-gray-400";
    }

    return classes;
  };

  const getLabelClasses = () => {
    let classes =
      "mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md transition-colors duration-200";

    if (disabled) {
      classes += " opacity-50 cursor-not-allowed";
    } else {
      classes +=
        " cursor-pointer hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
    }

    return classes;
  };

  // Add support for multiple files
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (input) {
    input.multiple = multiple;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </Label>

      {/* Drop zone area */}
      <div
        className={getWrapperClasses()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={`h-10 w-10 ${error ? "text-red-400" : "text-gray-400"}`}
          />
          <p
            className={`mt-2 text-sm ${
              error ? "text-red-600" : "text-gray-500"
            }`}
          >
            {error || description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Maximum file size: {maxSizeMB}MB
          </p>
          <Label
            htmlFor={inputId}
            className={getLabelClasses()}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                document.getElementById(inputId)?.click();
              }
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select File{multiple ? "s" : ""}
          </Label>
        </div>
      </div>

      {/* Preview section below drop zone */}
      {previews.length > 0 && (
        <div className="mt-4">
          {!multiple ? (
            // Single file mode
            <div className="w-full flex flex-col items-center">
              {previews[0] === "pdf" ? (
                // PDF preview placeholder
                <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-md w-full max-w-xs">
                  <FileText size={64} className="text-primary mb-2" />
                  <p className="text-center text-sm font-medium">
                    PDF Document
                  </p>
                </div>
              ) : previews[0] && previews[0].startsWith("blob:") ? (
                // Video preview (object URL)
                <div className="relative w-full max-w-xs aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <video
                    src={previews[0]}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                // Single image preview
                <div className="relative w-full max-w-xs aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={previews[0]}
                    alt="Preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 384px) 100vw, 384px"
                  />
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={() => clearFile()}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            // Multiple files mode - Grid layout
            <div className="flex gap-4 flex-wrap">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  {preview === "pdf" ? (
                    // PDF preview in grid
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-md aspect-square">
                      <FileText size={40} className="text-primary mb-2" />
                      <span className="text-sm text-center">
                        PDF {index + 1}
                      </span>
                    </div>
                  ) : preview && preview.startsWith("blob:") ? (
                    // Video preview in grid
                    <div className="relative aspect-square size-20 bg-gray-100 rounded-md overflow-hidden">
                      <video
                        src={preview}
                        controls
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                    </div>
                  ) : (
                    // Image preview in grid with hover effect
                    <div className="relative aspect-square size-20 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => clearFile(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Input
        id={inputId}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedTypes.join(",")}
        multiple={multiple}
        disabled={disabled}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />

      {error && (
        <div id={`${inputId}-error`} className="sr-only">
          {error}
        </div>
      )}
    </div>
  );
}
