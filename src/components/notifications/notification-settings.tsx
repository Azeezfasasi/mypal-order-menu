"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { NotificationType } from "@/types/enums";
import { Bell, Mail, Smartphone } from "lucide-react";
import { useState } from "react";

interface NotificationPreference {
  type: NotificationType;
  label: string;
  description: string;
  push: boolean;
  email: boolean;
  inApp: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: NotificationType.ORDER_UPDATE,
      label: "Order Updates",
      description: "Notifications about new orders and order status changes",
      push: true,
      email: true,
      inApp: true,
    },
    {
      type: NotificationType.EVENT_REMINDER,
      label: "Event Reminders",
      description: "Reminders for upcoming events and deadlines",
      push: true,
      email: false,
      inApp: true,
    },
    {
      type: NotificationType.RESERVATION_CONFIRMATION,
      label: "Reservation Confirmations",
      description: "Confirmations and updates for reservations",
      push: true,
      email: true,
      inApp: true,
    },
    {
      type: NotificationType.PROMOTION,
      label: "Promotions & Offers",
      description: "Special offers and promotional notifications",
      push: false,
      email: true,
      inApp: true,
    },
    {
      type: NotificationType.GENERAL,
      label: "General Notifications",
      description: "General updates and announcements",
      push: false,
      email: false,
      inApp: true,
    },
  ]);

  const updatePreference = (
    type: NotificationType,
    channel: "push" | "email" | "inApp",
    value: boolean,
  ) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.type === type ? { ...pref, [channel]: value } : pref,
      ),
    );
  };

  const toggleAllForChannel = (
    channel: "push" | "email" | "inApp",
    value: boolean,
  ) => {
    setPreferences((prev) =>
      prev.map((pref) => ({ ...pref, [channel]: value })),
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "push":
        return <Smartphone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case "push":
        return "Push";
      case "email":
        return "Email";
      case "inApp":
        return "In-App";
      default:
        return channel;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notification Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          {/* desktop-first: 3 columns on desktop, stack to 1 at md (max-width) */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
            {["push", "email", "inApp"].map((channel) => (
              <div
                key={channel}
                className="flex items-center justify-between p-3 border rounded-lg min-w-0"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {getChannelIcon(channel)}
                  <Label className="text-sm font-medium truncate">
                    {getChannelLabel(channel)}
                  </Label>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleAllForChannel(
                        channel as "push" | "email" | "inApp",
                        true,
                      )
                    }
                    className="whitespace-nowrap"
                  >
                    All On
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleAllForChannel(
                        channel as "push" | "email" | "inApp",
                        false,
                      )
                    }
                    className="whitespace-nowrap"
                  >
                    All Off
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Individual Preferences */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Types</h4>
          <div className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.type} className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{pref.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {pref.description}
                  </p>
                </div>
                {/* desktop-first: 3 columns on desktop, stack to 1 on smaller screens */}
                <div className="grid grid-cols-3 md:grid-cols-1 gap-4 pl-4">
                  {["push", "email", "inApp"].map((channel) => (
                    <div
                      key={channel}
                      className="flex items-center justify-between  md:items-start md:space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        {getChannelIcon(channel)}
                        <Label className="text-sm">
                          {getChannelLabel(channel)}
                        </Label>
                      </div>
                      <div className="md:mt-2">
                        <Switch
                          checked={
                            pref[channel as keyof typeof pref] as boolean
                          }
                          onCheckedChange={(value) =>
                            updatePreference(
                              pref.type,
                              channel as "push" | "email" | "inApp",
                              value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {preferences.indexOf(pref) < preferences.length - 1 && (
                  <Separator />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button>Save Preferences</Button>
        </div>
      </CardContent>
    </Card>
  );
}
