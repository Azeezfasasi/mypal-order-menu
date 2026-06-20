"use client";

import AccountSwitcher from "@/components/account-switcher/AccountSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { pickBusiness } from "@/lib/utils";
import { BusinessContextApi } from "@/services/api/business-context-api";
import { getAuthActions, TokenType, useAuthStore } from "@/stores/auth-store";
import { Bell, Menu, MessageCircleMore, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import MessagingModal from "../messaging/messaging-modal";
import { BusinessMessagingApi } from "@/services/api/business-messaging-api";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationApi } from "@/services/api/notification-api";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {

  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  const { data: unreadData } = NotificationApi.useGetUnreadCount();

  // Get data from auth store
  const business = useAuthStore((state) => state.business);
  const actions = useAuthStore((state) => state.actions);

  // Business switching mutation
  const { mutateAsync: switchBusiness } =
    BusinessContextApi.useSwitchBusiness();

  // Map linked businesses to account items, excluding the current business
  const linkedAccounts = business?.linkedBusinesses
    ?.filter((linkedBiz) => linkedBiz.id !== business.id)
    .map((linkedBiz) => ({
      id: linkedBiz.id,
      name: linkedBiz.business_name,
      subtitle: linkedBiz.category?.name || undefined,
      imageUrl: linkedBiz.image_url || null,
    }));

  console.log("linked business", business, business?.linkedBusinesses);

  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const category = searchParams.get("category");

  const rawBusinessCategory = business?.category?.business_type ?? "";

  // Handle business account switching
  const handleBusinessSwitch = useCallback(async (businessId: string) => {
    try {
      const res = await switchBusiness({ businessId });
      const returned = res?.data;
      if (returned?.business && returned?.access_token) {
        const minimal = pickBusiness(returned.business, returned.access_token);
        // Add linked businesses to the minimal business object
        if (returned.linkedBusinesses) {
          minimal.linkedBusinesses = returned.linkedBusinesses;
        }
        // Set session as authenticated with new business
        getAuthActions().setSession(
          returned.access_token,
          TokenType.AUTHENTICATED,
          minimal,
        );
        toast.success("Switched business successfully");
        queryClient.removeQueries();
        if (category && orderId) {
          window.location.href = `/dashboard?category=${category}&orderId=${orderId}`;
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        toast.error("Failed to switch business");
      }
    } catch (err) {
      console.error("Switch business error", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch business";
      toast.error(errorMessage);
    }
  }, [switchBusiness, queryClient, category, orderId]);

  useEffect(() => {
    // toast.success(`CATEGORY: ${category}, BUSINESS CATEGORY: ${rawBusinessCategory}`)
    if (!category || !rawBusinessCategory) return;
    if (rawBusinessCategory === category) {
      queryClient.invalidateQueries();
      return;
    }
    // toast.error(`Please switch to ${category} category to view order details`);
    const targetBusinessId = linkedAccounts?.find((a) => a.subtitle === category)?.id;
    if (targetBusinessId) {
      handleBusinessSwitch(targetBusinessId)
    } else {
      toast.error(`Category doesn't exist for this business.`);
    };

  }, [category, rawBusinessCategory, linkedAccounts, handleBusinessSwitch, queryClient])

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/").pop() || "dashboard";

    if (path === "dashboard") return "Menu Management";

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

  const handleLogout = () => {
    try {
      actions.clearSession();
    } catch (err) {
      console.error("Logout error:", err);
    }
    router.replace("/login");
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
        {/* Mobile Search Sheet */}
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden  h-9 w-9">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="h-[200px]">
            <SheetHeader>
              <SheetTitle>Search</SheetTitle>
            </SheetHeader>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8"
                autoFocus
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Business switcher */}
        <div className="md:mr-2 mr-1">
          <AccountSwitcher
            accounts={linkedAccounts}
            onSwitch={handleBusinessSwitch}
            onSignOut={handleLogout}
          />
        </div>

      {/* Notification and message icon */}
      <div className="flex items-center md:gap-3 gap-4">
        <button
          onClick={() => router.push("/notifications")}
          className="bg-[#FEF2EE] rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold text-red-600 hover:bg-orange-100 transition-colors relative z-0"
        >
          <Bell className="w-5 h-5 z-0" />
          {unreadData && unreadData.count > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadData.count > 99 ? "99+" : unreadData.count}
            </span>
          )}
        </button>

        {/* Message icon */}
        <Button
          onClick={() => setIsMessagingOpen(true)}
          variant="ghost"
          // size="icon"
          className="bg-[#FEF2EE] rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold text-red-600 hover:bg-orange-100 transition-colors relative z-0"
        >
          {totalUnreadCount! > 0 &&
            <div className="absolute top-1 right-1 text-[10px] bg-[#FF6900] text-white flex items-center justify-center rounded-full h-4 w-4 ml-2">
              {totalUnreadCount}
            </div>
          }
          <MessageCircleMore className="w-5 h-5" />
          <span className="sr-only">Messages</span>
        </Button>

        {isMessagingOpen &&
          <MessagingModal
            onClose={handleCloseMessagingModal}
          />}

      </div>

        {isMessagingOpen &&
          <MessagingModal
            onClose={handleCloseMessagingModal}
          />}
      </div>
    </header>
  );
}
