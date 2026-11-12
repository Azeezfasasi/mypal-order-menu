"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Info,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Sparkles,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { PromoterDashboardApi } from "@/services/api/promoter-dashboard-api";
import type { IPromoterMetric } from "@/types/promoter-dashboard-types";

/** Status pill colours from the design (Live = orange, Scheduled = blue) */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-orange-50 text-orange-600",
  live: "bg-orange-50 text-orange-600",
  scheduled: "bg-blue-50 text-blue-600",
  pending: "bg-amber-50 text-amber-700",
  ended: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusStyle = (status?: string) => STATUS_STYLES[(status ?? "").toLowerCase()] ?? "bg-gray-100 text-gray-600";

/** "2026-09-09" → "Sep 9, 2026"; with a time → "Sep 9, 2026 . 6:00 PM" */
const formatEventDate = (value?: string) => {
  if (!value) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return dateOnly ? day : `${day} . ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

const percentWidth = (value?: string) => {
  const n = parseFloat(value ?? "0");
  return `${Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0))}%`;
};

const isNegative = (growth?: string) => (growth ?? "").trim().startsWith("-");

/** Small decorative trend area, rising or falling with the growth figure */
function Sparkline({ color, falling }: { color: string; falling: boolean }) {
  const points = falling ? "0,6 12,10 22,8 34,14 46,12 58,20 70,22" : "0,22 12,18 22,20 34,12 46,14 58,6 70,2";
  const id = `spark-${color.replace("#", "")}-${falling ? "d" : "u"}`;
  return (
    <svg viewBox="0 0 70 24" className="h-7 w-[70px] shrink-0 2xl:w-12" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,24 ${points} 70,24`} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  metric,
  icon: Icon,
  iconClass,
  color,
  hint,
}: {
  title: string;
  value: string;
  metric?: IPromoterMetric;
  icon: LucideIcon;
  iconClass: string;
  color: string;
  hint: string;
}) {
  const falling = isNegative(metric?.growth_vs_last_week);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm text-gray-600">
            {title}
            <span title={hint}>
              <Info className="h-3.5 w-3.5 text-gray-400" />
            </span>
          </p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {metric?.growth_vs_last_week && (
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className={cn("flex items-center gap-1 whitespace-nowrap text-xs", falling ? "text-red-600" : "text-emerald-600")}>
            {falling ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {metric.growth_vs_last_week.replace(/^\+/, "")} <span className="text-gray-500">vs last 7 days</span>
          </p>
          <Sparkline color={color} falling={falling} />
        </div>
      )}
    </div>
  );
}

const ACTIVITY_ICONS: { match: RegExp; icon: LucideIcon; className: string }[] = [
  { match: /ticket/i, icon: Ticket, className: "bg-orange-50 text-orange-600" },
  { match: /post|content/i, icon: Bell, className: "bg-emerald-50 text-emerald-600" },
  { match: /revenue|payment|received/i, icon: BarChart3, className: "bg-violet-50 text-violet-600" },
  { match: /follower/i, icon: Users, className: "bg-blue-50 text-blue-600" },
];

const activityIcon = (text: string) => ACTIVITY_ICONS.find((a) => a.match.test(text)) ?? { icon: Bell, className: "bg-gray-100 text-gray-600" };

/** Design alternates the suggestion styles: green/orange, then purple/blue */
const SUGGESTION_STYLES = [
  { icon: Bell, iconClass: "bg-emerald-50 text-emerald-600", button: "bg-orange-600 hover:bg-orange-700" },
  { icon: TrendingUp, iconClass: "bg-violet-100 text-violet-600", button: "bg-blue-700 hover:bg-blue-800" },
];

/** Event Promoter dashboard (FE-25): sales metrics, top event, suggestions, upcoming events and activity */
export default function EventPromoterDashboard() {
  const { user: business } = useAuth();
  const { data, isLoading, isError, refetch } = PromoterDashboardApi.useGetOverview();
  const [allSuggestions, setAllSuggestions] = useState(false);
  const [allActivity, setAllActivity] = useState(false);
  const overview = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
        Couldn&apos;t load your event dashboard.{" "}
        <button type="button" onClick={() => refetch()} className="font-medium text-orange-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const { metrics, top_performing_event: topEvent } = overview;
  const suggestions = overview.smart_suggestions ?? [];
  const upcoming = overview.upcoming_events ?? [];
  const activity = overview.recent_activity ?? [];
  const shownSuggestions = allSuggestions ? suggestions : suggestions.slice(0, 2);
  const shownActivity = allActivity ? activity : activity.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 md:flex-col md:items-stretch">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-xl">Hi, {business?.business_name || "Promoter"} 👋</h1>
          <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your events today.</p>
        </div>
        <Link
          href="/events?create=event"
          className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Create New Event
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 xl:grid-cols-2 sm:grid-cols-1">
        <MetricCard
          title="Tickets Sold"
          value={Number(metrics?.tickets_sold?.value ?? 0).toLocaleString()}
          metric={metrics?.tickets_sold}
          icon={Ticket}
          iconClass="bg-orange-50 text-orange-600"
          color="#EA580C"
          hint="Tickets sold across all your events"
        />
        <MetricCard
          title="Revenue"
          value={String(metrics?.revenue?.formatted ?? metrics?.revenue?.value ?? "₦0")}
          metric={metrics?.revenue}
          icon={BarChart3}
          iconClass="bg-emerald-50 text-emerald-600"
          color="#059669"
          hint="Ticket revenue across all your events"
        />
        <MetricCard
          title="Conversion Rate"
          value={String(metrics?.conversion_rate?.value ?? "0%")}
          metric={metrics?.conversion_rate}
          icon={TrendingUp}
          iconClass="bg-violet-100 text-violet-600"
          color="#7C3AED"
          hint="Share of event page visits that ended in a ticket purchase"
        />
        <MetricCard
          title="Avg. Order Value"
          value={String(metrics?.avg_order_value?.formatted ?? metrics?.avg_order_value?.value ?? "₦0")}
          metric={metrics?.avg_order_value}
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
          color="#2563EB"
          hint="Average amount spent per ticket order"
        />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-5 xl:grid-cols-1">
        {/* Top Performing Event */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Top Performing Event 🔥</h2>
          {!topEvent ? (
            <p className="py-10 text-center text-sm text-gray-500">No event sales yet. Your best-selling event shows here.</p>
          ) : (
            <div className="flex gap-6 md:flex-col">
              <div className="w-[280px] shrink-0 2xl:w-[200px] md:w-full">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                  {topEvent.flyer_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={topEvent.flyer_url} alt={topEvent.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <Link
                  href="/events"
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-100"
                >
                  View Event Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-xl font-semibold text-gray-900">{topEvent.title}</h3>
                  <span className={cn("rounded-md px-2 py-0.5 text-sm", statusStyle(topEvent.status))}>{topEvent.status}</span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" /> {formatEventDate(topEvent.date)}
                </p>
                {topEvent.location && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{topEvent.location}</span>
                  </p>
                )}
                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-gray-900">{topEvent.tickets_sold_percent}</span>
                    <span className="whitespace-nowrap text-sm text-gray-500">Tickets Sold</span>
                  </p>
                  <span className="whitespace-nowrap text-sm text-gray-500">
                    {topEvent.tickets_sold.toLocaleString()} / {topEvent.total_capacity.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-orange-600" style={{ width: percentWidth(topEvent.tickets_sold_percent) }} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Revenue", topEvent.revenue_formatted],
                    ["Tickets Sold", topEvent.tickets_sold.toLocaleString()],
                    ["Days Left", String(topEvent.days_left)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-lg border border-gray-200 px-2 py-3 text-center">
                      <p className="text-xs text-gray-500 2xl:text-[11px]">{label}</p>
                      <p className="mt-1 whitespace-nowrap text-lg font-semibold text-gray-900 2xl:text-base">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Smart Suggestions */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-gray-900">
              <Sparkles className="h-4 w-4 text-amber-400" /> Smart Suggestions
            </h2>
            {suggestions.length > 2 && (
              <button type="button" onClick={() => setAllSuggestions((v) => !v)} className="text-sm font-medium text-orange-600 hover:underline">
                {allSuggestions ? "Show less" : "View all"}
              </button>
            )}
          </div>
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No suggestions right now.</p>
          ) : (
            <div className="space-y-3">
              {shownSuggestions.map((s, i) => {
                const style = SUGGESTION_STYLES[i % SUGGESTION_STYLES.length];
                const Icon = style.icon;
                return (
                  <div key={s.id} className="flex gap-3 rounded-lg bg-gray-50 p-4">
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", style.iconClass)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{s.title}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{s.description}</p>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => toast.info("Suggestions can't be applied automatically yet. Open the event to make this change.")}
                          className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors", style.button)}
                        >
                          {s.action || "Apply Suggestion"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-5 xl:grid-cols-1">
        {/* Upcoming Events */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/events" className="text-sm font-medium text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No upcoming events.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-4 py-3 md:flex-wrap">
                  <div className="h-20 w-[90px] shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {e.flyer_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.flyer_url} alt={e.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-gray-900">{e.title}</span>
                      <span className={cn("rounded-md px-2 py-0.5 text-xs", statusStyle(e.status))}>{e.status}</span>
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarDays className="h-4 w-4" /> {formatEventDate(e.date)}
                    </p>
                  </div>
                  <div className="w-40 shrink-0 md:w-full">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xl font-medium text-gray-900">{e.percentage_sold}</span>
                      <span className="text-xs text-gray-500">
                        {e.sold_count.toLocaleString()} / {e.total_capacity.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-orange-600" style={{ width: percentWidth(e.percentage_sold) }} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`Options for ${e.title}`} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/events">View in Events</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Activity */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            {activity.length > 4 && (
              <button type="button" onClick={() => setAllActivity((v) => !v)} className="text-sm font-medium text-orange-600 hover:underline">
                {allActivity ? "Show less" : "View all"}
              </button>
            )}
          </div>
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {shownActivity.map((a) => {
                const { icon: Icon, className } = activityIcon(a.text);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", className)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-gray-800">{a.text}</p>
                    <span className="shrink-0 text-xs text-gray-500">{a.timestamp}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
