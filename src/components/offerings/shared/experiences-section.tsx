// components/sections/ExperiencesSection.tsx
import { ExperienceDialog } from "@/components/dialogs/ExperienceDialog";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import {
  BusinessExperienceApi,
  ICreateBusinessExperiencePayload,
} from "@/services/api/business-experience-api";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ExperienceFormValues } from "../forms/ExperienceForm";
import { ExperienceCard } from "./ExperienceCard";
import { SectionHeader } from "./SectionHeader";

export function ExperiencesSection() {
  const [showAddExperienceDialog, setShowAddExperienceDialog] = useState(false);
  const [editingExperience, setEditingExperience] = useState<{
    id: string | null;
    name: string;
  }>({ id: null, name: "" });

  const {
    data: experiencesData,
    isLoading,
    error,
    isError,
  } = BusinessExperienceApi.useGetBusinessExperiences();

  // API mutations using custom hooks
  const createExperienceMutation =
    BusinessExperienceApi.useCreateBusinessExperience();
  const deleteExperienceMutation =
    BusinessExperienceApi.useDeleteBusinessExperience();
  const updateExperienceMutation =
    BusinessExperienceApi.useUpdateBusinessExperience();

  // Get existing experience IDs for filtering out already selected experiences
  // Use optional chaining and nullish coalescing for safety
  const existingExperienceIds =
    experiencesData?.data?.map((exp) => exp.id) ?? [];

  // Handle dialog change
  const handleDialogChange = (open: boolean) => {
    setShowAddExperienceDialog(open);
    if (!open) {
      // reset edit state when dialog is closed
      setEditingExperience({ id: null, name: "" });
    }
  };

  // onEdit handler passed to ExperienceCard
  const handleEditClick = (id: string) => {
    const exp = experiences?.find((e) => e.id === id);
    if (!exp) return;
    setEditingExperience({ id: exp.id, name: exp.experience_name });
    setShowAddExperienceDialog(true);
  };

  // Handle adding experience by sending name to backend
  const handleAddExperience = (data: ExperienceFormValues) => {
    const payload: ICreateBusinessExperiencePayload = {
      experience_name: data.experience_name,
    };

    createExperienceMutation.mutate(payload, {
      onSuccess: () => {
        setShowAddExperienceDialog(false);
      },
    });
  };

  // Handle update
  const handleUpdateExperience = (data: ExperienceFormValues) => {
    if (!editingExperience.id) return;
    updateExperienceMutation.mutate(
      {
        experience_id: editingExperience.id,
        experience_name: data.experience_name,
      },
      {
        onSuccess: () => {
          setShowAddExperienceDialog(false);
          setEditingExperience({ id: null, name: "" });
        },
      },
    );
  };

  // Handle delete experience
  const handleDeleteExperience = (id: string) => {
    deleteExperienceMutation.mutate(id);
  };

  // Display loading or error states based on API status
  if (isLoading) {
    return (
      <Card className="flex justify-center items-center p-8">
        <Loader message="Loading experiences info..." />{" "}
        {/* Use the new Loader component */}
      </Card>
    );
  }

  if (isError) {
    // Ensure error is an Error instance before accessing message
    return (
      <Card className="p-8">
        <ErrorHandler
          message={
            error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching experiences."
          }
          title="Failed to Load Experiences"
          className="mt-4" // Add some margin if needed
          // You could make this dismissible if you want the user to be able to hide it
          // dismissible={true}
          // onDismiss={() => { /* handle dismissal state if needed */ }}
        />
      </Card>
    );
  }

  // Explicitly check if experiencesData?.data exists and is an array before checking length or mapping
  const experiences = experiencesData?.data;

  const hasExperiences = Array.isArray(experiences) && experiences.length > 0;

  console.log({ experiencesData, experiences });

  return (
    <Card className="p-6">
      <SectionHeader
        title="Experiences"
        buttonLabel={
          createExperienceMutation.isPending
            ? t("button.adding")
            : t("button.add_new_experience")
        }
        icon={Plus}
        onClick={() => {
          setEditingExperience({ id: null, name: "" });
          setShowAddExperienceDialog(true);
        }}
        variant="outline"
        buttonDisabled={createExperienceMutation.isPending} // Disable button while creating
      />

      <div className="space-y-4">
        {hasExperiences ? (
          experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              id={experience.id}
              name={experience.experience_name}
              onDelete={handleDeleteExperience}
              onEdit={handleEditClick}
              isDeleting={
                deleteExperienceMutation.isPending &&
                deleteExperienceMutation.variables === experience.id
              }
              isEditing={
                updateExperienceMutation.isPending &&
                updateExperienceMutation.variables?.experience_id ===
                  experience.id
              }
            />
          ))
        ) : (
          <div className="text-center text-gray-500">No experiences found.</div>
        )}
      </div>

      {/* Add/Edit Experience Dialog */}
      <ExperienceDialog
        open={showAddExperienceDialog}
        onOpenChange={handleDialogChange}
        title={
          editingExperience.id ? t("dialog.edit_title") : t("dialog.add_title")
        }
        onSubmit={
          editingExperience.id ? handleUpdateExperience : handleAddExperience
        }
        isLoading={
          createExperienceMutation.isPending ||
          updateExperienceMutation.isPending
        }
        existingExperienceIds={existingExperienceIds}
        existingExperienceNames={
          experiences?.map((e) => e.experience_name) ?? []
        }
        initialName={editingExperience.name}
      />
    </Card>
  );
}
