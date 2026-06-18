"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IBranch } from "@/services/api/branches-api";
import { BranchCard } from "./branch-card";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

interface BranchListProps {
  branches: IBranch[];
  isLoading: boolean;
  onAddBranch: () => void;
  onEdit: (branch: IBranch) => void;
  onViewMenu: (branch: IBranch) => void;
  onDelete: (branchId: string) => void;
}

export function BranchList({
  branches,
  isLoading,
  onAddBranch,
  onEdit,
  onViewMenu,
  onDelete,
}: BranchListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m0 0l8 4m0-4l8 4m-8 4v8m0 0H8m0 0H4m8 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add new branch</h3>
        <p className="text-gray-600 mb-6">Expand your footprint</p>
        <Button
          onClick={onAddBranch}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add new branch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Branch Grid */}
      {filteredBranches.length > 0 ? (
        <div className="grid md:grid-cols-1 grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={onEdit}
              onViewMenu={onViewMenu}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No branches found matching your search.</p>
        </div>
      )}
    </div>
  );
}
