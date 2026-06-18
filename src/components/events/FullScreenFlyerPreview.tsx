import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Download, Share2, X, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";

interface FullScreenFlyerPreviewProps {
  open: boolean;
  onClose: () => void;
  flyerUrl: string;
  altText?: string;
  showRequestApproval?: boolean;
  isModal?: boolean;
}

const FullScreenFlyerPreview: React.FC<FullScreenFlyerPreviewProps> = ({
  open,
  onClose,
  flyerUrl,
  altText,
  showRequestApproval = false,
  isModal = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!open) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // Fetch the image as a blob
      const response = await fetch(flyerUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      const blob = await response.blob();

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "event-flyer.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Flyer downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download flyer. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Event Flyer",
          text: "Check out this event flyer!",
          url: flyerUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(flyerUrl);
        toast.success("Flyer link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // Modal overlay version
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-end items-center rounded-t-2xl z-50">
            {/* <FormLabel className="text-lg font-semibold text-gray-900">
              Event Flyer
            </FormLabel> */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-[7.27px] border border-[#DE5126] hover:border-[#DE5126] focus:ring-2 focus:ring-offset-2 focus:ring-[#DE5126]"
            >
              <X className="h-6 w-6 text-[#DE5126] font-bold" />
            </Button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Flyer image container */}
            <div className="w-full">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={flyerUrl}
                  alt={altText || "Flyer Preview"}
                  className="w-full h-full object-cover"
                  fill
                  priority
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-row md:flex-col gap-3">
              <Button
                type="button"
                className="flex-1 bg-[#EB5017] hover:bg-orange-700 text-white leading-[145%] text-[14.53px] font-semibold rounded-[7.27px] border border-[#DE5126] hover:border-[#DE5126] focus:ring-2 focus:ring-offset-2 focus:ring-[#DE5126] py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
              <Button
                type="button"
                className="flex-1 bg-white hover:bg-gray-100 text-[#344054] leading-[145%] text-[14.53px] font-semibold border border-[#D0D5DD] hover:border-[#D0D5DD] focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 py-6 rounded-[7.27px]"
                onClick={handleShare}
              >
                <Image
                  src="/images/shareevent.svg"
                  alt="share event"
                  className="w-5 h-5"
                  width={16}
                  height={16}
                  priority
                />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original form-integrated version
  return (
    <div className="space-y-6">
      {/* Full preview content */}
      <div className="space-y-6">
        <div>
          <FormLabel className="text-lg font-semibold">Event Flyer</FormLabel>
        </div>

        {/* Flyer image container */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={flyerUrl}
              alt={altText || "Flyer Preview"}
              className="w-full h-full object-contain"
              fill
              priority
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex sm:flex-col gap-3 max-w-2xl mx-auto">
          <Button
            type="button"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-white hover:bg-gray-200 text-[#344054] border border-[#D0D5DD] hover:border-[#D0D5DD] focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          {showRequestApproval && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50"
              onClick={() => {
                toast.success("Approval request sent!");
              }}
            >
              Request Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullScreenFlyerPreview;
