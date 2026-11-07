"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { registerThisDevice } from "@/lib/push-notifications";
import { markNotificationAsRead } from "@/services/api/notification-api";
import { notificationQueryKeys } from "@/services/notification-query-keys";
import { useAuthStore } from "@/stores/auth-store";

type ServiceWorkerPushMessage =
  | { type: "PUSH_RECEIVED" }
  | { type: "NOTIFICATION_CLICK"; path?: string; notificationId?: string };

/**
 * Keeps this browser registered for push and reacts to pushes while the app
 * is open. The service worker always shows the system notification itself
 * (iOS requires one for every push), so this only refreshes the inbox and
 * handles clicks on a notification when a tab is already open.
 */
export function PushNotificationListener() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const businessId = useAuthStore((s) => s.business?.id);

  // After every login, business switch and app load
  useEffect(() => {
    if (!businessId) return;
    registerThisDevice().catch((err) => console.warn("Push registration will retry on next load:", err));
  }, [businessId]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent<ServiceWorkerPushMessage>) => {
      const message = event.data;
      if (message?.type === "PUSH_RECEIVED") {
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      } else if (message?.type === "NOTIFICATION_CLICK") {
        if (message.notificationId) {
          markNotificationAsRead(message.notificationId)
            .catch(() => undefined)
            .finally(() => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }));
        }
        router.push(message.path || "/notifications");
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient, router]);

  return null;
}
