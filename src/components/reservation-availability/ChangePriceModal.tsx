import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OfferingsReservationApi } from '@/services/api/offerings-reservations-api';
import { useQueryClient } from '@tanstack/react-query';

interface ChangePriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCell: {
    entity_id: string;
    entity_type: string;
    date: string;
    room_name: string;
    current_price?: number;
  } | null;
}

export function ChangePriceModal({ open, onOpenChange, selectedCell }: ChangePriceModalProps) {

  const overridePriceMutation = OfferingsReservationApi.useOverrideSlotPrice();
  const queryClient = useQueryClient();

  const [price, setPrice] = useState('');

  useEffect(() => {
    setPrice('');
  }, [open])

  const handleOverridePrice = (data: {
    entity_id: string;
    entity_type: string;
    dates: string[];
    price_override: number;
  }) => {
    overridePriceMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['offerings-res', 'grid']
        })
        onOpenChange(false);
      }
    })
  }

  if (!selectedCell) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[15PX] p-5 gap-4 border-none shadow-2xl">

        {/* Header */}
        <DialogHeader className="text-left space-y-0.5 relative">
          <DialogTitle className="text-xl font-bold text-[#101928] block mb-1">
            Pricing & Rate Manager
          </DialogTitle>
          <p className="text-[13px] text-[#667185]">1 cell selected</p>

        </DialogHeader>

        <div className="space-y-3">
          {/* Selected Dates Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#101928] uppercase tracking-tight">
              Selected Dates / Slots
            </h4>
            <div className="bg-[#E9F0FD] p-4 rounded-[6px] flex justify-between items-center">
              <span className="text-sm text-[#5F6976]">{selectedCell.room_name}</span>
              <span className="text-sm text-gray-500 font-medium">{selectedCell.date}</span>
            </div>
          </div>

          {/* Current Price Section */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#101928]">Current Price</Label>
            <div className="w-full bg-[#E9F0FD] border border-transparent px-4 py-4 rounded-[6px] text-[#114CCC] font-bold text-sm">
              ₦{selectedCell.current_price?.toLocaleString() ?? '—'}
            </div>
          </div>

          {/* New Price Section */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#101928]">New Price</Label>
            <div className="relative">
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter new price"
                className="w-full h-14 px-4 bg-white border-gray-200 rounded-[6px] text-[#114CCC] shadow-none font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-[6px] border-[#f0511f] text-[#f0511f] font-bold text-sm hover:bg-orange-50 hover:text-[#f0511f] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleOverridePrice({
                entity_id: selectedCell.entity_id,
                entity_type: selectedCell.entity_type,
                dates: [selectedCell.date],
                price_override: Number(price),
              });
            }}
            disabled={overridePriceMutation.isPending}
            className="h-12 rounded-[6px] bg-[#f0511f] hover:bg-orange-700 text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {overridePriceMutation.isPending ? 
            'loading . . .'
            :
            'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}