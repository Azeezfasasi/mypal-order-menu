"use client";

import { MetricCard } from "./metrics-card";

interface MetricsSectionProps {
  todayData: { total: number } | undefined;
  weekData: { total: number } | undefined;
  monthData: { total: number } | undefined;
  loadingToday: boolean;
  loadingWeek: boolean;
  loadingMonth: boolean;
}

export default function MetricsSection({
  todayData,
  weekData,
  monthData,
  loadingToday,
  loadingWeek,
  loadingMonth,
}: MetricsSectionProps) {
  return (
    <div className="grid md:grid-cols-1 gap-6 grid-cols-3">
      <MetricCard
        title="Total customers"
        value={todayData?.total.toString() ?? "0"}
        period="Today"
        isLoading={loadingToday}
      />
      <MetricCard
        title="Total customers"
        value={weekData?.total.toString() ?? "0"}
        period="This week"
        isLoading={loadingWeek}
      />
      <MetricCard
        title="Total customers"
        value={monthData?.total.toString() ?? "0"}
        period="This month"
        isLoading={loadingMonth}
      />
    </div>
  );
}
