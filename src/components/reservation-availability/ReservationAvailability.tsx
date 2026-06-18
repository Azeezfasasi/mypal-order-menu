'use client'
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Box, Eye, Lock, Loader2, CircleDollarSign, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ManualBookingModal } from './ManualBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChangePriceModal } from './ChangePriceModal';
import { OfferingsReservationApi } from '@/services/api/offerings-reservations-api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

type Status = 'available' | 'low' | 'sold-out' | 'blocked';

type SelectedCell = {
  entity_id: string;
  entity_type: string;
  date: string;
  room_name: string;
  current_price?: number;
};

type TViewDetails = {
  entity_id: string;
  entity_type: string;
  date: string;
  name: string;
  quantity: number;
  available: number;
};

const StatusBadge = ({ type, label }: { type: Status; label: string }) => {

  return (
    <div className="flex items-center gap-1.5 px-3 py-[5px] border rounded-full text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${type === 'available' ? 'bg-green-500' : type === 'low' ? 'bg-orange-400' : type === 'sold-out' ? 'bg-red-500' : 'bg-gray-400'}`} />
      {label}
    </div>
  );
};

export default function ReservationAvailability() {

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewDetailsData, setviewDetailsData] = useState<TViewDetails | null>(null);

  const [openManualModal, setOpenManualModal] = useState(false);
  const [openLiveModal, setOpenLiveModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openPriceModal, setOpenPriceModal] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: gridData, isLoading } = OfferingsReservationApi.useGetInventoryGrid({
    start_date: startDate,
    end_date: endDate,
  });

  const blockUnblockMutation = OfferingsReservationApi.useBlockUnblockInventorySlot();
  const queryClient = useQueryClient()

  const handleBlockUnblock = (data: {
    entity_id: string;
    entity_type: string;
    dates: string[];
    is_blocked: boolean;
  }) => {
    blockUnblockMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['offerings-res', 'grid']
        })
      }
    })
  }

  const { data: liveReservationData } = OfferingsReservationApi.useGetLiveReservations();


  return (
    <div className="">

      {/* --- HEADER --- */}
      <div className="flex sm:flex-col justify-between items-center sm:items-start sm:gap-3 mb-6 sm:mb-3">
        <div>
          <h1 className="text-xl font-bold mb-1">Reservation Availability</h1>
          <p className='text-[15px] text-gray-700'>Manage accommodation reservations</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setOpenLiveModal(true)} className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[13px] font-semibold border border-red-100">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live
          </button>
          {gridData?.data.offerings && gridData?.data.offerings.length > 0 &&
            <Button onClick={() => setOpenManualModal(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
              <Plus size={18} /> New Booking
            </Button>
          }
        </div>
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div className='border border-gray-200 rounded-xl overflow-hidden'>

        <div className="bg-white p-4 flex md:flex-col justify-between items-center md:items-start gap-3">
          <div className="flex items-center gap-4">
            <button className="border border-gray-300 text-sm px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
              {format(currentMonth, 'MMMM yyyy')}
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-2 hover:bg-gray-50 border-r border-gray-300"><ChevronLeft size={18} /></button>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-2 hover:bg-gray-50"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <StatusBadge type="available" label="Available" />
            <StatusBadge type="low" label="Low" />
            <StatusBadge type="sold-out" label="Sold out" />
            <StatusBadge type="blocked" label="Blocked" />
            <button onClick={() => setOpenLiveModal(true)} className="text-sm border border-gray-300 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
              Show feed
            </button>
          </div>
        </div>

        <div className='w-full overflow-auto border-t border-gray-200'>
          <div className="bg-white overflow-hidden w-max">
            {isLoading ?
              <div className='flex items-center gap-2 m-4'>
                <Loader2 className='w-4 h-4 animate-spin' />
                loading . . .
              </div>
              :
              <>
                {/* Header Row */}
                {gridData?.data.offerings && gridData?.data.offerings.length === 0 ?
                  <></>
                  :
                  <div className="flex bg-[#F9FAFB] border-b border-gray-200">
                    <div className="w-[200px] p-4 text-xs font-medium text-[#667185] uppercase tracking-wider flex items-center justify-center">
                      Inventory
                    </div>
                    {gridData?.data.dates.map((day, i) => (
                      <div key={i} className="w-[130px] p-4 text-center text-[13px] font-medium text[#344054]">
                        {format(new Date(day), 'EEE, MMM d')}
                      </div>
                    ))}
                  </div>
                }

                {/* --- ROOM ROWS --- */}
                {gridData?.data.offerings && gridData?.data.offerings.length === 0 ?
                  <div className='p-4 text-[15px]'>
                    <p className='mb-2'>No accommodations available.</p>
                    <Link href={'/offerings'} className='cursor-pointer text-orange-500 font-semibold'>Click</Link> to setup
                  </div>
                  :
                  gridData?.data.offerings.map((room) => (
                    <div key={room.id} className="flex border-b last:border-0 border-gray-200 group">
                      {/* --- ROOM INFO --- */}
                      <div className="w-[200px] p-4 flex items-center gap-3 border-r border-gray-100">
                        <div className="w-8 h-8 shrink-0 bg-[#E9F0FD] rounded-full flex items-center justify-center text-[#114CCC]">
                          <Box size={16} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold leading-tight mb-1 text-[#001633]">{room.name}</div>
                          <div className="text-xs text-[#012657] font-medium">Total: {room.total_capacity}</div>
                        </div>
                      </div>

                      {gridData.data.dates.map((date) => {
                        const cell = room.cells[date];

                        const available = cell?.available ?? 0;
                        const total = room.total_capacity;
                        const ratio = available / total;

                        const bgColor = cell?.is_blocked
                          ? 'bg-[#EFEFEF]'
                          : available === 0
                            ? 'bg-[#FF3033]'
                            : ratio < 1
                              ? 'bg-[#FFDED3]'
                              : 'bg-[#DDFFE6]';

                        return (
                          <Popover key={date}>
                            <PopoverTrigger asChild>
                              <div
                                className={`w-[130px] p-4 flex items-center justify-center border-r border-[#E4E7EC] last:border-0 min-h-[100px] ${bgColor} text-[#001633] transition-all hover:brightness-95 cursor-pointer`}
                              >
                                {cell?.is_blocked ? (
                                  <div className="font-bold text-[#001633]">Blocked</div>
                                ) : available === 0 ? (
                                  <div className="font-bold text-white">Sold out</div>
                                ) : (
                                  <div className="text-center">
                                    <div className="font-semibold">{available} left</div>
                                    <div className="text-[13px] font-medium text-[#012657]">
                                      {cell?.price ? `₦${Number(cell.price).toLocaleString()}` : '—'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </PopoverTrigger>

                            <PopoverContent side="bottom" align="start" sideOffset={-40} className="w-[280px] p-0 rounded-[10px] shadow-xl border border-gray-200 overflow-hidden">
                              <div className="p-5 bg-white">
                                <h3 className="font-bold text-[#101928] text-base">{room.name}</h3>
                                <p className="text-xs text-[#667185] mt-1">{date}</p>
                                <div className="flex justify-between items-center mt-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${available === 0 ? 'bg-red-500' : ratio < 0.3 ? 'bg-orange-400' : 'bg-green-500'}`} />
                                    <span className="text-xs font-medium text-gray-600">
                                      {available === 0 ? 'Sold out' : ratio < 0.3 ? 'Low' : 'Available'}
                                    </span>
                                  </div>
                                  <span className="font-bold text-[#012657]">
                                    {cell?.price ? `₦${Number(cell.price).toLocaleString()}` : '—'}
                                  </span>
                                </div>
                              </div>
                              <div className="border-t border-gray-100">
                                <button onClick={() => {
                                  setOpenDetailsModal(true);
                                  setviewDetailsData({
                                    entity_id: room.id,
                                    entity_type: room.type,
                                    date: date,
                                    name: room.name,
                                    available: available,
                                    quantity: room.total_capacity
                                  })
                                }} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors">
                                  <Eye size={20} className="text-[#141B34]" /> View Bookings
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCell({
                                      entity_id: room.id,
                                      entity_type: room.type,
                                      date: date,
                                      room_name: room.name,
                                      current_price: cell?.price,
                                    });

                                    setOpenPriceModal(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors"
                                >
                                  <CircleDollarSign size={20} className="text-[#141B34]" /> Change Price
                                </button>
                                <button
                                  onClick={() => {
                                    handleBlockUnblock({
                                      entity_id: room.id,
                                      entity_type: room.type,
                                      dates: [date],
                                      is_blocked: !cell?.is_blocked,
                                    });
                                  }}
                                  disabled={blockUnblockMutation.isPending}
                                  className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-gray-100 transition-colors"
                                >
                                  {blockUnblockMutation.isPending ?
                                    <>
                                      <Loader2 className='w- h-4 animate-spin' />
                                      loading . . .
                                    </>
                                    :
                                    <>
                                      <Lock size={20} className="text-[#141B34]" /> {!cell?.is_blocked ? 'Block' : 'Unblock'} Date/Slot
                                    </>
                                  }
                                </button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}

                    </div>
                  ))}

              </>}
          </div>
        </div>
      </div>

      {openLiveModal &&
        <div onClick={() => setOpenLiveModal(false)} className='fixed h-dvh w-full bg-black/30 backdrop-blur-sm top-0 left-0'>
          <div onClick={(e) => e.stopPropagation()} className='p-5 absolute bg-white w-[400px] sm:w-full h-[98dvh] right-[1dvh] sm:right-0 top-[1dvh] rounded-[20px]'>
            <div className='flex items-center justify-between mb-[60px]'>
              <h2 className='text-xl font-bold'>Live Reservation</h2>
              <X size={20} onClick={() => setOpenLiveModal(false)} />
            </div>
            <div className='space-y-8'>
              {Object.entries(liveReservationData?.data || {}).map(([key, value]) => (
                <div key={key} className='relative flex items-center gap-2 border-b border-[#C9CED4] pb-5'>
                  <div className='bg-[#FFECE5] w-5 h-5 rounded-full' />

                  <p className='font-bold text-[#101928] capitalize'>
                    {key}
                  </p>

                  <div className='bg-[#E9F0FD] text-[#114CCC] font-semibold py-[3px] px-3 w-fit rounded-[20px] text-xs'>
                    {Array.isArray(value) ? value.length : 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }

      <ManualBookingModal
        open={openManualModal}
        onOpenChange={setOpenManualModal}
        gridData={gridData}
      />

      <BookingDetailsModal
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        detailsData={viewDetailsData}
      />

      <ChangePriceModal
        open={openPriceModal}
        onOpenChange={setOpenPriceModal}
        selectedCell={selectedCell}
      />

    </div>
  );
}