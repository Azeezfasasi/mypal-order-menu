// components/DialogFooterActions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Trash2 } from "lucide-react";

interface DialogFooterActionsProps {
  isEditing: boolean;
  mode: "operatingHours" | "blackoutDate";
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  deletePending: boolean;
  savePending: boolean;
  saveDisabled: boolean;
}

/**
 * Reusable component for the common dialog footer actions (Delete, Cancel, Save).
 * It handles conditional rendering for the delete button and loading states.
 */
export function DialogFooterActions({
  isEditing,
  mode,
  onDelete,
  onCancel,
  onSave,
  deletePending,
  savePending,
  saveDisabled,
}: DialogFooterActionsProps) {
  return (
    <div className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      {/* Conditional Delete Button */}
      {isEditing && (
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={deletePending}
        >
          {deletePending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          {mode === "operatingHours" ? "Set as Closed" : "Delete"}
        </Button>
      )}
      {!isEditing && <div></div>} {/* Placeholder for alignment */}
      {/* Cancel and Save Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={savePending}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saveDisabled || savePending}>
          {savePending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
