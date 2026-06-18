import { type IBusinessReview } from "@/services/api/business-reviews-api";

import { Star, MoreVertical, Reply, Eye } from "lucide-react"; // Import Eye icon
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getInitials, formatDateDistance } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
// ReviewReplyDialog is removed from here

export interface ReviewCardProps {
  review: IBusinessReview;
  businessId?: string;
  // New props for handling replies and viewing details at the parent level
  onReply: (review: IBusinessReview, type: "direct" | "general") => void;
  onViewDetails: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  onReply,
  onViewDetails,
}: ReviewCardProps) {
  const rating = review.rating;
  const percentage = Math.round((rating / 5) * 100);
  const formattedDate = formatDateDistance(review.createdAt);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state

  const handleDropdownMenuItemClick = (callback: () => void) => {
    setIsDropdownOpen(false); // Close the dropdown immediately
    callback(); // Then execute the original action (opening modal)
  };

  return (
    <>
      <div className="border rounded-lg p-4 space-y-4 flex flex-col justify-between bg-card text-card-foreground">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={review.user.image_url ?? undefined}
                  alt={review.user.firstname}
                />
                <AvatarFallback>
                  {getInitials(review.user.firstname, review.user.lastname)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {review.user.firstname} {review.user.lastname}
                </p>
                <p className="text-xs text-muted-foreground">
                  • {formattedDate}
                </p>
              </div>
            </div>

            {/* Reply and View Dropdown Menu */}
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              {/* Control open state */}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    handleDropdownMenuItemClick(() => onReply(review, "direct"))
                  } // Wrap callback
                  className="cursor-pointer"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply directly
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleDropdownMenuItemClick(() =>
                      onReply(review, "general")
                    )
                  } // Wrap callback
                  className="cursor-pointer"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply generally
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleDropdownMenuItemClick(() => onViewDetails(review.id))
                  } // Wrap callback
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {review.comment}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <div className="flex items-center gap-1">
                <span className="font-medium">{rating.toFixed(1)}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Percentage Circle */}
            <div className="relative h-12 w-12 flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{percentage}%</span>
              </div>
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    rating >= 4
                      ? "hsl(var(--primary))"
                      : rating >= 2.5
                      ? "hsl(var(--secondary))"
                      : "hsl(var(--muted-foreground))"
                  }
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
