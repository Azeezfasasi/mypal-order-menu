'use client';

import { InsightsResponse } from "@/types/table-management-types";
import { CalendarDays, Calendar, TrendingDown, Bell } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type StatCard = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
};

const StatsOverview = ({ data }: { data: InsightsResponse }) => {

  const [openAlertsModal, setOpenAlertsModal] = useState(false);

  const peakDay = data.peak_day.split(' ')[0]
  const peakDayPercent = data.peak_day.split(' ')[1]

  const weakAverage = data.weak_average;


  const stats: StatCard[] = [
    {
      title: "Peak day",
      value: peakDay,
      subtitle: `${peakDayPercent} occupancy`,
      icon: <CalendarDays size={16} />,
    },
    {
      title: "Weak average",
      value: weakAverage,
      subtitle: "across all slots",
      icon: <Calendar size={16} />,
    },
    {
      title: "Lowest",
      value: "- -",
      subtitle: "- -",
      icon: <TrendingDown size={16} />,
    },
  ];

  return (
    <div className="grid grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 p-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <span className="p-2 rounded-full bg-orange-100 text-orange-500">
              {stat.icon}
            </span>
            <span>{stat.title}</span>
          </div>

          {/* Value */}
          <div className="text-lg font-semibold text-gray-900">
            {stat.value}
          </div>

          {/* Subtitle */}
          <div className="text-sm text-gray-500 mt-1">
            {stat.subtitle}
          </div>
        </div>
      ))}

      <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <span className="p-2 rounded-full bg-orange-100 text-orange-500">
            <Bell size={16} />
          </span>
          <span>Alerts</span>
        </div>

        {/* Value */}
        <div className="text-lg font-semibold text-gray-900">
          {data.alerts.length}
        </div>

        {/* Subtitle + Link */}
        <div className="text-sm text-gray-500 mt-1">
          {data.alerts.length > 0 ? (
            <>
              <button
                onClick={() => setOpenAlertsModal(true)}
                className="text-[#EB5017] font-semibold hover:underline ml-1"
              >
                View alerts
              </button>
            </>
          ) : (
            "No alerts"
          )}
        </div>
      </div>


      <Dialog open={openAlertsModal} onOpenChange={setOpenAlertsModal}>
        <DialogContent className="max-w-[500px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle>All Alerts</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-400 bg-white text-sm text-gray-800"
                >
                  {alert}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No alerts available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatsOverview;