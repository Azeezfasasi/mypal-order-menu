"use client";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { NotificationWelcomeModal } from "@/components/notifications/notification-welcome-modal";
import ProtectedRoute from "@/components/protected-route";
import SafeNotificationWrapper from "@/components/safe-notification-wrapper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNotificationWelcome } from "@/hooks/useNotificationWelcome";
import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMediaQuery("(max-width: 1023px)");


  // Notification welcome modal
  const { showWelcomeModal, handleEnableNotifications, handleClose } =
    useNotificationWelcome();

  // Set sidebar state based on screen size
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <ProtectedRoute>

      <div className="min-h-[100svh] flex flex-col w-full overflow-hidden">
        {/* Main wrapper with sidebar and content */}
        <div className="flex-1 flex relative w-full">
          {/* Sidebar - Only render when needed */}
          {(!isMobile || sidebarOpen) && (
            <aside
              className={cn(
                "transition-all duration-300",
                // Mobile: overlay with fixed positioning
                isMobile
                  ? "fixed inset-y-0 left-0 z-50"
                  : "relative flex-shrink-0",
                // Width management
                isMobile ? "w-64" : sidebarOpen ? "w-64" : "w-16",
              )}
            >
              <DashboardSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                isMobile={isMobile}
              />
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen">
            {/* Header - Fixed position */}
            <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <DashboardHeader
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              />
            </header>

            {/* Content - Scrollable */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6">{children}</div>
            </main>
          </div>
        </div>

        {/* Notification Components with Error Boundary */}
        <SafeNotificationWrapper>
          <NotificationWelcomeModal
            isOpen={showWelcomeModal}
            onEnableNotifications={handleEnableNotifications}
            onClose={handleClose}
          />
          <NotificationBanner />
        </SafeNotificationWrapper>
      </div>
    </ProtectedRoute>
  );
}
