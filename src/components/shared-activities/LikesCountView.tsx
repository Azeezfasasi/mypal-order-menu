import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import type { ILikeActivityItem } from "@/types/activity-types";
import { Heart } from "lucide-react";
import Image from "next/image";
import { PaginationControls } from "./PaginationControls";

export interface LikesCountViewProps {
  likes: ILikeActivityItem[];
  totalLikesCount: number;
  pagination: ReturnType<typeof usePagination>;
}

export function LikesCountView({
  likes,
  totalLikesCount,
  pagination,
}: LikesCountViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-between">
        <h2 className="text-xl font-semibold">Business Likes</h2>
        <div className="flex items-center gap-1 text-red-500">
          <Heart className="h-5 w-5 fill-current" />
          <span className="font-medium">
            {totalLikesCount} like{totalLikesCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-4">Liked by:</h3>

        {likes.length === 0 && !pagination ? (
          <div className="text-center text-muted-foreground py-6 border rounded-md">
            No users have liked this business yet, or none match the current
            page/filters.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Liked Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {likes.map((like) => (
                  <TableRow key={like.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {like.user.image_url ? (
                          <Image
                            src={like.user.image_url}
                            alt={`${like.user?.firstname} ${like.user?.lastname}`}
                            width={32}
                            height={32}
                            className="rounded-full"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs flex-shrink-0">
                            {like.user?.firstname?.[0]?.toUpperCase()}
                            {like.user?.lastname?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span>
                          {like.user?.firstname} {like.user?.lastname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{like.user.email}</TableCell>
                    <TableCell>{like.user.phone_number ?? "N/A"}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(like.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <PaginationControls {...pagination} itemName="like" />
        )}
      </div>
    </div>
  );
}
