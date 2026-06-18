// SharedPageCard.tsx
import { Button } from "@/components/ui/button";
import type { IShareActivityItem } from "@/types/activity-types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function SharedPageCard({ page }: { page: IShareActivityItem }) {
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(page?.sharedLink);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link.");
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="border rounded-md p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground truncate">
          Shared Link:{" "}
          <span className="font-medium text-primary">{page?.sharedLink}</span>
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyClick}
          aria-label="Copy shared link"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-muted-foreground mb-2 text-sm">
        Shared on: {page?.externalPlatform}
      </div>

      <div className="mt-auto flex justify-between items-center text-sm text-muted-foreground">
        <span>Shared by:</span>
        <span className="font-medium">
          {page?.sharedBy?.firstname} {page?.sharedBy?.lastname}
        </span>
      </div>

      <div className="text-sm text-muted-foreground">
        Shared at:{" "}
        {new Date(page?.sharedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </div>
    </div>
  );
}
