"use client";

import BusinessProfileTab from "@/components/settings/business-profile"; // Adjust path
import ChangePasswordTab from "@/components/settings/change-password-tab";
// import ContractSetupTab from "@/components/settings/contract-setup-tab";
// import MediaTab from "@/components/settings/media-tab"; 
// import TeamManagementTab from "@/components/settings/team-management-tab";
// import { SettlementTab } from "@/components/settings/settlement-accounts"; // Adjust path
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Branch from "@/components/settings/branch";

export default function SettingsPage() {
  const contentClasses =
    "mt-6 rounded-md border p-6 sm:p-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  // Define common tab trigger classes for consistency
  const triggerClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm";

  return (
    <div className="space-y-6 p-6 md:p-4 sm:p-0 ">
      <div>
        <h1 className="text-3xl md:text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground md:text-sm">
          View and manage your company profile, media, accounts, and
          preferences.
        </p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        {/* Use overflow-x-auto for responsiveness on smaller screens */}
        <TabsList className="inline-flex h-auto min-h-[2.5rem] items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full">
          <TabsTrigger value="profile" className={triggerClasses}>
            Profile
          </TabsTrigger>
          {/* <TabsTrigger value="branch" className={triggerClasses}>
            Branches
          </TabsTrigger> */}
          {/* <TabsTrigger value="media" className={triggerClasses}>
            Media & Customizations
          </TabsTrigger> */}
          {/* <TabsTrigger value="team" className={triggerClasses}>
            Team Management
          </TabsTrigger> */}
          {/* <TabsTrigger value="settlement" className={triggerClasses}>
            Settlement Accounts
          </TabsTrigger> */}

          {/* <TabsTrigger value="contract" className={triggerClasses}>
            Contract Setup
          </TabsTrigger> */}
          {/* Change Password Tab Trigger */}
          <TabsTrigger value="change-password" className={triggerClasses}>
            Change Password
          </TabsTrigger>
        </TabsList>
        {/* Tab Contents */}
        <TabsContent value="profile" className={contentClasses}>
          <BusinessProfileTab />
        </TabsContent>
        {/* <TabsContent value="branch" className={contentClasses}>
          <Branch />
        </TabsContent> */}
        {/* <TabsContent value="media" className={contentClasses}>
          <MediaTab />
        </TabsContent> */}
        {/* <TabsContent value="team" className={contentClasses}>
          <TeamManagementTab />
        </TabsContent> */}
        {/* <TabsContent value="settlement" className={contentClasses}>
          <SettlementTab />
        </TabsContent> */}
        {/* <TabsContent value="contract" className={contentClasses}>
          <ContractSetupTab />
        </TabsContent> */}
        {/* Change Password Tab Content */}
        <TabsContent value="change-password" className={contentClasses}>
          <ChangePasswordTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
