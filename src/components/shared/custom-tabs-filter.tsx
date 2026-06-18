import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CustomTabsFilterProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const CustomTabsFilter = ({
  activeTab,
  onTabChange,
}: CustomTabsFilterProps) => {
  return (
    <div className="flex w-full items-center gap-4 sm:w-auto">
      <Tabs
        defaultValue={activeTab}
        className="w-full sm:w-auto"
        onValueChange={onTabChange}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
