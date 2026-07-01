"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDeleteNotification,
  useMarkNotificationAsRead,
} from "@/examples/notification-api-usage";
import { NotificationType } from "@/types/enums";
import type { Notification } from "@/types/notification-types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Check,
  ExternalLink,
  Package,
  Tag,
  Trash2,
  Users,
} from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return Package;
    case NotificationType.EVENT_REMINDER:
      return Calendar;
    case NotificationType.RESERVATION_CONFIRMATION:
      return Users;
    case NotificationType.PROMOTION:
      return Tag;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return "text-blue-600";
    case NotificationType.EVENT_REMINDER:
      return "text-green-600";
    case NotificationType.RESERVATION_CONFIRMATION:
      return "text-purple-600";
    case NotificationType.PROMOTION:
      return "text-orange-600";
    default:
      return "text-gray-600";
  }
};

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER_UPDATE:
      return "Order Update";
    case NotificationType.EVENT_REMINDER:
      return "Event Reminder";
    case NotificationType.RESERVATION_CONFIRMATION:
      return "Reservation";
    case NotificationType.PROMOTION:
      return "Promotion";
    case NotificationType.GENERAL:
      return "General";
    default:
      return "Notification";
  }
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();

  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  const handleMarkAsRead = () => {
    markAsRead.mutate(notification.id);
  };

  const handleDelete = () => {
    deleteNotification.mutate(notification.id);
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md overflow-hidden ${
        !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4 min-w-0">
          {/* Icon */}
          <div
            className={`flex-shrink-0 p-2 rounded-full bg-gray-100 ${iconColor}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-col gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4
                    className={`text-sm font-medium break-words ${
                      !notification.isRead ? "font-semibold" : ""
                    }`}
                  >
                    {notification.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-xs whitespace-nowrap"
                  >
                    {getTypeLabel(notification.type)}
                  </Badge>
                  {!notification.isRead && (
                    <Badge
                      variant="default"
                      className="text-xs bg-primary whitespace-nowrap"
                    >
                      New
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-sm text-muted-foreground break-words ${
                    !notification.isRead ? "text-foreground" : ""
                  }`}
                >
                  {notification.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-1 mt-2 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {notification.actionUrl && (
                    <Link
                      href={notification.actionUrl.replace(/^\/business/, "")}
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline whitespace-nowrap"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    disabled={markAsRead.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteNotification.isPending}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
