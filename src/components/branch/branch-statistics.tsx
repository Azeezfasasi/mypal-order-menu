"use client";

import { IBranch } from "@/services/api/branches-api";

interface BranchStatisticsProps {
  branches: IBranch[];
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export function BranchStatistics({ branches }: BranchStatisticsProps) {
  const stats: StatCard[] = [
    {
      label: "Total branches",
      value: branches.length,
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    {
      label: "Active locations",
      value: branches.filter((b) => b.is_active).length,
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    {
      label: "Pending review",
      value: branches.filter((b) => !b.is_active).length,
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
    {
      label: "Menu items synced",
      value: branches.reduce((acc, b) => acc + (b.menu_items_synced || 0), 0),
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid md:grid-cols-1 grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            {stat.icon}
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
