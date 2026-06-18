"use client";

import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewDetailsModal } from "@/components/reviews/review-details-modal";
import { ReviewReplyDialog } from "@/components/reviews/review-reply-dialog"; // Import ReviewReplyDialog
import { QRScannerModal } from "@/components/qr-code/qr-scanner-modal";
import { QRScanHistory, type QRScanHistoryRef } from "@/components/qr-code/qr-scan-history";
import { ErrorDisplay } from "@/components/shared/error-display";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  BusinessReviewApi,
  type IBusinessReview,
} from "@/services/api/business-reviews-api"; // Import IBusinessReview
import { ChevronLeft, ChevronRight, MessageSquare, QrCode } from "lucide-react";
import { useCallback, useState, useRef } from "react"; // Import useCallback and useRef

export default function CustomerEngagementPage() {
  const { user: business } = useAuth();
  const businessId = business?.id;
  const qrScanHistoryRef = useRef<QRScanHistoryRef>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9); // 9 reviews per page for 3x3 grid

  // Review details modal state
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Reply modal state
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyType, setReplyType] = useState<"direct" | "general">("direct");
  const [replyMessage, setReplyMessage] = useState("");
  const [currentReviewForReply, setCurrentReviewForReply] =
    useState<IBusinessReview | null>(null); // To store the review being replied to

  // QR Code scanner state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const {
    data: reviewsResponse,
    isLoading,
    error,
    refetch,
  } = BusinessReviewApi.useGetBusinessReviews(businessId as string, {
    page: currentPage,
    limit: pageSize,
  });

  const reviews = reviewsResponse?.data.data || [];
  const totalReviews = reviewsResponse?.data.total || 0;
  const totalPages =
    reviewsResponse?.data.totalPages || Math.ceil(totalReviews / pageSize);

  const { mutate: addCommentMutate, isPending: isAddingComment } =
    BusinessReviewApi.useAddComment();

  const handleViewDetails = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = useCallback(() => {
    console.log("handleCloseDetailsModal called.");
    // debugger; // PAUSE EXECUTION HERE
    setIsDetailsModalOpen(false);
    setSelectedReviewId(null);
  }, []);

  const handleReply = useCallback(
    (review: IBusinessReview, type: "direct" | "general") => {
      setCurrentReviewForReply(review);
      setReplyType(type);
      setIsReplyModalOpen(true);
    },
    []
  );

  const handleReplySubmit = useCallback(async () => {
    if (!replyMessage.trim() || !currentReviewForReply) return;

    addCommentMutate(
      {
        reviewId: currentReviewForReply.id,
        data: {
          text: replyMessage,
          isBusinessReplyPublic: replyType === "general",
        },
      },
      {
        onSuccess: () => {
          setReplyMessage("");
          setReplyType("direct");
          setIsReplyModalOpen(false);
          setCurrentReviewForReply(null); // Clear the current review
          refetch(); // Refetch reviews to show the new comment
        },
        onError: (err) => {
          console.error("Failed to submit reply:", err);
        },
      }
    );
  }, [
    replyMessage,
    replyType,
    currentReviewForReply,
    addCommentMutate,
    refetch,
  ]);

  const handleReplyModalClose = useCallback(() => {
    console.log(
      "handleReplyModalClose called. isAddingComment:",
      isAddingComment
    );
    // debugger; // PAUSE EXECUTION HERE
    if (isAddingComment) return;
    setIsReplyModalOpen(false);
    setReplyMessage("");
    setReplyType("direct");
    setCurrentReviewForReply(null);
  }, [isAddingComment]);

  const handleQRScanClose = useCallback(() => {
    setIsQRScannerOpen(false);
  }, []);

  const handleQRScan = useCallback((data: unknown) => {
    console.log("QR Code scanned:", data);
    // Refetch scan history after successful scan
    if (qrScanHistoryRef.current) {
      qrScanHistoryRef.current.refetch();
    }
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner message="Loading customer Reviews" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Reviews"
        message="Could not fetch customer reviews at this time."
        error={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 p-3">
      <div className="flex lg:flex-col flex-row justify-between items-center lg:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customer Engagement</h1>
          <p className="text-muted-foreground mt-1">
            View feedback and reviews concerning your business.
          </p>
        </div>

        <Button
          onClick={() => setIsQRScannerOpen(true)}
          className="gap-2 h-fit py-2 flex lg:hidden"
          size="lg"
        >
          <QrCode className="h-5 w-5" />
          Scan QR Code
        </Button>
      </div>
      {/* QR Code section */}

      <div className="flex items-center gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 flex md:flex-col justify-between items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="sm:text-3xl text-4xl font-bold text-primary">
              {totalReviews}
            </h2>
            <span className="text-gray-700 dark:text-gray-300">
              Total reviews
            </span>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 grid-cols-4 gap-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                businessId={businessId}
                onReply={handleReply} // Pass the reply handler
                onViewDetails={handleViewDetails} // Pass the view details handler
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalReviews)} of {totalReviews}{" "}
            reviews
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8 border rounded-md">
          No reviews found for your business yet.
        </div>
      )}

      <ReviewDetailsModal
        reviewId={selectedReviewId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {currentReviewForReply && ( // Only render if there's a review to reply to
        <ReviewReplyDialog
          open={isReplyModalOpen}
          onClose={handleReplyModalClose}
          onSubmit={handleReplySubmit}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
          replyType={replyType}
          isAddingComment={isAddingComment}
          userFirstName={currentReviewForReply.user.firstname}
        />
      )}

      {/* QR Code Scan History Section */}
      <section className="mt-12 pt-8 border-t">
        <QRScanHistory ref={qrScanHistoryRef} />
      </section>

      <QRScannerModal
        open={isQRScannerOpen}
        onClose={handleQRScanClose}
        onScan={handleQRScan}
      />
    </div>
  );
}
