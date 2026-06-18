// components/ui/menu/UploadProgressIndicator.tsx
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

export interface UploadProgressIndicatorProps {
  progress: number;
  onCancel: () => void;
}

export function UploadProgressIndicator({
  progress,
  onCancel,
}: UploadProgressIndicatorProps) {
  return (
    <div className="mb-6 bg-green-50 p-4 rounded-md relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-purple-200 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
            PNG
          </span>
          <span>Uploading meal menu</span>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-xs mt-1 text-gray-500">{progress}% Completed</div>
    </div>
  );
}
