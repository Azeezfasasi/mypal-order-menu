import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import type { FieldValues } from "react-hook-form";

import type { ControllerRenderProps } from "react-hook-form";

interface ImageUploadProps<T extends FieldValues> {
  field: ControllerRenderProps<T, import("react-hook-form").Path<T>>;
  preview: string | null;
  setPreview: (val: string | null) => void;
  hasNewImage: boolean;
  setHasNewImage: (val: boolean) => void;
}

const ImageUpload = <T extends FieldValues>({
  field,
  preview,
  setPreview,
  hasNewImage,
  setHasNewImage,
}: ImageUploadProps<T>) => {
  const dropzoneOnChangeRef = useRef<typeof field.onChange | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && dropzoneOnChangeRef.current) {
        dropzoneOnChangeRef.current(file);
        setHasNewImage(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [setPreview, setHasNewImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    maxFiles: 1,
  });

  dropzoneOnChangeRef.current = field.onChange;

  const removeImage = () => {
    setPreview(null);
    setHasNewImage(false);
    field.onChange(undefined);
  };

  return (
    <div>
      {!preview ? (
        <div
          {...getRootProps()}
          className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Drag & drop an image, or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
        </div>
      ) : (
        <div className="mt-2 relative">
          <Image
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
            width={300}
            height={300}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
          {!hasNewImage && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs">
                Current Image
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
