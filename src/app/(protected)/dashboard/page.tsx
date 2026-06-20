"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { OrdersInProgress } from "@/components/dashboard/orders-in-progress";
import { MealPrepAlert } from "@/components/dashboard/meal-prep-alert";
import { useOrderStats, useActiveOrders } from "@/hooks/use-orders";
import { useAuthStore } from "@/stores/auth-store";
// import { NotificationApi } from "@/services/api/notification-api";
import { AlertCircle, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
// import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useOrderStats();
  const { orders, loading: ordersLoading, error: ordersError } = useActiveOrders();
  const business = useAuthStore((state) => state.business);

  // Check if error is an authorization error
  const isAuthorizationError = (error: string | null) => {
    return error && (error.includes("not authorized") || error.includes("403"));
  };

  const getAuthErrorMessage = (error: string | null) => {
    if (!error) return null;
    // Try to extract the required business types from the error message
    const match = error.match(/Required:\s*(.+?)(?:,|$)/);
    const required = match ? match[1].trim() : "Iconic Delicacies";
    return `You're signed in with the wrong account. Your current account (${business?.category?.name || "this account"}) doesn't have access to this section. Please sign in or switch to an account that has access to ${required}.`;
  };

  return (
    <div className="space-y-6 px-0">
      {/* Loading State */}
      {(statsLoading || ordersLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Loader className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Loading Iconic Delicacy dashboard data...</p>
            <p className="text-xs text-blue-700 mt-1">Fetching from API</p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(statsError || ordersError) && (
        <div className={`border rounded-lg p-4 flex gap-3 ${isAuthorizationError(statsError || ordersError) ? 'bg-yellow-50 border-yellow-400' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isAuthorizationError(statsError || ordersError) ? 'text-yellow-600' : 'text-red-600'}`} />
          <div>
            <p className={`text-sm font-semibold ${isAuthorizationError(statsError || ordersError) ? 'text-yellow-800' : 'text-red-800'}`}>
              {isAuthorizationError(statsError || ordersError) ? 'Account Access Issue' : 'API Error'}
            </p>
            <p className={`md:text-xs text-base ${isAuthorizationError(statsError || ordersError) ? 'text-yellow-700' : 'text-red-700'} mt-1`}>
              {isAuthorizationError(statsError || ordersError) 
                ? getAuthErrorMessage(statsError || ordersError)
                : (statsError || ordersError)
              }
            </p>
          </div>
        </div>
      )}
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          {/* Greetings */}
          <div>
            <h1 className="md:text-[12px] text-[22px] text-[#DB3A07] leading-[100%] font-bold">Good morning, <br /> <span className="text-[#031927] font-extrabold md:text-[16px] text-[20px] leading-[100%]">{business?.business_name || "Guest"}</span> 👋</h1>
            <p className="md:text-[12px] text-[14px] font-bold text-[#68798A] leading-[100%] flex items-center gap-1 mt-1">
              Order Manager
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            </p>
          </div>
        </div>
      </div>

      {/* Live Overview */}
      {!statsLoading && !statsError && stats && (
        <div>
          <h2 className="text-[20px] leading-6.5 font-extrabold text-[#031927] mb-4">Live Overview</h2>

          {/* Search Box */}
          <div className="srelative mb-4 z-0">
            {/* <Image
              width={20}
              height={20}
              src="/images/search.svg"
              alt="Search Icon"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            /> */}
            <Input
              type="search"
              placeholder="Search order id, customer name, item name..."
              className="w-1/2 md:w-full pl-4 py-6 bg-white rounded-[100px] border border-[#E1E3E7] z-0 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stats Grid - 2x2 */}
          <div className="grid grid-cols-4 md:grid-cols-2 gap-3">
            <StatsCard
              icon={
                <Image
                  src="/images/activeorders.svg"
                  alt="Active Orders"
                  width={32}
                  height={32}
                />
              }
              number={stats.activeOrders || 0}
              label="Active Orders"
              subtext={`${stats.newOrders || 0} new`}
              subtextIcon={<Image src="/images/orderarrow.svg" alt="Arrow Up" width={12} height={12} />}
              bgColor="bg-orange-50"
            />
            <StatsCard
              icon={
                <Image
                  src="/images/bike.svg"
                  alt="Riders Incoming"
                  width={32}
                  height={32}
                />
              }
              number={stats.ridersIncoming || 0}
              label="Riders Incoming"
              subtext={stats.ridersETA || "N/A"}
              subtextColor="blue"
              bgColor="bg-blue-50"
            />
            <StatsCard
              icon={
                <Image
                  src="/images/completed.svg"
                  alt="Completed Today"
                  width={32}
                  height={32}
                />
              }
              number={stats.completedToday || 0}
              label="Completed Today"
              subtext={`↑ ${stats.completionRate || 0}%`}
              subtextColor="green"
              subtextIcon={<Image src="/images/completedarrow.svg" alt="Arrow Up" width={12} height={12} />}
              bgColor="bg-green-50"
            />
            <StatsCard
              icon={
                <Image
                  src="/images/clock.svg"
                  alt="Delayed Orders"
                  width={32}
                  height={32}
                />
              }
              number={stats.delayedOrders || 0}
              label="Delayed Orders"
              subtext="View Now"
              subtextColor="red"
              bgColor="bg-red-50"
            />
          </div>
        </div>
      )}

      {/* Meal Prep Alert */}
      <MealPrepAlert
          title="Meal prep is time sensitive!"
          description="Keep an eye on countdowns to avoid delays."
        />

      {!ordersLoading && !ordersError && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <OrdersInProgress orders={orders as any} />
      )}

    </div>
  );
}