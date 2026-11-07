"use client";

// Web push registration for business devices (owner and team members).
// The backend sends every business alert to every registered device, so each
// browser must register on every load and remove itself on logout.

import { deleteFcmToken, requestNotificationPermission } from "@/config/firebase";
import { registerDeviceToken, removeDeviceToken } from "@/services/api/notification-api";
import { Platform } from "@/types/enums";
import { forgetPushToken, getRememberedPushToken, rememberPushToken } from "./push-token-storage";

/** "Chrome on Android (installed app)" — shown to support in the admin diagnostics */
export const describeDevice = (): string => {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  const installed =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  return `${browser} on ${os}${installed ? " (installed app)" : ""}`;
};

const notificationsGranted = () =>
  typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted";

const statusOf = (error: unknown) => (error as { status?: number })?.status;

const register = (token: string) =>
  registerDeviceToken({ token, platform: Platform.WEB, deviceInfo: describeDevice() });

let inFlight: Promise<string | null> | null = null;

/**
 * Registers this browser for the logged-in account. Safe to call on every
 * load: registering the same token again just reactivates it, and a token that
 * Firebase rotated is picked up because getToken() returns the current one.
 *
 * Without `prompt` it never asks for permission (browsers — and iOS PWAs —
 * only allow the prompt from a user tap), so it does nothing until granted.
 */
export const registerThisDevice = ({ prompt = false } = {}): Promise<string | null> => {
  if (!prompt && !notificationsGranted()) return Promise.resolve(null);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const token = await requestNotificationPermission();
    if (!token) return null;
    try {
      await register(token);
      rememberPushToken(token);
      return token;
    } catch (error) {
      // 400 = Firebase says the token is invalid: get a fresh one and retry once
      if (statusOf(error) === 400) {
        await deleteFcmToken();
        const fresh = await requestNotificationPermission();
        if (!fresh) return null;
        await register(fresh);
        rememberPushToken(fresh);
        return fresh;
      }
      // Network or server error: the next app load tries again
      throw error;
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
};

/**
 * Removes this browser from push for the current account. Call it BEFORE the
 * session is cleared (the request needs the JWT). Never throws, and gives up
 * after a few seconds so logout isn't held up by a slow network.
 */
export const unregisterThisDevice = async (): Promise<void> => {
  const token =
    getRememberedPushToken() || (typeof window !== "undefined" ? window.__registeredFCMToken : null);
  if (!token) return;

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
  await Promise.race([
    (async () => {
      try {
        await removeDeviceToken(token);
      } catch (err) {
        console.warn("Removing this device from push failed:", err);
      }
      await deleteFcmToken();
    })(),
    timeout,
  ]);
  forgetPushToken();
};

/**
 * Where a notification should open in this app. FCM data values are all
 * strings and missing keys mean "not set". The backend's actionUrl is a
 * relative backend path (e.g. /business/reservations/…) that isn't a page
 * here, so route on the event and ids instead.
 *
 * Keep in sync with notificationPath() in public/sw.js.
 */
export const notificationPath = (data: Record<string, unknown> | undefined | null): string => {
  const d = (data ?? {}) as Record<string, string | undefined>;
  switch (d.event) {
    case "NEW_MOBILITY_BOOKING":
      return d.bookingId ? `/mobility/bookings/${d.bookingId}` : "/mobility/bookings";
    case "NEW_TICKET_PURCHASE":
      return "/events";
    case "NEW_RESERVATION":
    case "GUEST_CANCELLED":
      if (d.category === "FINE_DINING") return "/menu/reservations";
      if (d.category === "ACCOMMODATION") return "/reservation-availability";
      return "/notifications";
    case "COURIER_CANCELLED":
      return d.orderId ? `/orders/${d.orderId}` : "/orders";
    default:
      // New orders, rider updates, scheduled orders… carry an orderId
      return d.orderId ? `/orders/${d.orderId}` : "/notifications";
  }
};
