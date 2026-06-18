"use client";

import type React from "react";

import { cn } from "@/lib/utils";
import { FileText, Plus, X } from "lucide-react";
import { useState } from "react";

interface FileUploaderProps {
  value: string;
  onValueChange: (file: File | null) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  maxSizeBytes?: number;
}

export function FileUploader({
  value,
  onValueChange,
  placeholder = "Click here to upload a file",
  className,
  accept,
  maxSizeBytes,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(value || "");
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    console.log({ e });

    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const limit = maxSizeBytes ?? 2 * 1024 * 1024;
      if (file.size > limit) {
        setError(
          `File is too large. Maximum size is ${Math.round(limit / 1024 / 1024)}MB.`,
        );
        return;
      }
      setError(null);
      setFileName(file.name);
      onValueChange(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const limit = maxSizeBytes ?? 2 * 1024 * 1024;
      if (file.size > limit) {
        setError(
          `File is too large. Maximum size is ${Math.round(limit / 1024 / 1024)}MB.`,
        );
        return;
      }
      setError(null);
      setFileName(file.name);
      onValueChange(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName("");
    onValueChange(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        id={`file-upload-${placeholder}`}
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
      />

      {!fileName ? (
        <label
          htmlFor={`file-upload-${placeholder}`}
          className={cn(
            "flex h-16 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 transition-colors hover:border-gray-400",
            isDragging && "border-primary bg-primary/5",
            className,
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-2 text-gray-500">
            <Plus className="h-5 w-5" />
            <span>{placeholder}</span>
          </div>
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="max-w-[200px] truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
