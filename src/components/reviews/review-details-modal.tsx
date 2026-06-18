import { ErrorDisplay } from "@/components/shared/error-display";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDistance, getInitials } from "@/lib/utils";
import {
  BusinessReviewApi,
  type IComment,
} from "@/services/api/business-reviews-api";
import { Clock, Loader2, MessageSquare, Star } from "lucide-react";
import { useState } from "react";

interface ReviewDetailsModalProps {
  reviewId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewDetailsModal({
  reviewId,
  isOpen,
  onClose,
}: ReviewDetailsModalProps) {
  const [newComment, setNewComment] = useState("");
  const [isBusinessReply, setIsBusinessReply] = useState(false);

  // Fetch review details
  const {
    data: reviewResponse,
    isLoading: isLoadingReview,
    error: reviewError,
  } = BusinessReviewApi.useGetReviewById(reviewId);

  // Fetch comments
  const {
    data: commentsResponse,
    isLoading: isLoadingComments,
    error: commentsError,
  } = BusinessReviewApi.useGetReviewComments(reviewId || "");

  // Add comment mutation
  const { mutate: addCommentMutate, isPending: isAddingComment } =
    BusinessReviewApi.useAddComment();

  const review = reviewResponse?.data;
  const comments = commentsResponse?.data.items || [];

  const handleAddComment = () => {
    if (!newComment.trim() || !reviewId) return;

    addCommentMutate(
      {
        reviewId,
        data: {
          text: newComment,
          isBusinessReplyPublic: isBusinessReply,
        },
      },
      {
        onSuccess: () => {
          setNewComment("");
          setIsBusinessReply(false);
        },
        onError: (error) => {
          console.error("Failed to add comment:", error);
        },
      }
    );
  };

  const renderComment = (comment: IComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-8 mt-2" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={comment.user?.image_url || undefined}
            alt={comment.user?.firstname}
          />
          <AvatarFallback>
            {comment.user
              ? getInitials(comment.user.firstname, comment.user.lastname)
              : "B"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {comment.user
                ? `${comment.user.firstname} ${comment.user.lastname}`
                : "Business"}
            </span>
            {comment.isBusinessReplyPublic && (
              <Badge variant="secondary" className="text-xs">
                Business Reply
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateDistance(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{comment.text}</p>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
          <DialogDescription>
            View complete review information and manage responses
          </DialogDescription>
        </DialogHeader>

        {isLoadingReview ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Loading review details..." />
          </div>
        ) : reviewError ? (
          <ErrorDisplay
            title="Failed to Load Review"
            message="Could not fetch review details at this time."
            error={reviewError}
          />
        ) : review ? (
          <div className="space-y-6">
            {/* Review Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={review.user.image_url || undefined}
                        alt={review.user.firstname}
                      />
                      <AvatarFallback>
                        {getInitials(
                          review.user.firstname,
                          review.user.lastname
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {review.user.firstname} {review.user.lastname}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDateDistance(review.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <Badge
                      variant={review.display_review ? "default" : "secondary"}
                    >
                      {review.display_review ? "Public" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{review.comment}</p>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingComments ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner message="Loading comments..." />
                  </div>
                ) : commentsError ? (
                  <ErrorDisplay
                    title="Failed to Load Comments"
                    message="Could not fetch comments at this time."
                    error={commentsError}
                  />
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => renderComment(comment))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No comments yet. Be the first to respond!
                  </p>
                )}

                <Separator className="my-4" />

                {/* Add Comment Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-comment">Add a response</Label>
                    <Textarea
                      id="new-comment"
                      placeholder="Type your response here..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] mt-2"
                      disabled={isAddingComment}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="business-reply"
                      checked={isBusinessReply}
                      onChange={(e) => setIsBusinessReply(e.target.checked)}
                      className="rounded"
                      disabled={isAddingComment}
                    />
                    <Label htmlFor="business-reply" className="text-sm">
                      Make public for general view
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isAddingComment}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isAddingComment}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isAddingComment && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Response
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Review not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
