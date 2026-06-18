"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/shared/loading-spinner";
import { DeliveryApi } from "@/services/api/delivery-api";
import type {
  DeliveryAnalytics,
  // DeliveryByMonth,
  DeliveryByZone,
} from "@/types/delivery-types";
import { TrendingUp, Package, MapPin, Users, Wallet, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DeliveryAnalytics() {
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = DeliveryApi.useGetDeliveryAnalytics();

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = DeliveryApi.useGetDeliveryStats();

  const analytics = analyticsData?.data as DeliveryAnalytics | undefined;
  const stats = statsData?.data;

  // Debug logging
  console.log("Analytics Query State:", {
    analyticsData,
    analyticsLoading,
    analyticsError: analyticsError?.message,
    statsData,
    statsLoading,
    statsError: statsError?.message,
  });

  if (analyticsError || statsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-semibold text-red-900">Error Loading Analytics</h4>
            <p className="mt-2 text-sm text-red-800">
              {analyticsError?.message || statsError?.message || "Failed to load analytics data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No analytics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  if (analyticsLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader message="Loading delivery analytics" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Total Deliveries */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deliveries</p>
                  <p className="mt-1 text-3xl font-bold text-blue-900">
                    {analytics?.totalDeliveries || 0}
                  </p>
                </div>
                <Package className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </div>

            {/* Revenue */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="mt-1 text-3xl font-bold text-green-900">
                    ₦{(analytics?.revenue || 0).toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-10 w-10 text-green-500 opacity-80" />
              </div>
            </div>

            {/* Active Zones */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Zones</p>
                  <p className="mt-1 text-3xl font-bold text-purple-900">
                    {analytics?.activeZones || 0}
                  </p>
                </div>
                <MapPin className="h-10 w-10 text-purple-500 opacity-80" />
              </div>
            </div>

            {/* Pending Orders */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="mt-1 text-3xl font-bold text-orange-900">
                    {analytics?.pendingOrders || 0}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-500 opacity-80" />
              </div>
            </div>

            {/* Total Riders */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Riders</p>
                  <p className="mt-1 text-3xl font-bold text-indigo-900">
                    {analytics?.totalRiders || 0}
                  </p>
                </div>
                <Users className="h-10 w-10 text-indigo-500 opacity-80" />
              </div>
            </div>

            {/* Active Riders */}
            <div className="rounded-lg border p-4 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Riders</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-900">
                    {analytics?.activeRiders || 0}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-emerald-500 opacity-80" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries by Month Chart */}
      {analytics?.deliveriesByMonth && analytics.deliveriesByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Deliveries by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.deliveriesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "#1F2937" }}
                  formatter={(value) => [value, "Deliveries"]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "1rem" }}
                  iconType="square"
                />
                <Bar 
                  dataKey="count" 
                  fill="#F14A05" 
                  name="Deliveries"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Deliveries by Zone */}
      {analytics?.deliveriesByZone && analytics.deliveriesByZone.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Deliveries by Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.deliveriesByZone.map((item: DeliveryByZone) => (
                <div key={item.zoneId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{item.zone}</span>
                  </div>
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${
                            (item.count /
                              Math.max(
                                ...(analytics?.deliveriesByZone?.map(
                                  (z: DeliveryByZone) => z.count,
                                ) || [1]),
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Statistics */}
      {stats?.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats.totalDeliveries}
                </p>
                <p className="text-xs text-gray-600 mt-1">Total Deliveries</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-900">
                  {stats.stats.deliveredCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">Delivered</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50">
                <p className="text-2xl font-bold text-orange-900">
                  {stats.stats.pendingCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <p className="text-2xl font-bold text-blue-900">
                  {stats.stats.inTransitCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">In Transit</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-900">
                  {stats.stats.cancelledCount}
                </p>
                <p className="text-xs text-gray-600 mt-1">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
