"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClubApi } from "@/services/api/club-api";
import type { ClubManagement } from "@/services/api/club-api";
import { Edit, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ClubManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [tablesAvailable, setTablesAvailable] = useState<number>(0);

  const { data: clubData, isLoading } = ClubApi.useGetClubManagement();
  const { mutate: updateClub, isPending: isUpdating } =
    ClubApi.useUpdateClubManagement();

  const handleEdit = () => {
    setTablesAvailable(clubData?.tables_available || 0);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tablesAvailable < 0) {
      toast.error("Tables available must be a positive number");
      return;
    }

    if (!clubData?.id) {
      toast.error("Club configuration not found. Please set up club information first.");
      setIsEditing(false);
      return;
    }

    updateClub(
      { id: clubData.id, tables_available: tablesAvailable },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Tables availability updated successfully");
        },
        onError: () => {
          toast.error("Failed to update tables availability");
        },
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTablesAvailable(clubData?.tables_available || 0);
  };

  if (isLoading) {
    return (
      <Card className="mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f14a05]"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto">
      <CardHeader className="flex-row items-center justify-between mb-4">
        <div>
          <h3 className="text-xl md:text-md font-bold font-sora flex items-center gap-3 text-primary-500">
            Tables Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage the total number of tables available in your club
          </p>
        </div>

        {!isEditing && clubData && (
          <Button
            onClick={handleEdit}
            className="bg-primary-500 hover:bg-[#f14a05]"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Number of Tables Available
              </label>
              <input
                type="number"
                min="0"
                value={tablesAvailable}
                onChange={(e) => setTablesAvailable(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f14a05]"
                placeholder="Enter total number of tables"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total number of tables available
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="bg-[#f14a05] hover:bg-[#f14a05]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : clubData ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600 mb-2">Tables Available</p>
              <p className="text-4xl font-bold text-[#f14a05]">
                {clubData.tables_available || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Total number of tables available in your club
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 font-medium mb-2">Club Configuration Required</p>
            <p className="text-sm text-gray-500">
              A club management record needs to be created before you can manage table availability. 
              This is typically set up during initial club configuration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
