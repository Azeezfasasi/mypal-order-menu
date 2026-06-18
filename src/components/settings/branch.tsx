
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AddBranchModal,
  EditBranchModal,
  BranchList,
  BranchStatistics,
} from "@/components/branch";
import { BranchesApi, IBranch } from "@/services/api/branches-api";
import { Plus } from "lucide-react";

export default function Branch() {
  const router = useRouter();
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<IBranch | null>(null);

  const { data: branchesData, isLoading } = BranchesApi.useGetAllBranches();
  const { mutate: deleteBranch } = BranchesApi.useDeleteBranch();

  const branches: IBranch[] = branchesData?.data || [];

  const handleDelete = (branchId: string) => {
    if (confirm("Are you sure you want to delete this branch?")) {
      deleteBranch(branchId);
    }
  };

  const handleEdit = (branch: IBranch) => {
    setSelectedBranch(branch);
    setIsEditBranchOpen(true);
  };

  const handleViewMenu = (branch: IBranch) => {
    router.push(`/settings/branch/${branch.id}/menu`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex md:flex-col flex-row gap-0 md:gap-4 items-center md:justify-center justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-center text-gray-900">Branches</h1>
          <p className="text-gray-600 mt-1">Manage all your physical locations</p>
        </div>
        <Button
          onClick={() => setIsAddBranchOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new branch
        </Button>
      </div>

      {/* Statistics */}
      <BranchStatistics branches={branches} />

      {/* Branch List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch list</h2>
        </div>
        <BranchList
          branches={branches}
          isLoading={isLoading}
          onAddBranch={() => setIsAddBranchOpen(true)}
          onEdit={handleEdit}
          onViewMenu={handleViewMenu}
          onDelete={handleDelete}
        />
      </div>

      {/* Add Branch Modal */}
      <AddBranchModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        branches={branches}
      />

      {/* Edit Branch Modal */}
      <EditBranchModal
        isOpen={isEditBranchOpen}
        onClose={() => {
          setIsEditBranchOpen(false);
          setSelectedBranch(null);
        }}
        branch={selectedBranch}
      />
    </div>
  );
}
