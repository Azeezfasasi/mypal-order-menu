// components/dialogs/ExperienceDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExperienceForm,
  ExperienceFormValues,
} from "../offerings/forms/ExperienceForm";

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (data: ExperienceFormValues) => void;
  isLoading?: boolean;
  existingExperienceIds?: string[]; // Add prop for passing existing experience IDs
  existingExperienceNames?: string[]; // names for duplicate checks
  initialName?: string; // initial value for edit mode
}
export function ExperienceDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isLoading = false,
  existingExperienceIds = [], // Default to empty array
  existingExperienceNames = [],
  initialName = "",
}: ExperienceDialogProps) {
  // Handle dialog cancel
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ExperienceForm
          onSubmit={onSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          existingExperienceIds={existingExperienceIds} // Pass existing IDs to form
          existingExperienceNames={existingExperienceNames}
          initialName={initialName}
        />
      </DialogContent>
    </Dialog>
  );
}
