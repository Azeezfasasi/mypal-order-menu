"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnreadNotificationCount } from "@/examples/notification-api-usage";
import { AlertCircle, Bell, CheckCircle, Clock } from "lucide-react";

export function NotificationStats() {
  const unreadCount = useUnreadNotificationCount();

  const stats = [
    {
      title: "Total Notifications",
      value: "0", // This would come from API
      icon: Bell,
      description: "All time notifications",
      color: "text-blue-600",
    },
    {
      title: "Unread",
      value: unreadCount.toString(),
      icon: AlertCircle,
      description: "Require attention",
      color: "text-red-600",
    },
    {
      title: "Read Today",
      value: "0", // This would come from API
      icon: CheckCircle,
      description: "Marked as read",
      color: "text-green-600",
    },
    {
      title: "Pending Actions",
      value: "0", // This would come from API
      icon: Clock,
      description: "Awaiting response",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-4 md:grid-cols-2 sm:grid-cols-1 overflow-x-hidden">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium break-words">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 flex-shrink-0 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{stat.value}</div>
            <p className="text-xs text-muted-foreground break-words">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
