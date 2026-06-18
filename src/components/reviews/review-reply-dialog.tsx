// components/reviews/ReviewReplyDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

interface ReviewReplyDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  replyMessage: string;
  setReplyMessage: (value: string) => void;
  replyType: "direct" | "general";
  isAddingComment: boolean;
  userFirstName: string;
}

export function ReviewReplyDialog({
  open,
  onClose,
  onSubmit,
  replyMessage,
  setReplyMessage,
  replyType,
  isAddingComment,
  userFirstName,
}: ReviewReplyDialogProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setReplyMessage(e.target.value);
    },
    [setReplyMessage]
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {replyType === "direct" ? "Reply directly" : "Reply generally"}
          </DialogTitle>
          <DialogDescription>
            {replyType === "direct"
              ? `Send a direct response to ${userFirstName}'s review.`
              : "Send a general response that will be visible to all customers."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reply-message">Response</Label>
            <Textarea
              id="reply-message"
              placeholder="Type your message here"
              value={replyMessage}
              onChange={handleChange}
              className="min-h-[100px]"
              disabled={isAddingComment}
            />
          </div>
        </div>

        <DialogFooter className="gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAddingComment}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!replyMessage.trim() || isAddingComment}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isAddingComment && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
