"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Image as LucideImage,
  Trash2,
  Edit3,
  Eye,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BusinessActivityApi,
  createActivityFormData,
  createUpdateActivityFormData,
  type IBusinessActivity,
  type IActivityPrice,
  IUpdateActivityDto,
} from "@/services/api/business-activity-offering-api";
import {
  AddActivityDialog,
  EditActivityDialog,
  ViewActivityDialog,
  PriceModalDialog,
  ImageModalDialog,
} from "./activity-dialogs";

// Updated Activity type to match API interface
interface Activity extends IBusinessActivity {
  image?: string; // For backward compatibility
}

// Form data type
interface ActivityFormData {
  name: string;
  description: string;
  images: File[];
  activityprices: IActivityPrice[];
}

export default function ActivitiesSection() {
  // API hooks
  const { data: activitiesResponse, isLoading } =
    BusinessActivityApi.useGetBusinessActivities();
  const createMutation = BusinessActivityApi.useCreateBusinessActivity();
  const updateMutation = BusinessActivityApi.useUpdateBusinessActivity();
  const deleteMutation = BusinessActivityApi.useDeleteBusinessActivity();
  const deleteImageMutation = BusinessActivityApi.useDeleteActivityImage();

  // Use API data if available, fallback to props
  const activities = activitiesResponse?.data || [];

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Handle create activity
  const handleCreateActivity = async (formData: ActivityFormData) => {
    try {
      const formDataToSend = createActivityFormData(formData);
      await createMutation.mutateAsync(formDataToSend);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to create activity:", error);
    }
  };

  // Handle update activity
  const handleUpdateActivity = async (
    formData: ActivityFormData | IUpdateActivityDto
  ) => {
    if (!selectedActivity) return;

    try {
      const updateFormData = createUpdateActivityFormData(formData);
      await updateMutation.mutateAsync({
        activityId: selectedActivity.id,
        formData: updateFormData,
      });
      setIsEditModalOpen(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  // Handle delete activity
  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await deleteMutation.mutateAsync(activityId);
      } catch (error) {
        console.error("Failed to delete activity:", error);
      }
    }
  };

  // Handle delete image
  const handleDeleteImage = async (imageId: string) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteImageMutation.mutateAsync(imageId);
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    }
  };

  // Open edit modal
  const openEditModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsViewModalOpen(true);
  };

  // Open price modal
  const openPriceModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsPriceModalOpen(true);
  };

  // Open image modal
  const openImageModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">Loading activities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">🏄‍♂️ Activities</CardTitle>
        <AddActivityDialog
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={handleCreateActivity}
          isLoading={createMutation.isPending}
        />
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activities found. Add your first activity to get started!
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="relative group">
              <div
                className="relative h-40 rounded-xl overflow-hidden bg-cover bg-center cursor-pointer transform transition-transform group-hover:scale-[1.02]"
                style={{
                  backgroundImage: `url(${
                    activity.images?.[0]?.image_url ||
                    "/placeholder-activity.jpg"
                  })`,
                }}
                onClick={() => {
                  openEditModal(activity);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white text-2xl font-bold drop-shadow-lg">
                      {activity.name}
                    </h3>
                    <ChevronDown className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageModal(activity);
                      }}
                    >
                      <LucideImage className="h-4 w-4 mr-1" />
                      Images
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPriceModal(activity);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Prices
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(activity);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(activity);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActivity(activity.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Dialog Components */}
      <EditActivityDialog
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        activity={selectedActivity}
        onSubmit={handleUpdateActivity}
        isLoading={updateMutation.isPending}
      />

      <ViewActivityDialog
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        activity={selectedActivity}
      />

      <PriceModalDialog
        isOpen={isPriceModalOpen}
        onOpenChange={setIsPriceModalOpen}
        activity={selectedActivity}
      />

      <ImageModalDialog
        isOpen={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
        activity={selectedActivity}
        onDeleteImage={handleDeleteImage}
      />
    </Card>
  );
}
