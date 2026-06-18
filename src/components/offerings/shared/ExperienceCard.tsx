// components/ui/menu/ExperienceCard.tsx
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export interface ExperienceCardProps {
  id: string;
  name: string;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  isDeleting?: boolean; // Add loading prop for delete
  isEditing?: boolean; // loading state for edit
}

export function ExperienceCard({
  id,
  name,
  onDelete,
  onEdit,
  isDeleting = false, // Default to false
  isEditing = false,
}: ExperienceCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
      <span>{name}</span>
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            variant="outline"
            className="bg-orange-100 border-orange-200 hover:bg-orange-200 text-primary"
            onClick={() => onEdit(id)}
            disabled={isEditing}
          >
            {isEditing ? t("button.editing") : t("button.edit")}
          </Button>
        )}
        <Button
          variant="outline"
          className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-700"
          onClick={() => onDelete(id)}
          disabled={isDeleting} // Disable while deleting
        >
          {isDeleting ? t("button.deleting") : t("button.delete")}{" "}
          {/* Show loading text */}
        </Button>
      </div>
    </div>
  );
}
