"use client";

import { DeviceTokenManager } from "@/components/notifications/device-token-manager";
import { NotificationFilters } from "@/components/notifications/notification-filters";
import { NotificationList } from "@/components/notifications/notification-list";

import { NotificationStats } from "@/components/notifications/notification-stats";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarkAllNotificationsAsRead,
  useUnreadNotificationCount,
  useUserNotifications,
} from "@/examples/notification-api-usage";
import { NotificationType } from "@/types/enums";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<NotificationType | "all">(
    "all",
  );

  // Get unread count
  const unreadCount = useUnreadNotificationCount();

  // Get notifications based on active tab
  const { notifications, pagination, isLoading } = useUserNotifications(
    currentPage,
    10,
  );

  // Mark all as read mutation
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTypeFilter = (type: NotificationType | "all") => {
    setSelectedType(type);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header (desktop-first) */}
      <div className="flex flex-col sm:flex-col gap-4">
        <div className="flex flex-col sm:flex-col gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <Bell className="h-8 w-8 text-primary" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-xl font-bold tracking-tight break-words">
                Notifications
              </h1>
              <p className="text-muted-foreground text-sm break-words">
                Stay updated with your business activities and customer
                interactions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending || unreadCount === 0}
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Responsive content (desktop-first): main area + right sidebar */}
      <div className="grid gap-6 overflow-x-hidden">
        {/* Left / Main column - spans 2 columns on desktop, stacks on small screens */}
        <div className="col-span-2 lg:col-span-1 space-y-6 min-w-0">
          {/* Stats Cards */}
          <NotificationStats totalCount={pagination.total} notifications={notifications} />

          {/* Device Token Manager */}
          <DeviceTokenManager />

          {/* Main Content */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col sm:flex-col gap-3">
                <CardTitle className="break-words">
                  Recent Notifications
                </CardTitle>
                <NotificationFilters
                  selectedType={selectedType}
                  onTypeChange={handleTypeFilter}
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* desktop-first: enable horizontal scroll on smaller screens (lg: is max-width) */}
                <div className="overflow-x-auto -mx-4 px-4 sm:-mx-2 sm:px-2">
                  <TabsList className="inline-flex w-auto gap-2 mb-2">
                    <TabsTrigger value="all" className="whitespace-nowrap">
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="order_update"
                      className="whitespace-nowrap"
                    >
                      Orders
                    </TabsTrigger>
                    {/* <TabsTrigger
                      value="event_reminder"
                      className="whitespace-nowrap"
                    >
                      Events
                    </TabsTrigger>
                    <TabsTrigger
                      value="reservation_confirmation"
                      className="whitespace-nowrap"
                    >
                      Reservations
                    </TabsTrigger>
                    <TabsTrigger
                      value="promotion"
                      className="whitespace-nowrap"
                    >
                      Promotions
                    </TabsTrigger>
                    <TabsTrigger value="general" className="whitespace-nowrap">
                      General
                    </TabsTrigger>
                    */}
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-6">
                  <NotificationList
                    notifications={notifications}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="order_update" className="mt-6">
                  <NotificationList
                    notifications={notifications.filter(
                      (n) => n.type === NotificationType.ORDER_UPDATE,
                    )}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="event_reminder" className="mt-6">
                  <NotificationList
                    notifications={notifications.filter(
                      (n) => n.type === NotificationType.EVENT_REMINDER,
                    )}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="reservation_confirmation" className="mt-6">
                  <NotificationList
                    notifications={notifications.filter(
                      (n) =>
                        n.type === NotificationType.RESERVATION_CONFIRMATION,
                    )}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="promotion" className="mt-6">
                  <NotificationList
                    notifications={notifications.filter(
                      (n) => n.type === NotificationType.PROMOTION,
                    )}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>

                <TabsContent value="general" className="mt-6">
                  <NotificationList
                    notifications={notifications.filter(
                      (n) => n.type === NotificationType.GENERAL,
                    )}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
