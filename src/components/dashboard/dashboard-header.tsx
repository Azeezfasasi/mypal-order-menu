"use client";

import { Button } from "@/components/ui/button";
import { Menu, MessageCircleMore } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import MessagingModal from "../messaging/messaging-modal";
import { BusinessMessagingApi } from "@/services/api/business-messaging-api";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {

  const pathname = usePathname();
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "dashboard";

    if (path === "dashboard") return "Overview";

    return path
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getPageDescription = () => {
    const descriptions: Record<string, string> = {
      overview: "View key metrics and performance of your business",
      transactions: "Manage and track all business transactions",
      sales: "Monitor sales performance and revenue analytics",
      customers: "Engage with your customer base and insights",
      services: "Manage service availability and scheduling",
      events: "Organize and track business events",
      offerings: "Manage your services and product offerings",
      reports: "Generate detailed business reports and analytics",
      shared: "Collaborate on shared business activities",
      settings: "Configure your business settings and preferences",
    };

    const path = pathname.split("/").pop() || "overview";
    return descriptions[path] || "Manage your Order Menu operations";
  };

  const handleCloseMessagingModal = useCallback(() => {
    setIsMessagingOpen(false);
  }, []);

  const { data } = BusinessMessagingApi.useGetBusinessConversation({
    page: 1,
    limit: 100,
  });

  const conversationList = data?.data;

  const totalUnreadCount = conversationList?.data.reduce(
    (total, convo) => total + convo.unreadCount,
    0
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-4 px-6">
      {/* Left side - Menu & Title */}
      <div className="flex items-center lg:gap-2 gap-4 min-w-0 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="hidden lg:block"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Title & Description */}
        <div className="min-w-0 flex-1">
          <h1 className="lg:text-lg text-xl font-semibold truncate">
            {getPageTitle()}
          </h1>
          <p className="lg:text-xs text-sm text-muted-foreground truncate md:hidden block">
            {getPageDescription()}
          </p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center lg:gap-1 gap-2">

        {/* QR Code - Hidden on mobile */}
        <Button
          onClick={() => setIsMessagingOpen(true)}
          variant="ghost"
          // size="icon"
          className="relative flex h-9 w-9 p-0!"
        >
          {totalUnreadCount! > 0 &&
            <div className="absolute top-1 right-1 text-[10px] bg-[#FF6900] text-white flex items-center justify-center rounded-full h-4 w-4 ml-2">
              {totalUnreadCount}
            </div>
          }
          <MessageCircleMore size={18} className="text-[#667185]" />
          <span className="sr-only">Messages</span>
        </Button>

        {isMessagingOpen &&
          <MessagingModal
            onClose={handleCloseMessagingModal}
          />}

      </div>
    </header>
  );
}
