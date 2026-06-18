import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: React.ReactNode;
  number: number;
  label: string;
  subtext?: string;
  subtextColor?: "orange" | "green" | "red" | "blue";
  subtextIcon?: React.ReactNode;
  bgColor: string;
}

export function StatsCard({
  icon,
  number,
  label,
  subtext,
  subtextIcon,
  subtextColor = "orange",
  bgColor,
}: StatsCardProps) {
  const subtextColorMap = {
    orange: "#FDF8F5",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500",
  };

  return (
    <div className={cn("p-2.5 rounded-[10px]", bgColor)}>
      <div className="flex flex-col items-start gap-3">
        <div className="">{icon}</div>
        <div>
          <div className="text-[24px] leading-6.5 text-[#031927] font-extrabold">{number}</div>
          <div className="text-[14px] font-semibold leading-6.5 text-[#363C44]">{label}</div>
          {subtext && (
            <div className={cn("flex items-center gap-1 text-[12px] leading-5 text-[#EF8429] font-semibold mt-1", subtextColorMap[subtextColor])}>
              {subtextIcon && <span className="mr-1">{subtextIcon}</span>}
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
