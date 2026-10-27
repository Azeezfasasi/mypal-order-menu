"use client";

import { cn } from "@/lib/utils";

// The design's dark cards carry a faint circle pattern
const PATTERN =
  "radial-gradient(circle at 20px 20px, rgba(255,255,255,0.07) 18px, transparent 19px)";

export function DarkStatCards({
  stats,
  isLoading,
}: {
  stats: { label: string; value: number }[];
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-5 lg:grid-cols-2 md:gap-3">
      {stats.map(({ label, value }, index) => (
        <div
          key={label}
          className={cn(
            "flex h-32 flex-col justify-center rounded-xl px-5 text-white md:h-28 md:px-4",
            index === 0 ? "bg-[#163257]" : "bg-[#0b1626]"
          )}
          style={{ backgroundImage: PATTERN, backgroundSize: "40px 40px" }}
        >
          <p className="text-sm font-medium text-white/90">{label}</p>
          <p className="mt-2 text-3xl font-bold md:text-2xl">
            {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/20" /> : value}
          </p>
        </div>
      ))}
    </div>
  );
}
