// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronDown,
//   Search,
//   MoreVertical,
//   Minus,
//   Plus,
//   Clock,
//   Moon,
//   User,
// } from "lucide-react";
// import Image from "next/image";
// import { useQueryClient } from "@tanstack/react-query";
// import { roomManagementApi } from "@/services/api/room-management-api";
// import { toast } from "sonner";
// import type { RoomManagementStatusResponse, RoomManagementStatusRoom } from "@/services/api/room-management-api";
// import type { BaseApiResponse } from "@/types/api";

// // Types matching your backend data structure
// export interface Room {
//   id: string;
//   entityId: string;
//   entityType: string;
//   name: string;
//   category: string;
//   floor: string;
//   bedType: string;
//   soldCount: number;
//   isAvailable: boolean;
//   inventory: number;
//   pricePerNight: number;
//   maxNights: string; // e.g., "1 — 28 nights"
//   maxGuests: number;
//   minNights: number;
//   imageUrl: string;
// }

// interface DateItem {
//   dayName: string;
//   dateNum: number;
//   year: number;
//   fullDate: string; // YYYY-MM-DD
// }

// // Builds the calendar day strip from an API-style { start_date, end_date } range,
// // mirroring the "Retrieves calendar days grid" endpoint contract.
// function buildDateRange(startDate: string, endDate: string): DateItem[] {
//   const dates: DateItem[] = [];
//   const current = new Date(startDate + "T00:00:00");
//   const end = new Date(endDate + "T00:00:00");

//   while (current <= end) {
//     dates.push({
//       dayName: current
//         .toLocaleDateString("en-US", { weekday: "short" })
//         .toUpperCase(),
//       dateNum: current.getDate(),
//       year: current.getFullYear(),
//       fullDate: current.toISOString().split("T")[0],
//     });
//     current.setDate(current.getDate() + 1);
//   }

//   return dates;
// }

// // Builds every day (1 through 30/31) for the month that `dateStr` falls in,
// // used to populate the "Current week dates" dropdown with the full month.
// function buildMonthDateRange(dateStr: string): DateItem[] {
//   const ref = new Date(dateStr + "T00:00:00");
//   const year = ref.getFullYear();
//   const month = ref.getMonth();
//   const lastDay = new Date(year, month + 1, 0).getDate();

//   const dates: DateItem[] = [];
//   for (let day = 1; day <= lastDay; day++) {
//     const current = new Date(year, month, day);
//     const mm = String(month + 1).padStart(2, "0");
//     const dd = String(day).padStart(2, "0");
//     dates.push({
//       dayName: current
//         .toLocaleDateString("en-US", { weekday: "short" })
//         .toUpperCase(),
//       dateNum: day,
//       year,
//       fullDate: `${year}-${mm}-${dd}`,
//     });
//   }

//   return dates;
// }

// // Formats a YYYY-MM-DD date as "Fri, 26 June" for the section header.
// function formatHeaderDate(dateStr: string): string {
//   const date = new Date(dateStr + "T00:00:00");
//   const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
//   const day = date.getDate();
//   const month = date.toLocaleDateString("en-US", { month: "long" });
//   return `${weekday}, ${day} ${month}`;
// }

// function formatMonthLabel(dateStr: string): string {
//   const date = new Date(dateStr + "T00:00:00");
//   return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
// }

// // Formats a YYYY-MM-DD date as "Fri, 26 June 2026" for the dropdown list.
// function formatDropdownDate(dateStr: string): string {
//   const date = new Date(dateStr + "T00:00:00");
//   return date.toLocaleDateString("en-US", {
//     weekday: "short",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });
// }

// export default function RoomManagement() {
//   const [rooms, setRooms] = useState<Room[]>([]);

//   // These three mirror the endpoint's date / start_date / end_date query params.
//   const [startDate, setStartDate] = useState<string>("2026-06-22");
//   const [endDate, setEndDate] = useState<string>("2026-06-28");
//   const [selectedDate, setSelectedDate] = useState<string>("2026-06-26");

//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All Rooms");

//   const queryClient = useQueryClient();
//   const roomApi = roomManagementApi();

//   const {
//     data: roomStatusData,
//     isLoading: isRoomStatusLoading,
//     error: roomStatusError,
//   } = roomApi.useGetRoomManagementStatus({
//     date: selectedDate,
//     start_date: startDate,
//     end_date: endDate,
//     enabled: !!selectedDate && !!startDate && !!endDate,
//   });

//   const blockRoomStateMutation = roomApi.useBlockRoomState();
//   const updateRoomQuantityMutation = roomApi.useUpdateRoomQuantity();

//   const calendarDays = useMemo(() => {
//     const apiCalendar = roomStatusData?.data?.calendar;
//     if (apiCalendar && apiCalendar.length > 0) {
//       const normalizedCalendar = apiCalendar
//         .filter((day) => day?.date)
//         .map((day) => ({
//           dayName: typeof day?.day_of_week === "string"
//             ? day.day_of_week.toUpperCase()
//             : new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
//           dateNum: day.day_number ?? new Date(day.date + "T00:00:00").getDate(),
//           year: new Date(day.date + "T00:00:00").getFullYear(),
//           fullDate: day.date,
//         }));

//       if (normalizedCalendar.length > 0) {
//         return normalizedCalendar;
//       }
//     }

//     return buildDateRange(startDate, endDate);
//   }, [roomStatusData?.data?.calendar, startDate, endDate]);

//   const categoryOptions = useMemo(() => {
//     const categories = new Set<string>();
//     rooms.forEach((room) => {
//       if (room.category && room.category.trim().length > 0) {
//         categories.add(room.category.trim());
//       }
//     });
//     return ["All Rooms", ...Array.from(categories).sort()];
//   }, [rooms]);

//   useEffect(() => {
//     if (roomStatusData?.data?.rooms && roomStatusData.data.rooms.length > 0) {
//       setRooms(
//         roomStatusData.data.rooms.map((room) => {
//           const normalizedEntityId = room.id?.trim() ?? "";
//           const entityType = "Accommodation";
//           return {
//             id: normalizedEntityId || room.name,
//             entityId: normalizedEntityId,
//             entityType,
//             name: room.name,
//             category: "Standard",
//             floor: String(room.floor ?? ""),
//             bedType: room.bed_type || "",
//             soldCount: room.sold_count ?? 0,
//             isAvailable: typeof room.status === "string"
//               ? room.status.toLowerCase() === "available"
//               : true,
//             inventory: room.inventory_amount ?? 0,
//             pricePerNight: room.price ?? 0,
//             maxNights:
//               room.min_nights && room.max_nights
//                 ? `${room.min_nights} — ${room.max_nights} nights`
//                 : "1 — 28 nights",
//             maxGuests: 1,
//             minNights: room.min_nights ?? 1,
//             imageUrl:
//               "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80",
//           };
//         }),
//       );
//     }
//   }, [roomStatusData]);

//   const invalidateRoomStatus = () => {
//     // Invalidate the exact query for the current date range so React Query
//     // refetches the updated room status. The query used in
//     // `useGetRoomManagementStatus` includes the date/start_date/end_date
//     // segments, so invalidating just ["roomManagement","status"] (exact
//     // match) won't match. Use the full key to ensure the query is invalidated.
//     queryClient.invalidateQueries({
//       queryKey: ["roomManagement", "status", selectedDate, startDate, endDate],
//       exact: true,
//     });
//   };

//   const handleSelectDate = (date: string) => {
//     // If the picked date falls outside the currently visible 7-day strip
//     // (e.g. picked from the full-month dropdown), shift the window so the
//     // strip actually contains — and can highlight — the selected date.
//     if (date < startDate || date > endDate) {
//       const windowStart = new Date(startDate + "T00:00:00");
//       const windowEnd = new Date(endDate + "T00:00:00");
//       const windowDays =
//         Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

//       const newStart = new Date(date + "T00:00:00");
//       const newEnd = new Date(newStart);
//       newEnd.setDate(newEnd.getDate() + (windowDays - 1));

//       setStartDate(newStart.toISOString().split("T")[0]);
//       setEndDate(newEnd.toISOString().split("T")[0]);
//     }

//     setSelectedDate(date);
//     invalidateRoomStatus();
//   };

//   const handleInventoryChange = async (id: string, delta: number) => {
//     const nextRooms = rooms.map((room) =>
//       room.id === id ? { ...room, inventory: Math.max(0, room.inventory + delta) } : room,
//     );
//     setRooms(nextRooms);

//     const updatedRoom = nextRooms.find((room) => room.id === id);
//     if (!updatedRoom || !updatedRoom.entityId) {
//       console.warn("Skipping quantity update because entityId is missing", { id, updatedRoom });
//       return;
//     }

//     const statusKey = ["roomManagement", "status", selectedDate, startDate, endDate];
//     const previousCache = queryClient.getQueryData(statusKey) as
//       | BaseApiResponse<RoomManagementStatusResponse>
//       | undefined;

//     // Optimistically update the cache so the UI shows the new value immediately.
//     try {
//       queryClient.setQueryData(statusKey, (oldData: unknown) => {
//         const old = oldData as BaseApiResponse<RoomManagementStatusResponse> | undefined;
//         if (!old?.data?.rooms) return oldData;
//         const updatedRooms = old.data.rooms.map((r: RoomManagementStatusRoom) =>
//           r.id === updatedRoom.entityId ? { ...r, inventory_amount: updatedRoom.inventory } : r,
//         );
//         return {
//           ...old,
//           data: {
//             ...old.data,
//             rooms: updatedRooms,
//           },
//         } as BaseApiResponse<RoomManagementStatusResponse>;
//       });
//     } catch (e) {
//       // best-effort
//       console.warn("Failed to optimistically update cache:", e);
//     }

//     // Log the outgoing PATCH payload for debugging.
//     console.log('updateRoomQuantity request:', {
//       entity_id: updatedRoom.entityId,
//       entity_type: updatedRoom.entityType || "Accommodation",
//       dates: [selectedDate],
//       quantity_override: updatedRoom.inventory,
//     });

//     updateRoomQuantityMutation.mutate(
//       {
//         entity_id: updatedRoom.entityId,
//         entity_type: updatedRoom.entityType || "Accommodation",
//         dates: [selectedDate],
//         quantity_override: updatedRoom.inventory,
//       },
//       {
//         onSuccess: (res) => {
//           // Log mutation response for debugging.
//           console.log('updateRoomQuantity response:', res);

//           // Reconcile cache with the new value (best-effort) then refetch.
//           try {
//             queryClient.setQueryData(statusKey, (oldData: unknown) => {
//               const old = oldData as BaseApiResponse<RoomManagementStatusResponse> | undefined;
//               if (!old?.data?.rooms) return oldData;
//               const updatedRooms = old.data.rooms.map((r: RoomManagementStatusRoom) =>
//                 r.id === updatedRoom.entityId ? { ...r, inventory_amount: updatedRoom.inventory } : r,
//               );
//               return {
//                 ...old,
//                 data: {
//                   ...old.data,
//                   rooms: updatedRooms,
//                 },
//               } as BaseApiResponse<RoomManagementStatusResponse>;
//             });
//           } catch (e) {
//             console.warn("Failed to reconcile cache after success:", e);
//           }

//           // Start a short persistence check: invalidate+poll a few times to
//           // confirm the backend actually persisted the update. This is a
//           // best-effort client-side workaround for eventual-consistency APIs.
//           (async () => {
//             const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
//             const attempts = 5;
//             const delay = 600; // ms
//             let persisted = false;
//             for (let i = 0; i < attempts; i++) {
//               // trigger a refetch
//               invalidateRoomStatus();
//               await sleep(delay);
//               const latest = queryClient.getQueryData(statusKey) as BaseApiResponse<RoomManagementStatusResponse> | undefined;
//               const found = latest?.data?.rooms?.find((r: RoomManagementStatusRoom) => r.id === updatedRoom.entityId);
//               if (found && found.inventory_amount === updatedRoom.inventory) {
//                 persisted = true;
//                 break;
//               }
//             }

//             if (!persisted) {
//               // Show a user-facing notification with retry action.
//               toast.error("Update not persisted", {
//                 description: "We couldn't confirm the inventory update on the server.",
//                 action: {
//                   label: "Retry",
//                   // Retry will re-run the same mutation with the last payload.
//                   onClick: () => {
//                     updateRoomQuantityMutation.mutate({
//                       entity_id: updatedRoom.entityId,
//                       entity_type: updatedRoom.entityType || "Accommodation",
//                       dates: [selectedDate],
//                       quantity_override: updatedRoom.inventory,
//                     });
//                   },
//                 },
//               });
//               console.warn("Inventory update may not have persisted on server for", updatedRoom.entityId);
//             } else {
//               console.log("Inventory persisted on server for", updatedRoom.entityId);
//             }
//           })();
//         },
//         onError: (err) => {
//           console.error('updateRoomQuantity failed:', err);

//           // Roll back optimistic cache and UI state if we have previous data.
//           if (previousCache) {
//             try {
//               queryClient.setQueryData(statusKey, previousCache as unknown as BaseApiResponse<RoomManagementStatusResponse>);
//             } catch (e) {
//               console.warn('Failed to rollback cache:', e);
//             }

//             try {
//               const prevRooms = previousCache?.data?.rooms;
//               if (Array.isArray(prevRooms)) {
//                 setRooms(prevRooms.map((r: RoomManagementStatusRoom) => ({
//                   id: r.id || r.name,
//                   entityId: r.id,
//                   entityType: 'Accommodation',
//                   name: r.name,
//                   category: 'Standard',
//                   floor: String(r.floor ?? ''),
//                   bedType: r.bed_type || '',
//                   soldCount: r.sold_count ?? 0,
//                   isAvailable: typeof r.status === 'string' ? r.status.toLowerCase() === 'available' : true,
//                   inventory: r.inventory_amount ?? 0,
//                   pricePerNight: r.price ?? 0,
//                   maxNights: r.min_nights && r.max_nights ? `${r.min_nights} — ${r.max_nights} nights` : '1 — 28 nights',
//                   maxGuests: 1,
//                   minNights: r.min_nights ?? 1,
//                   imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80',
//                 })));
//               }
//             } catch (e) {
//               console.warn('Failed to restore rooms state from previous cache:', e);
//             }
//           } else {
//             invalidateRoomStatus();
//           }
//         },
//       },
//     );
//   };

//   // Log server status responses for debugging — helps confirm whether the
//   // backend persisted the mutation or returns stale data.
//   React.useEffect(() => {
//     if (!roomStatusData?.data) return;
//     // Log the full payload with a timestamp.
//     console.log('roomManagement status fetched:', {
//       time: new Date().toISOString(),
//       selectedDate: roomStatusData.data.date ?? selectedDate,
//       rooms: roomStatusData.data.rooms,
//     });

//     // If we recently updated a room, log its inventory specifically.
//     const lux = roomStatusData.data.rooms?.find((r: RoomManagementStatusRoom) => r.id === (rooms[0]?.entityId ?? rooms[0]?.id));
//     if (lux) {
//       console.log('Matched room after fetch:', { id: lux.id, inventory_amount: lux.inventory_amount });
//     }
//     }, [roomStatusData, rooms, selectedDate]);

//   const handleToggleAvailability = async (id: string) => {
//     const prevRooms = rooms;
//     const nextRooms = rooms.map((room) => (room.id === id ? { ...room, isAvailable: !room.isAvailable } : room));
//     setRooms(nextRooms);

//     const toggledRoom = nextRooms.find((room) => room.id === id);
//     if (!toggledRoom || !toggledRoom.entityId) {
//       console.warn("Skipping block update because entityId is missing", { id, toggledRoom });
//       return;
//     }

//     try {
//       await blockRoomStateMutation.mutateAsync({
//         entity_id: toggledRoom.entityId,
//         entity_type: toggledRoom.entityType || "Accommodation",
//         dates: [selectedDate],
//         is_blocked: !toggledRoom.isAvailable,
//       });

//       invalidateRoomStatus();

//       toast.success("Availability updated");
//     } catch (err) {
//       console.error("blockRoomState failed:", err);
//       // Roll back UI
//       setRooms(prevRooms);
//       toast.error("Could not update availability. Please try again.");
//     }
//   };

//   // Shifts the whole visible week forward/backward by 7 days, keeping the
//   // selected date pinned to the same weekday within the new range.
//   const shiftWeek = (days: number) => {
//     const shift = (dateStr: string) => {
//       const d = new Date(dateStr + "T00:00:00");
//       d.setDate(d.getDate() + days);
//       return d.toISOString().split("T")[0];
//     };
//     setStartDate((prev) => shift(prev));
//     setEndDate((prev) => shift(prev));
//     setSelectedDate((prev) => shift(prev));
//   };

//   const [monthMenuOpen, setMonthMenuOpen] = useState(false);

//   const currentMonthDays = useMemo(() => buildMonthDateRange(startDate), [startDate]);

//   const toggleMonthMenu = () => {
//     setMonthMenuOpen((prev) => !prev);
//   };

//   useEffect(() => {
//     if (
//       selectedCategory !== "All Rooms" &&
//       categoryOptions.length > 0 &&
//       !categoryOptions.includes(selectedCategory)
//     ) {
//       setSelectedCategory("All Rooms");
//     }
//   }, [categoryOptions, selectedCategory]);

//   const filteredRooms = rooms.filter((room) => {
//     const matchesSearch = room.name
//       .toLowerCase()
//       .includes(searchQuery.toLowerCase());
//     const matchesCategory =
//       selectedCategory === "All Rooms" || room.category === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   const renderRoomStatusBanner = () => {
//     if (isRoomStatusLoading) {
//       return (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
//           <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//           <p className="text-sm text-blue-800">Loading room management status...</p>
//         </div>
//       );
//     }

//     if (roomStatusError) {
//       const message = roomStatusError instanceof Error
//         ? roomStatusError.message
//         : "Unable to load room management status.";
//       return (
//         <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
//           <p className="text-sm font-semibold text-yellow-800">Room management unavailable</p>
//           <p className="text-xs text-yellow-700 mt-1">{message}</p>
//         </div>
//       );
//     }

//     return null;
//   };

//   return (
//     <div className="mx-auto p-4 md:p-2 font-sans text-gray-800 bg-gray-50 min-h-screen">
//       {/* PAGE TITLE */}
//       <h1 className="text-xl font-semibold text-gray-900 mb-4">
//         Room Management
//       </h1>

//       {renderRoomStatusBanner()}

//       {/* CALENDAR / DATE STRIP CARD */}
//       <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-5">
//         {/* Month Selector Bar */}
//         <div className="flex items-center justify-between mb-4 px-2">
//           <button
//             onClick={() => shiftWeek(-7)}
//             className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <ChevronLeft className="w-5 h-5" />
//           </button>
//           <div>
//             <button
//               type="button"
//               onClick={toggleMonthMenu}
//               className="flex items-center gap-1 font-bold text-base text-gray-800 cursor-pointer bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"
//             >
//               <span>{formatMonthLabel(startDate)}</span>
//               <ChevronDown className="w-4 h-4 text-gray-600" />
//             </button>
//           </div>
//           <button
//             onClick={() => shiftWeek(7)}
//             className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <ChevronRight className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Date Switcher Inline — now shows the full date (weekday, day, month, year) for each entry */}
//         {monthMenuOpen && (
//           <div className="mt-3 rounded-3xl border border-gray-200 bg-white shadow-sm p-4">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-semibold text-gray-700">
//                 {formatMonthLabel(startDate)} dates
//               </span>
//               <button
//                 type="button"
//                 onClick={toggleMonthMenu}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 Close
//               </button>
//             </div>
//             <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
//               {currentMonthDays.map((item) => {
//                 const isSelected = item.fullDate === selectedDate;
//                 return (
//                   <button
//                     key={item.fullDate}
//                     type="button"
//                     onClick={() => {
//                       handleSelectDate(item.fullDate);
//                       setMonthMenuOpen(false);
//                     }}
//                     className={`w-full text-left rounded-xl px-4 py-3 transition flex items-center justify-between ${
//                       isSelected
//                         ? "bg-[#FF3B00] text-white"
//                         : "bg-gray-50 hover:bg-gray-100 text-gray-700"
//                     }`}
//                   >
//                     <span className="text-sm font-medium">
//                       {formatDropdownDate(item.fullDate)}
//                     </span>
//                     {isSelected && (
//                       <span className="text-[10px] uppercase tracking-wide font-bold">
//                         Selected
//                       </span>
//                     )}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* Days Strip */}
//         <div className="grid grid-cols-7 text-center">
//           {calendarDays.map((item) => {
//             const isSelected = item.fullDate === selectedDate;
//             return (
//               <div
//                 key={item.fullDate}
//                 onClick={() => handleSelectDate(item.fullDate)}
//                 className="cursor-pointer flex flex-col items-center py-1"
//               >
//                 <span className="text-[11px] font-bold text-gray-400 mb-1">
//                   {item.dayName}
//                 </span>
//                 <span
//                   className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
//                     isSelected
//                       ? "bg-[#FF3B00] text-white shadow-md shadow-orange-200"
//                       : "text-gray-800 hover:bg-gray-100"
//                   }`}
//                 >
//                   {item.dateNum}
//                 </span>
//                 <span className="text-[9px] text-gray-400 font-medium mt-1">
//                   {item.year}
//                 </span>
//               </div>
//             );
//           })}
//         </div>

//         {/* Drag Indicator Bar */}
//         <div className="flex justify-center mt-3">
//           <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
//         </div>
//       </div>
//       {/* END OF CALENDAR / DATE STRIP CARD SECTION */}

//       {/* SEARCH AND FILTER CONTROLS */}
//       <div className="flex gap-3 mb-6">
//         <div className="relative">
//           <select
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value)}
//             className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
//           >
//             {categoryOptions.map((category) => (
//               <option key={category} value={category}>
//                 {category}
//               </option>
//             ))}
//           </select>
//           <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3.5 pointer-events-none" />
//         </div>

//         <div className="relative flex-1">
//           <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
//           <input
//             type="text"
//             placeholder="Search here..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
//           />
//         </div>
//       </div>

//       {/* SECTION HEADER & LIVE UPDATE BADGE */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-base font-bold text-gray-900">Edit by day</h2>
//           <p className="text-xs text-gray-500 mt-0.5">
//             {formatHeaderDate(selectedDate)} • {filteredRooms.length} rooms total
//           </p>
//         </div>
//         <span className="bg-[#FFF1EB] text-[#FF3B00] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
//           LIVE UPDATE
//         </span>
//       </div>

//       {/* ROOM CARDS LIST */}
//       <div className="space-y-4 grid grid-cols-2 md:grid-cols-1 gap-4">
//         {filteredRooms.map((room) => (
//           <div
//             key={room.id}
//             className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative space-y-3"
//           >
//             {/* Top Row: Thumbnail, Info, Menu & Toggle */}
//             <div className="flex flex-row md:flex-col items-start justify-between gap-3 overflow-x-hidden">
//               <div className="flex gap-3">
//                 <Image
//                   width={80}
//                   height={64}
//                   src={room.imageUrl}
//                   alt={room.name}
//                   className="w-20 h-16 rounded-xl object-cover"
//                 />
//                 <div>
//                   <h3 className="font-bold text-base text-gray-900">
//                     {room.name}
//                   </h3>
//                   <p className="text-xs text-gray-500 mt-0.5 font-medium">
//                     {room.floor} • {room.bedType}
//                   </p>
//                   <p className="text-xs text-gray-400 mt-1">
//                     {room.soldCount} sold
//                   </p>
//                 </div>
//               </div>

//               {/* Action Column */}
//               <div className="md:w-full flex justify-end flex-col items-end gap-2">
//                 <button className="hidden text-gray-400 hover:text-gray-600">
//                   <MoreVertical className="w-5 h-5" />
//                 </button>

//                 <div className="flex items-center gap-2 mt-1">
//                   {/* Toggle Switch */}
//                   <button
//                     onClick={() => handleToggleAvailability(room.id)}
//                     className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
//                       room.isAvailable ? "bg-[#008767]" : "bg-gray-300"
//                     }`}
//                   >
//                     <div
//                       className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
//                         room.isAvailable ? "translate-x-5" : "translate-x-0"
//                       }`}
//                     />
//                   </button>

//                   {/* Availability Badge */}
//                   <span
//                     className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
//                       room.isAvailable
//                         ? "bg-[#E6F4F1] text-[#008767]"
//                         : "bg-gray-100 text-gray-500"
//                     }`}
//                   >
//                     <span
//                       className={`w-1.5 h-1.5 rounded-full ${
//                         room.isAvailable ? "bg-[#008767]" : "bg-gray-400"
//                       }`}
//                     ></span>
//                     {room.isAvailable ? "Available" : "Unavailable"}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Inventory Controls & Price Row */}
//             <div className="flex items-center justify-between pt-1">
//               <div>
//                 <p className="text-[11px] text-gray-400 font-medium mb-1">
//                   Inventory
//                 </p>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => handleInventoryChange(room.id, -1)}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 active:scale-95"
//                   >
//                     <Minus className="w-3.5 h-3.5" />
//                   </button>
//                   <span className="font-semibold text-sm w-4 text-center">
//                     {room.inventory}
//                   </span>
//                   <button
//                     onClick={() => handleInventoryChange(room.id, 1)}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 active:scale-95"
//                   >
//                     <Plus className="w-3.5 h-3.5" />
//                   </button>
//                 </div>
//               </div>

//               {/* Price & Icons */}
//               <div className="text-right">
//                 <p className="text-[11px] text-gray-400 font-medium mb-1">
//                   Amount
//                 </p>
//                 <div className="flex items-center gap-2">
//                   <span className="text-lg font-bold text-[#FF3B00]">
//                     ₦{room.pricePerNight.toLocaleString()}
//                   </span>
//                   <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
//                     <span className="flex items-center">
//                       <Moon className="w-3 h-3 mr-0.5" />1
//                     </span>
//                     <span className="flex items-center">
//                       <User className="w-3 h-3 mr-0.5" />
//                       {room.maxGuests}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <hr className="border-gray-100" />

//             {/* Bottom Row: Min/Max Nights */}
//             <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
//               <div className="flex items-center gap-1.5 text-gray-400 font-medium">
//                 <Clock className="w-3.5 h-3.5" />
//                 <span>Min. & max. nights</span>
//               </div>
//               <span className="font-semibold text-gray-700">
//                 {room.maxNights}
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  MoreVertical,
  Minus,
  Plus,
  Clock,
  Moon,
  User,
  Hotel,
  Bed,
} from "lucide-react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { roomManagementApi } from "@/services/api/room-management-api";
import { toast } from "sonner";
import type { RoomManagementStatusResponse, RoomManagementStatusRoom } from "@/services/api/room-management-api";
import type { BaseApiResponse } from "@/types/api";

// Types matching your backend data structure
export interface Room {
  id: string;
  entityId: string;
  entityType: string;
  name: string;
  category: string;
  floor: string;
  bedType: string;
  soldCount: number;
  isAvailable: boolean;
  inventory: number;
  pricePerNight: number;
  maxNights: string; // e.g., "1 — 28 nights"
  maxGuests: number;
  minNights: number;
  imageUrl: string;
}

interface DateItem {
  dayName: string;
  dateNum: number;
  year: number;
  fullDate: string; // YYYY-MM-DD
}

// Formats a Date as a local YYYY-MM-DD string. We intentionally avoid
// `.toISOString()` for this: it converts to UTC first, which silently
// rolls the date back by one day for any timezone ahead of UTC (e.g.
// Lagos, UTC+1) when starting from local midnight. That mismatch is what
// caused the day-strip highlight to briefly flash the wrong date.
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Builds the calendar day strip from an API-style { start_date, end_date } range,
// mirroring the "Retrieves calendar days grid" endpoint contract.
function buildDateRange(startDate: string, endDate: string): DateItem[] {
  const dates: DateItem[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (current <= end) {
    dates.push({
      dayName: current
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      dateNum: current.getDate(),
      year: current.getFullYear(),
      fullDate: toDateKey(current),
    });
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Builds every day (1 through 30/31) for the month that `dateStr` falls in,
// used to populate the "Current week dates" dropdown with the full month.
function buildMonthDateRange(dateStr: string): DateItem[] {
  const ref = new Date(dateStr + "T00:00:00");
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const dates: DateItem[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const current = new Date(year, month, day);
    dates.push({
      dayName: current
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      dateNum: day,
      year,
      fullDate: toDateKey(current),
    });
  }

  return dates;
}

// Formats a YYYY-MM-DD date as "Fri, 26 June" for the section header.
function formatHeaderDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${day} ${month}`;
}

function formatMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Formats a YYYY-MM-DD date as "Fri, 26 June 2026" for the dropdown list.
function formatDropdownDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);

  // These three mirror the endpoint's date / start_date / end_date query params.
  const [startDate, setStartDate] = useState<string>("2026-06-22");
  const [endDate, setEndDate] = useState<string>("2026-06-28");
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-26");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Rooms");

  const queryClient = useQueryClient();
  const roomApi = roomManagementApi();

  const {
    data: roomStatusData,
    isLoading: isRoomStatusLoading,
    error: roomStatusError,
  } = roomApi.useGetRoomManagementStatus({
    date: selectedDate,
    start_date: startDate,
    end_date: endDate,
    enabled: !!selectedDate && !!startDate && !!endDate,
  });

  const blockRoomStateMutation = roomApi.useBlockRoomState();
  const updateRoomQuantityMutation = roomApi.useUpdateRoomQuantity();

  const calendarDays = useMemo(() => {
    const apiCalendar = roomStatusData?.data?.calendar;
    if (apiCalendar && apiCalendar.length > 0) {
      const normalizedCalendar = apiCalendar
        .filter((day) => day?.date)
        .map((day) => ({
          dayName: typeof day?.day_of_week === "string"
            ? day.day_of_week.toUpperCase()
            : new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
          dateNum: day.day_number ?? new Date(day.date + "T00:00:00").getDate(),
          year: new Date(day.date + "T00:00:00").getFullYear(),
          fullDate: day.date,
        }));

      if (normalizedCalendar.length > 0) {
        return normalizedCalendar;
      }
    }

    return buildDateRange(startDate, endDate);
  }, [roomStatusData?.data?.calendar, startDate, endDate]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    rooms.forEach((room) => {
      if (room.category && room.category.trim().length > 0) {
        categories.add(room.category.trim());
      }
    });
    return ["All Rooms", ...Array.from(categories).sort()];
  }, [rooms]);

  useEffect(() => {
    if (roomStatusData?.data?.rooms && roomStatusData.data.rooms.length > 0) {
      setRooms(
        roomStatusData.data.rooms.map((room) => {
          const normalizedEntityId = room.id?.trim() ?? "";
          const entityType = "Accommodation";
          return {
            id: normalizedEntityId || room.name,
            entityId: normalizedEntityId,
            entityType,
            name: room.name,
            category: "Standard",
            floor: String(room.floor ?? ""),
            bedType: room.bed_type || "",
            soldCount: room.sold_count ?? 0,
            isAvailable: typeof room.status === "string"
              ? room.status.toLowerCase() === "available"
              : true,
            inventory: room.inventory_amount ?? 0,
            pricePerNight: room.price ?? 0,
            maxNights:
              room.min_nights && room.max_nights
                ? `${room.min_nights} — ${room.max_nights} nights`
                : "1 — 28 nights",
            maxGuests: 1,
            minNights: room.min_nights ?? 1,
            imageUrl:
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80",
          };
        }),
      );
    }
  }, [roomStatusData]);

  const invalidateRoomStatus = () => {
    // Invalidate the exact query for the current date range so React Query
    // refetches the updated room status. The query used in
    // `useGetRoomManagementStatus` includes the date/start_date/end_date
    // segments, so invalidating just ["roomManagement","status"] (exact
    // match) won't match. Use the full key to ensure the query is invalidated.
    queryClient.invalidateQueries({
      queryKey: ["roomManagement", "status", selectedDate, startDate, endDate],
      exact: true,
    });
  };

  const handleSelectDate = (date: string) => {
    // If the picked date falls outside the currently visible 7-day strip
    // (e.g. picked from the full-month dropdown), shift the window so the
    // strip actually contains — and can highlight — the selected date.
    if (date < startDate || date > endDate) {
      const windowStart = new Date(startDate + "T00:00:00");
      const windowEnd = new Date(endDate + "T00:00:00");
      const windowDays =
        Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const newStart = new Date(date + "T00:00:00");
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + (windowDays - 1));

      setStartDate(toDateKey(newStart));
      setEndDate(toDateKey(newEnd));
    }

    setSelectedDate(date);
    invalidateRoomStatus();
  };

  const handleInventoryChange = async (id: string, delta: number) => {
    const nextRooms = rooms.map((room) =>
      room.id === id ? { ...room, inventory: Math.max(0, room.inventory + delta) } : room,
    );
    setRooms(nextRooms);

    const updatedRoom = nextRooms.find((room) => room.id === id);
    if (!updatedRoom || !updatedRoom.entityId) {
      console.warn("Skipping quantity update because entityId is missing", { id, updatedRoom });
      return;
    }

    const statusKey = ["roomManagement", "status", selectedDate, startDate, endDate];
    const previousCache = queryClient.getQueryData(statusKey) as
      | BaseApiResponse<RoomManagementStatusResponse>
      | undefined;

    // Optimistically update the cache so the UI shows the new value immediately.
    try {
      queryClient.setQueryData(statusKey, (oldData: unknown) => {
        const old = oldData as BaseApiResponse<RoomManagementStatusResponse> | undefined;
        if (!old?.data?.rooms) return oldData;
        const updatedRooms = old.data.rooms.map((r: RoomManagementStatusRoom) =>
          r.id === updatedRoom.entityId ? { ...r, inventory_amount: updatedRoom.inventory } : r,
        );
        return {
          ...old,
          data: {
            ...old.data,
            rooms: updatedRooms,
          },
        } as BaseApiResponse<RoomManagementStatusResponse>;
      });
    } catch (e) {
      // best-effort
      console.warn("Failed to optimistically update cache:", e);
    }

    // Log the outgoing PATCH payload for debugging.
    console.log('updateRoomQuantity request:', {
      entity_id: updatedRoom.entityId,
      entity_type: updatedRoom.entityType || "Accommodation",
      dates: [selectedDate],
      quantity_override: updatedRoom.inventory,
    });

    updateRoomQuantityMutation.mutate(
      {
        entity_id: updatedRoom.entityId,
        entity_type: updatedRoom.entityType || "Accommodation",
        dates: [selectedDate],
        quantity_override: updatedRoom.inventory,
      },
      {
        onSuccess: (res) => {
          // Log mutation response for debugging.
          console.log('updateRoomQuantity response:', res);

          // Reconcile cache with the new value (best-effort) then refetch.
          try {
            queryClient.setQueryData(statusKey, (oldData: unknown) => {
              const old = oldData as BaseApiResponse<RoomManagementStatusResponse> | undefined;
              if (!old?.data?.rooms) return oldData;
              const updatedRooms = old.data.rooms.map((r: RoomManagementStatusRoom) =>
                r.id === updatedRoom.entityId ? { ...r, inventory_amount: updatedRoom.inventory } : r,
              );
              return {
                ...old,
                data: {
                  ...old.data,
                  rooms: updatedRooms,
                },
              } as BaseApiResponse<RoomManagementStatusResponse>;
            });
          } catch (e) {
            console.warn("Failed to reconcile cache after success:", e);
          }

          // Start a short persistence check: invalidate+poll a few times to
          // confirm the backend actually persisted the update. This is a
          // best-effort client-side workaround for eventual-consistency APIs.
          (async () => {
            const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
            const attempts = 5;
            const delay = 600; // ms
            let persisted = false;
            for (let i = 0; i < attempts; i++) {
              // trigger a refetch
              invalidateRoomStatus();
              await sleep(delay);
              const latest = queryClient.getQueryData(statusKey) as BaseApiResponse<RoomManagementStatusResponse> | undefined;
              const found = latest?.data?.rooms?.find((r: RoomManagementStatusRoom) => r.id === updatedRoom.entityId);
              if (found && found.inventory_amount === updatedRoom.inventory) {
                persisted = true;
                break;
              }
            }

            if (!persisted) {
              // Show a user-facing notification with retry action.
              toast.error("Update not persisted", {
                description: "We couldn't confirm the inventory update on the server.",
                action: {
                  label: "Retry",
                  // Retry will re-run the same mutation with the last payload.
                  onClick: () => {
                    updateRoomQuantityMutation.mutate({
                      entity_id: updatedRoom.entityId,
                      entity_type: updatedRoom.entityType || "Accommodation",
                      dates: [selectedDate],
                      quantity_override: updatedRoom.inventory,
                    });
                  },
                },
              });
              console.warn("Inventory update may not have persisted on server for", updatedRoom.entityId);
            } else {
              console.log("Inventory persisted on server for", updatedRoom.entityId);
            }
          })();
        },
        onError: (err) => {
          console.error('updateRoomQuantity failed:', err);

          // Roll back optimistic cache and UI state if we have previous data.
          if (previousCache) {
            try {
              queryClient.setQueryData(statusKey, previousCache as unknown as BaseApiResponse<RoomManagementStatusResponse>);
            } catch (e) {
              console.warn('Failed to rollback cache:', e);
            }

            try {
              const prevRooms = previousCache?.data?.rooms;
              if (Array.isArray(prevRooms)) {
                setRooms(prevRooms.map((r: RoomManagementStatusRoom) => ({
                  id: r.id || r.name,
                  entityId: r.id,
                  entityType: 'Accommodation',
                  name: r.name,
                  category: 'Standard',
                  floor: String(r.floor ?? ''),
                  bedType: r.bed_type || '',
                  soldCount: r.sold_count ?? 0,
                  isAvailable: typeof r.status === 'string' ? r.status.toLowerCase() === 'available' : true,
                  inventory: r.inventory_amount ?? 0,
                  pricePerNight: r.price ?? 0,
                  maxNights: r.min_nights && r.max_nights ? `${r.min_nights} — ${r.max_nights} nights` : '1 — 28 nights',
                  maxGuests: 1,
                  minNights: r.min_nights ?? 1,
                  imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80',
                })));
              }
            } catch (e) {
              console.warn('Failed to restore rooms state from previous cache:', e);
            }
          } else {
            invalidateRoomStatus();
          }
        },
      },
    );
  };

  // Log server status responses for debugging — helps confirm whether the
  // backend persisted the mutation or returns stale data.
  React.useEffect(() => {
    if (!roomStatusData?.data) return;
    // Log the full payload with a timestamp.
    console.log('roomManagement status fetched:', {
      time: new Date().toISOString(),
      selectedDate: roomStatusData.data.date ?? selectedDate,
      rooms: roomStatusData.data.rooms,
    });

    // If we recently updated a room, log its inventory specifically.
    const lux = roomStatusData.data.rooms?.find((r: RoomManagementStatusRoom) => r.id === (rooms[0]?.entityId ?? rooms[0]?.id));
    if (lux) {
      console.log('Matched room after fetch:', { id: lux.id, inventory_amount: lux.inventory_amount });
    }
    }, [roomStatusData, rooms, selectedDate]);

  const handleToggleAvailability = async (id: string) => {
    const prevRooms = rooms;
    const nextRooms = rooms.map((room) => (room.id === id ? { ...room, isAvailable: !room.isAvailable } : room));
    setRooms(nextRooms);

    const toggledRoom = nextRooms.find((room) => room.id === id);
    if (!toggledRoom || !toggledRoom.entityId) {
      console.warn("Skipping block update because entityId is missing", { id, toggledRoom });
      return;
    }

    try {
      await blockRoomStateMutation.mutateAsync({
        entity_id: toggledRoom.entityId,
        entity_type: toggledRoom.entityType || "Accommodation",
        dates: [selectedDate],
        is_blocked: !toggledRoom.isAvailable,
      });

      invalidateRoomStatus();

      toast.success("Availability updated");
    } catch (err) {
      console.error("blockRoomState failed:", err);
      // Roll back UI
      setRooms(prevRooms);
      toast.error("Could not update availability. Please try again.");
    }
  };

  // Shifts the whole visible week forward/backward by 7 days, keeping the
  // selected date pinned to the same weekday within the new range.
  const shiftWeek = (days: number) => {
    const shift = (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00");
      d.setDate(d.getDate() + days);
      return toDateKey(d);
    };
    setStartDate((prev) => shift(prev));
    setEndDate((prev) => shift(prev));
    setSelectedDate((prev) => shift(prev));
  };

  const [monthMenuOpen, setMonthMenuOpen] = useState(false);

  const currentMonthDays = useMemo(() => buildMonthDateRange(startDate), [startDate]);

  const toggleMonthMenu = () => {
    setMonthMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (
      selectedCategory !== "All Rooms" &&
      categoryOptions.length > 0 &&
      !categoryOptions.includes(selectedCategory)
    ) {
      setSelectedCategory("All Rooms");
    }
  }, [categoryOptions, selectedCategory]);

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Rooms" || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderRoomStatusBanner = () => {
    if (isRoomStatusLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-800">Loading room management status...</p>
        </div>
      );
    }

    if (roomStatusError) {
      const message = roomStatusError instanceof Error
        ? roomStatusError.message
        : "Unable to load room management status.";
      return (
        <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800">Room management unavailable</p>
          <p className="text-xs text-yellow-700 mt-1">{message}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto p-4 md:p-2 font-sans text-gray-800 bg-gray-50 min-h-screen">
      {/* PAGE TITLE */}
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        Room Management
      </h1>

      {renderRoomStatusBanner()}

      {/* CALENDAR / DATE STRIP CARD */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-5">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={() => shiftWeek(-7)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <button
              type="button"
              onClick={toggleMonthMenu}
              className="flex items-center gap-1 font-bold text-base text-gray-800 cursor-pointer bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"
            >
              <span>{formatMonthLabel(startDate)}</span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => shiftWeek(7)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Date Switcher Inline — now shows the full date (weekday, day, month, year) for each entry */}
        {monthMenuOpen && (
          <div className="mt-3 rounded-3xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                {formatMonthLabel(startDate)} dates
              </span>
              <button
                type="button"
                onClick={toggleMonthMenu}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {currentMonthDays.map((item) => {
                const isSelected = item.fullDate === selectedDate;
                return (
                  <button
                    key={item.fullDate}
                    type="button"
                    onClick={() => {
                      handleSelectDate(item.fullDate);
                      setMonthMenuOpen(false);
                    }}
                    className={`w-full text-left rounded-xl px-4 py-3 transition flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FF3B00] text-white"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {formatDropdownDate(item.fullDate)}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-wide font-bold">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Days Strip */}
        <div className="grid grid-cols-7 text-center">
          {calendarDays.map((item) => {
            const isSelected = item.fullDate === selectedDate;
            return (
              <div
                key={item.fullDate}
                onClick={() => handleSelectDate(item.fullDate)}
                className="cursor-pointer flex flex-col items-center py-1"
              >
                <span className="text-[11px] font-bold text-gray-400 mb-1">
                  {item.dayName}
                </span>
                <span
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-[#FF3B00] text-white shadow-md shadow-orange-200"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {item.dateNum}
                </span>
                <span className="text-[9px] text-gray-400 font-medium mt-1">
                  {item.year}
                </span>
              </div>
            );
          })}
        </div>

        {/* Drag Indicator Bar */}
        <div className="flex justify-center mt-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      {/* END OF CALENDAR / DATE STRIP CARD SECTION */}

      {/* SEARCH AND FILTER CONTROLS */}
      <div className="flex gap-3 mb-6">
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-3.5 pointer-events-none" />
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
          />
        </div>
      </div>

      {/* SECTION HEADER & LIVE UPDATE BADGE */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Edit by day</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatHeaderDate(selectedDate)} • {filteredRooms.length} rooms total
          </p>
        </div>
        <span className="bg-[#FFF1EB] text-[#FF3B00] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          LIVE UPDATE
        </span>
      </div>

      {/* ROOM CARDS LIST */}
      <div className="space-y-4 grid grid-cols-2 md:grid-cols-1 gap-4">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative space-y-3"
          >
            {/* Top Row: Thumbnail, Info, Menu & Toggle */}
            <div className="flex flex-row md:flex-col items-start justify-between gap-3 overflow-x-hidden">
              <div className="flex gap-3">
                <Image
                  width={80}
                  height={64}
                  src={room.imageUrl}
                  alt={room.name}
                  className="w-20 h-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {room.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    <span className="flex items-center gap-1">
                      <Hotel className="w-3 h-3" /> {room.floor} • <Bed className="w-4 h-4" /> {room.bedType}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {room.soldCount} sold
                  </p>
                </div>
              </div>

              {/* Action Column */}
              <div className="md:w-full flex justify-end flex-col items-end gap-2">
                <button className="hidden text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mt-1">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleAvailability(room.id)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      room.isAvailable ? "bg-[#008767]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        room.isAvailable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Availability Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      room.isAvailable
                        ? "bg-[#E6F4F1] text-[#008767]"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        room.isAvailable ? "bg-[#008767]" : "bg-gray-400"
                      }`}
                    ></span>
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Controls & Price Row */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[11px] text-gray-500 font-medium mb-1">
                  Inventory
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInventoryChange(room.id, -1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">
                    {room.inventory}
                  </span>
                  <button
                    onClick={() => handleInventoryChange(room.id, 1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price & Icons */}
              <div className="text-right">
                <p className="text-[11px] text-gray-500 font-medium mb-1">
                  Amount
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#FF3B00]">
                    ₦{room.pricePerNight.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                    <span className="flex items-center">
                      <Moon className="w-3 h-3 mr-0.5" />1
                    </span>
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-0.5" />
                      {room.maxGuests}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Bottom Row: Min/Max Nights */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Min. & max. nights</span>
              </div>
              <span className="font-semibold text-gray-700">
                {room.maxNights}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}