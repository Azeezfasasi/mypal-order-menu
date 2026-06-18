"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UploadProgressModalProps {
  open: boolean;
  progress: number;
  fileName?: string;
  message?: string;
}

export function UploadProgressModal({
  open,
  progress,
  fileName = "Uploading file",
  message = "Please wait while your file is being uploaded...",
}: UploadProgressModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="w-full max-w-sm border-0 bg-gradient-to-b from-blue-50 to-purple-50 shadow-lg">
        <div className="flex flex-col items-center justify-center py-12 px-6">
          {/* Sparkle Icon */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-white rounded-full shadow-md flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60" />
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-blue-300 rounded-full opacity-50" />
            <div className="absolute -bottom-2 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60" />
          </div>

          {/* Main message */}
          <p className="text-center text-gray-700 font-medium mb-2">
            {fileName}
          </p>

          {/* Animated dots */}
          <div className="flex items-center gap-1 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
          </div>

          {/* Secondary message */}
          <p className="text-center text-gray-600 text-sm mb-6">
            {message}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Progress percentage */}
          <p className="text-xs text-gray-500 mt-3">
            {Math.round(progress)}%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
