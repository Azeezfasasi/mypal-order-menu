"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BoatCruisesApi } from "@/services/api/boat-cruises-api";
import type { BoatReview } from "@/types/boat-cruise-types";
import { BoatsPagination } from "./BoatsPagination";
import { formatTimestamp } from "./boat-utils";

const ALL = "all";
const PAGE_SIZE = 10;

export function BoatReviews() {
  const [boatId, setBoatId] = useState(ALL);
  const [rating, setRating] = useState(ALL);
  const [replied, setReplied] = useState(ALL);
  const [page, setPage] = useState(1);
  const { data: boats } = BoatCruisesApi.useBoats({ page: 1, limit: 100 });
  const { data, isLoading, isFetching, isError, refetch } = BoatCruisesApi.useReviews({
    page,
    limit: PAGE_SIZE,
    listing_id: boatId === ALL ? undefined : boatId,
    rating: rating === ALL ? undefined : Number(rating),
    replied: replied === ALL ? undefined : replied === "yes",
  });
  const reviews = data?.items ?? [];
  const pick = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={boatId} onValueChange={pick(setBoatId)}>
          <SelectTrigger className="w-64 md:w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All boats</SelectItem>
            {(boats?.items ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rating} onValueChange={pick(setRating)}>
          <SelectTrigger className="w-40 md:w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} star{r === 1 ? "" : "s"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={replied} onValueChange={pick(setReplied)}>
          <SelectTrigger className="w-44 md:w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Replied or not</SelectItem>
            <SelectItem value="no">Awaiting reply</SelectItem>
            <SelectItem value="yes">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn("space-y-3", isFetching && !isLoading && "opacity-70")}>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-gray-500">
            Couldn&apos;t load reviews.{" "}
            <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
              Try again
            </button>
          </p>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No reviews yet.
          </div>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>

      {data && data.meta.totalPages > 1 && <BoatsPagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}

function ReviewCard({ review }: { review: BoatReview }) {
  const reply = BoatCruisesApi.useReplyToReview();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const boatName = review.listing?.name ?? review.boat?.name ?? "";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex" aria-label={`${review.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={cn("h-4 w-4", i <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
              ))}
            </span>
            <span className="text-sm font-medium text-gray-900">{review.user?.name ?? "Guest"}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {boatName}
            {boatName && " · "}
            {formatTimestamp(review.created_at)}
          </p>
        </div>
        {!review.business_reply && !open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Reply
          </Button>
        )}
      </div>
      {review.comment && <p className="mt-3 text-sm text-gray-700">{review.comment}</p>}
      {review.business_reply && (
        <div className="mt-4 rounded-lg border-l-4 border-orange-400 bg-orange-50/60 p-3 text-sm">
          <p className="text-xs font-medium text-orange-800">Your reply · {formatTimestamp(review.replied_at)}</p>
          <p className="mt-1 text-gray-700">{review.business_reply}</p>
        </div>
      )}
      {open && (
        <div className="mt-4 space-y-2">
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank the guest or respond to their feedback" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={reply.isPending}>
              Cancel
            </Button>
            <Button
              disabled={reply.isPending || !text.trim()}
              onClick={() =>
                reply.mutate(
                  { id: review.id, reply: text.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Reply posted");
                      setOpen(false);
                      setText("");
                    },
                  }
                )
              }
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {reply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post reply
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
