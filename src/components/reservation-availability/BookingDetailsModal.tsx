import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OfferingsReservationApi } from '@/services/api/offerings-reservations-api';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';


type TViewDetails = {
  entity_id: string;
  entity_type: string;
  date: string;
  name: string;
  quantity: number;
  available: number;
};

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailsData: TViewDetails | null
}

export function BookingDetailsModal({ open, onOpenChange, detailsData }: BookingDetailsModalProps) {

  const STATS = [
    { label: 'Total', value: detailsData?.quantity ?? 0, bgColor: 'bg-gray-50', textColor: 'text-slate-900' },
    { label: 'Available', value: detailsData?.available ?? 0, bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { label: 'Booked', value: (detailsData ? detailsData.quantity - detailsData.available : 0), bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  ];

  const { data: reservationList, isLoading } = OfferingsReservationApi.useRetrieveReservation({
    start_date: detailsData?.date ?? '',
    end_date: detailsData?.date ?? '',
    entity_id: detailsData?.entity_id ?? '',
    entity_type: detailsData?.entity_type ?? '',
    isEnabled: !!detailsData
  });

  const formatText = (value: string) => {
    return value.replace(/_/g, ' ');
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[15px] p-5 gap-5 border-none shadow-2xl">


        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Booking Details
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm font-medium">
            {detailsData?.name} · {detailsData?.date}
          </DialogDescription>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`${stat.bgColor} rounded-2xl p-4 flex flex-col items-center justify-center min-h-[90px]`}
            >
              <span className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</span>
              <span className="text-xs text-gray-500 font-medium mt-1">{stat.label}</span>
            </div>
          ))}
        </div>



        {/* Booking Source Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Bookings</h4>
          {isLoading ?
            <div className='flex items-center gap-2 text-sm'>
              <Loader2 className='w-4 h-4 animate-spin' />
              loading . . .
            </div>
            :
            (reservationList && reservationList?.data.length === 0) ?
              <p>No reservations</p>
              :
              reservationList?.data.map((res) => (
                <div key={res.id} className="w-full bg-indigo-50/50 px-5 py-4 rounded-xl text-sm font-semibold border border-indigo-50 flex sm:flex-col items-center sm:items-start justify-between gap-2">
                  <div className='flex items-center gap-2'>
                    <div className='w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg'>
                      {res.guest_name.charAt(0)}
                    </div>
                    <div>
                      <p className='text-indigo-600 '>{res.guest_name}</p>
                      <span className='text-xs text-gray-700'>Source: {formatText(res.source)} {res.source === 'OTA' ? <>({res.ota_name})</> : ''}</span>
                    </div>
                  </div>
                  <div>
                    <p className='text-xs text-gray-700'>{format(new Date(res.check_in_date), 'EEE, MMM d')} - {format(new Date(res.check_out_date), 'EEE, MMM d')}</p>
                  </div>
                </div>
              ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full h-12 rounded-xl border-[#f0511f] text-[#f0511f] font-bold text-lg hover:bg-orange-50 hover:text-[#f0511f] transition-all"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}