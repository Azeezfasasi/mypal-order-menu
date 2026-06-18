import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface RequiredFieldsIndicatorProps {
  requiredFields?: string[] | null;
  showBanner?: boolean;
}

/**
 * Component to display required fields indicator badge
 */
export function RequiredFieldBadge() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
      <AlertTriangle className="h-3 w-3" />
      Required Update
    </span>
  );
}

/**
 * Banner component to display all required fields at the top of the form
 */
export function RequiredFieldsBanner({
  requiredFields,
  showBanner = true,
}: RequiredFieldsIndicatorProps) {
  if (!showBanner || !requiredFields || requiredFields.length === 0) {
    return null;
  }

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, " $1") // Add space before uppercase
      .replace(/_/g, " ") // Replace underscores with spaces
      .toLowerCase()
      .replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
      .trim();
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="ml-2 text-sm text-orange-900">
        <div className="space-y-2">
          <p className="font-semibold">
            The admin team has requested updates to the following fields:
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-2">
            {requiredFields.map((field) => (
              <div
                key={field}
                className="flex items-center gap-2 text-orange-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                <span>{formatFieldName(field)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-orange-700">
            Please provide accurate information for these fields and resubmit
            your documents.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Utility to normalize field names for comparison
 */
export function normalizeFieldName(name: string): string {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * Check if a field is in the required updates list
 */
export function isFieldRequired(
  fieldName: string,
  requiredUpdates?: string[] | null,
): boolean {
  if (!requiredUpdates) return false;
  const normalized = normalizeFieldName(fieldName);
  return (
    requiredUpdates.includes(fieldName) || requiredUpdates.includes(normalized)
  );
}
