"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { NightlifeApi } from "@/services/api/nightlife-service";
import {
  Clock,
  Loader2,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardMetrics {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  trend: "up" | "down";
  cardIcon: string;
}

interface UpcomingEvent {
  id: string;
  name: string;
  date: string;
  ticketsSold: number;
  totalTickets: number;
  image?: string;
  percentage: number;
}

interface ReservationItem {
  id: string;
  guestName: string;
  time: string;
  partySize: number;
  status: "Confirmed" | "Pending" | "Cancelled";
  type: "bar" | "lounge";
}

export default function BarsLoungeDashboard() {
  const { user: business } = useAuth();

  // Fetch reservations and events
  const reservationsQuery = NightlifeApi.useGetReservations();
  const eventsQuery = NightlifeApi.useGetEvents();

  // Transform events to upcoming events format
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    if (!eventsQuery.data?.data) return [];
    return eventsQuery.data.data.slice(0, 3).map((event) => {
      const ticketsSold = Math.floor(Math.random() * 1500) + 500;
      const totalTickets = 2000;
      const percentage = Math.round((ticketsSold / totalTickets) * 100);
      return {
        id: event.id,
        name: event.event_title,
        date: new Date(event.start_date).toLocaleDateString(),
        ticketsSold,
        totalTickets,
        image: event.images?.[0],
        percentage,
      };
    });
  }, [eventsQuery.data?.data]);

  // Transform reservations to reservation items
  const reservationItems: ReservationItem[] = useMemo(() => {
    if (!reservationsQuery.data?.data) return [];
    return reservationsQuery.data.data.slice(0, 5).map((reservation) => ({
      id: reservation.id,
      guestName: reservation.guestName,
      time: new Date(reservation.reservationTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      partySize: reservation.partySize,
      status:
        (reservation.status.charAt(0).toUpperCase() +
          reservation.status.slice(1)) as
          | "Confirmed"
          | "Pending"
          | "Cancelled",
      type: reservation.type,
    }));
  }, [reservationsQuery.data?.data]);

  // Demo data for events
  const demoEvents: UpcomingEvent[] = [
    {
      id: "1",
      name: "Afrobeats Festival",
      date: "Dec 24, 2024, 6:00 PM",
      ticketsSold: 1560,
      totalTickets: 2000,
      percentage: 78,
    },
    {
      id: "2",
      name: "Street Bash",
      date: "Dec 24, 2024, 6:00 PM",
      ticketsSold: 640,
      totalTickets: 2000,
      percentage: 32,
    },
    {
      id: "3",
      name: "New Year Shutdown",
      date: "Dec 24, 2024, 6:00 PM",
      ticketsSold: 320,
      totalTickets: 2000,
      percentage: 16,
    },
  ];

  // Calculate metrics from data
  const metrics: DashboardMetrics[] = useMemo(() => {
    const confirmedReservations =
      reservationsQuery.data?.data?.filter((r) => r.status === "confirmed")
        .length || 86;
    const upcomingEventsCount = eventsQuery.data?.data?.length || 6;

    return [
      {
        title: "Total Revenue",
        value: "₦7,842,500",
        change: 24.3,
        icon: <TrendingUp className="w-6 h-6" />,
        bgColor: "bg-white",
        textColor: "text-#031927",
        trend: "up",
        cardIcon: "/images/statimg1.svg",
      },
      {
        title: "Reservations Today",
        value: confirmedReservations,
        change: 24.3,
        icon: <Users className="w-6 h-6" />,
        bgColor: "bg-white",
        textColor: "text-#031927",
        trend: "up",
        cardIcon: "/images/statimg2.svg",
      },
      {
        title: "Tickets Sold Today",
        value: "1,240",
        change: 18.6,
        icon: <Zap className="w-6 h-6" />,
        bgColor: "bg-white",
        textColor: "text-#031927",
        trend: "up",
        cardIcon: "/images/statimg3.svg",
      },
      {
        title: "Upcoming Events",
        value: upcomingEventsCount,
        change: 24.3,
        icon: <Clock className="w-6 h-6" />,
        bgColor: "bg-white",
        textColor: "text-#031927",
        trend: "up",
        cardIcon: "/images/statimg4.svg",
      },
    ];
  }, [reservationsQuery.data?.data, eventsQuery.data?.data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white">
        <div className="flex flex-row md:flex-col items-center justify-between p-6 md:p-0 max-w-7xl mx-auto">
          <div>
            <h1 className="text-[24px] leading-[100%] font-bold text-gray-900">
              Good morning, {business?.business_name || "John"}! 👋
            </h1>
            <p className="text-[16px] font-semibold text-[#68798A] leading-[100%] mt-1">
              Here&apos;s what&apos;s happening with your lounges today.
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm rounded-[5px] text-gray-600 bg-gray-50 px-[10px] py-2 border boder-[#DBDBDB]">
              📅 May 18 - May 24, 2024 <Image src="/images/calendardot.svg" width={24} height={24}alt=""/>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#DB3A07] hover:bg-orange-700 text-white gap-2 py-[8px] px-[12px] outline-none border border-[#DB3A07]">
                  <Plus className="w-4 h-4" />
                  Create New
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/events/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    📅 Create Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/reservations/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    🎟️ Add Ticketing & Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/offers/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    🎁 Add Offer / Deal
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/menu/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    🍽️ Add Menu Item
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/lounges/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    🛋️ Add Lounge
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/campaigns/create"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    📢 Create Campaign
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-0 md:mt-10 max-w-7xl mx-auto space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-6 md:grid-cols-2 sm:grid-cols-1">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className={`${metric.bgColor} flex bg-white rounded-[10px] overflow-hidden border border-[#DBDBDB] pl-3`}
            >
              <div className="flex items-center justify-between mb-4">
                <Image
                  src={metric.cardIcon}
                  alt="Metrics Icon"
                  width={38}
                  height={38}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`text-sm font-medium ${
                      metric.textColor === "text-[#363C44] font-medium text-[16px] leading-[145%]"
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    {metric.title}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h2
                      className={`text-[24px] font-bold ${metric.textColor} text-[#031927] leading-[100%] mb-2`}
                    >
                      {metric.value}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>{metric.change}% vs last 7 days</span>
                    </div>
                  </div>
                  <div className={metric.textColor}>{metric.icon}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events and Overview */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 p-6 border-b flex flex-row gap-3 md:flex-col items-center justify-between">
                <h3 className="text-[16px] leading-[100%] font-semibold text-[#031927]">
                  Upcoming Events
                </h3>
                <Link
                  href="/events"
                  className="text-[16px] leading-[100%] font-semibold text-[#DB3A07] hover:text-orange-700"
                >
                  View all →
                </Link>
              </div>
              <div className="md:p-0 space-y-4">
                {eventsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (upcomingEvents.length > 0 ? upcomingEvents : demoEvents).map((event) => (
                    <div key={event.id} className="rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center md:flex-col gap-4">
                        <div className="flex-shrink-0">
                          {event.image ? (
                            <Image
                              src={event.image}
                              alt={event.name}
                              width={74}
                              height={54}
                              className="rounded object-cover w-[74px] h-[54px]"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold">
                              🎉
                            </div>
                          )}
                        </div>
                        <div className="w-full flex md:flex-col items-center justify-between lex-grow">
                          <div>
                            <h4 className="text-[16px] md:text-center leading-[100%] font-semibold text-[#031927]">
                            {event.name}
                            </h4>
                            <p className="text-[13.51px] font-normal leading-[36.33px] text-[#68798A] mt-1">
                              📅 {event.date}
                            </p>
                          </div>
                          <div className="mt-0">
                            <div className="w-full flex items-center gap-6 justify-between mb-2">
                              <span className="text-[24px] leading-[12.78px] font-semibold text-[#031927]">
                                {event.percentage}%
                              </span>
                              <p className="flex justify-end text-[14px] text-right font-normal leading-[20px] text-[#68798A] mt-2">
                                {event.ticketsSold} / {event.totalTickets}
                              </p>
                            </div>
                            <p className="text-[12px] text-right font-normal leading-[20px] text-[#68798A] mt-2">
                              Tickets Sold
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${event.percentage}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Today's Overview */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between g-gray-50 p-6 border-b">
              <h3 className="text-[16px] leading-[100%] font-semibold text-[#031927]">
                Today&apos;s Overview
              </h3>
              <div className="text-[14px] leading-[100%] font-semibold text-[#DB3A07]">
                🔴 Live
              </div>
            </div>
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-[12px] font-normal text-[#031927] flex items-center gap-2">
                  👥 Check-ins
                </span>
                <span className="text-[14px] leading-[12px] font-normal text-[#031927]">54</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-[12px] font-normal text-[#031927] flex items-center gap-2">
                  ⏳ Pending Reservations
                </span>
                <span className="text-[14px] leading-[12px] font-normal text-[#031927]">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-[12px] font-normal text-[#031927] flex items-center gap-2">
                  🚶 Walk-ins
                </span>
                <span className="text-[14px] leading-[12px] font-normal text-[#031927]">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-[12px] font-normal text-[#031927] flex items-center gap-2">
                  🪑 Tables Occupied
                </span>
                <span className="text-[14px] leading-[12px] font-normal text-[#031927]">26</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] leading-[12px] font-normal text-[#031927] flex items-center gap-2">
                  ❌ Cancelled
                </span>
                <span className="text-[14px] leading-[12px] font-normal text-[#031927]">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reservations and Orders Section */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
          {/* Today's Reservations */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-[16px] leading-[100%] font-semibold text-[#031927]">
                Today&apos;s Reservations
              </h3>
              <div className="text-[14px] leading-[100%] font-semibold text-[#DB3A07]">
                View All
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservationsQuery.isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </td>
                    </tr>
                  ) : (
                    (reservationItems.length > 0
                      ? reservationItems
                      : [
                          {
                            id: "1",
                            guestName: "James Okofor",
                            time: "7:00 PM",
                            partySize: 4,
                            status: "Confirmed" as const,
                            type: "bar",
                          },
                          {
                            id: "2",
                            guestName: "Sarah Johnson",
                            time: "7:30 PM",
                            partySize: 2,
                            status: "Pending" as const,
                            type: "lounge",
                          },
                          {
                            id: "3",
                            guestName: "Daniel Williams",
                            time: "8:00 PM",
                            partySize: 6,
                            status: "Confirmed" as const,
                            type: "bar",
                          },
                          {
                            id: "4",
                            guestName: "Emeka Uche",
                            time: "8:30 PM",
                            partySize: 3,
                            status: "Pending" as const,
                            type: "lounge",
                          },
                          {
                            id: "5",
                            guestName: "Ayomide Ayo",
                            time: "9:00 PM",
                            partySize: 5,
                            status: "Confirmed" as const,
                            type: "bar",
                          },
                        ]
                    ).map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {item.guestName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.time}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.partySize} Guests
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between p-6 md:p-5 border-b">
              <h3 className="text-[16px] leading-[100%] font-semibold text-[#031927]">Recent Orders</h3>
              <div className="text-[14px] leading-[100%] font-semibold text-[#DB3A07]">
                View All
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                {[
                  {
                    name: "Table 12 · James Okofor",
                    items: "Jollof Rice, Chicken, Drinks",
                    status: "Preparing",
                    time: "10 mins ago",
                    amount: "₦45,000",
                  },
                  {
                    name: "Table 17 · Sarah Johnson",
                    items: "Mojito Cocktails, Limbs",
                    status: "Ready",
                    time: "10 mins ago",
                    amount: "₦32,500",
                  },
                  {
                    name: "VIP 3 · Daniel Williams",
                    items: "Premium Bucket, Platter",
                    status: "Preparing",
                    time: "10 mins ago",
                    amount: "₦120,000",
                  },
                  {
                    name: "Table 15 · Ayomide Ayo",
                    items: "Chicken Wings, Beer Bucket",
                    status: "New",
                    time: "10 mins ago",
                    amount: "₦120,000",
                  },
                  {
                    name: "Table 15 · Ayomide Ayo",
                    items: "Chicken Wings, Beer Bucket",
                    status: "New",
                    time: "10 mins ago",
                    amount: "₦120,000",
                  },
                ].map((order, idx) => (
                  <div key={idx} className="flex flex-row md:flex-col items-center justify-between gap-4 border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-row md:flex-col items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex flex-row md:flex-col items-center justify-center text-xl">
                        🍽️
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.name}
                        </p>
                        <p className="text-xs text-gray-600">{order.items}</p>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "Ready"
                            ? "bg-green-100 text-green-800"
                            : order.status === "New"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-600">
                        {order.time}
                      </span>
                      <span className="text-sm font-bold text-gray-900 min-w-24 text-right">
                        {order.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
