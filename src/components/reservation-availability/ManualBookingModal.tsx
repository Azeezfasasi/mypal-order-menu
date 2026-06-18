import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Footprints, Phone, Globe, Smartphone, Plane } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CheckCircle2 } from 'lucide-react';
import { OfferingsReservationApi } from '@/services/api/offerings-reservations-api';
import { ICreateManualReservationDTO, IReservationGridResponse } from '@/types/offerings-reservations-types';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const BOOKING_SOURCES = [
    { id: 'WALK_IN', label: 'Walk-in', icon: Footprints },
    { id: 'PHONE_CALL', label: 'Phone call', icon: Phone },
    { id: 'WEBSITE', label: 'Website', icon: Globe },
    { id: 'MOBILE', label: 'MyPal app', icon: Smartphone },
    { id: 'OTA', label: 'Online traveling agency', icon: Plane },
];

export function ManualBookingModal({ open, onOpenChange, gridData }: { open: boolean; onOpenChange: (open: boolean) => void, gridData: IReservationGridResponse | undefined }) {
    const [selectedSource, setSelectedSource] = useState('PHONE_CALL');
    const [selectedOta, setSelectedOta] = useState<string | null>(null);
    const [isCustomOta, setIsCustomOta] = useState(false);
    const [customOtaName, setCustomOtaName] = useState('');
    const [selectedOffering, setSelectedOffering] = useState<IReservationGridResponse['data']['offerings'][0] | null>(null);

    const [guestName, setGuestName] = useState('');
    const [entityId, setEntityId] = useState('');
    const [entityType, setEntityType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const queryClient = useQueryClient();

    const resetForm = () => {
        setGuestName('');
        setEntityId('');
        setEntityType('');
        setStartDate('');
        setEndDate('');
        setNotes('');

        setSelectedSource('PHONE_CALL');
        setSelectedOta(null);
        setCustomOtaName('');
        setIsCustomOta(false);
        setSelectedOffering(null);
    };

    const OTA_LIST = [
        { name: 'Bookings.com' },
        { name: 'Expedia' },
    ];

    const createBookingMutation = OfferingsReservationApi.useCreateReservation();

    const resolvedOtaName =
        selectedSource === 'OTA'
            ? selectedOta || customOtaName || ''
            : '';

    const handleCreateBooking = (data: ICreateManualReservationDTO) => {
        createBookingMutation.mutate(data, {
            onSuccess: () => {
                toast.success('Reservation created!');
                queryClient.invalidateQueries({
                    queryKey: ['offerings-res', 'grid']
                })
                resetForm();
                onOpenChange(false);
            }
        });
    }

    const handleStartDateChange = (value: string) => {
        setStartDate(value);

        if (endDate) {
            const minEnd = new Date(value);
            minEnd.setDate(minEnd.getDate() + 1);

            if (new Date(endDate) < minEnd) {
                setEndDate(''); // reset invalid checkout
            }
        }
    };

    const getMinCheckoutDate = () => {
        if (!startDate) return '';

        const date = new Date(startDate);
        date.setDate(date.getDate() + 1);

        return date.toISOString().split('T')[0]; // yyyy-mm-dd
    };

    const pricePerNight =
        selectedOffering && startDate
            ? selectedOffering.cells[startDate]?.price ?? 0
            : 0;

    const numberOfNights =
        startDate && endDate
            ? Math.max(
                0,
                (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            : 0;

    const calculatedAmount = pricePerNight * numberOfNights;

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val) resetForm();
                onOpenChange(val);
            }}
        >
            <DialogContent className="max-w-2xl max-h-[95dvh] overflow-y-auto rounded-[15px] p-6 gap-3 border-none shadow-2xl">
                <DialogHeader className="text-left space-y-1 mb-2">
                    <DialogTitle className="text-xl font-bold">Add Manual Booking</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Record a walk-in, Website, or phone booking
                    </DialogDescription>
                </DialogHeader>

                {/* Source Selection Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-3 gap-3">
                    {BOOKING_SOURCES.map((source) => {
                        const Icon = source.icon;
                        const isSelected = selectedSource === source.id;

                        const buttonContent = (
                            <button
                                key={source.id}
                                onClick={() => {
                                    setSelectedSource(source.id);
                                    if (source.id !== 'OTA') {
                                        setSelectedOta(null);
                                        setCustomOtaName('');
                                    }
                                }}
                                className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${isSelected
                                    ? 'border-[#DA3807] bg-[#FFECE5] ring-2 ring-[#DA3807]'
                                    : 'border-orange-100 bg-[#FFECE5] hover:bg-orange-50'
                                    }`}
                            >
                                <Icon size={20} className={'text-[#DA3807]'} />
                                <span className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>
                                    {source.id === 'OTA' && selectedOta ? selectedOta : source.label}
                                </span>
                            </button>
                        );

                        // If it's OTA, wrap it in Popover
                        if (source.id === 'OTA') {
                            return (
                                <Popover key={source.id}>
                                    <PopoverTrigger asChild>
                                        {buttonContent}
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2 rounded-xl shadow-xl border-gray-100" align="end">
                                        <div className="space-y-1">
                                            {OTA_LIST.map((ota) => (
                                                <div
                                                    key={ota.name}
                                                    onClick={() => {
                                                        setSelectedOta(ota.name);
                                                        setSelectedSource('OTA');
                                                    }}
                                                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-slate-700">{ota.name}</span>
                                                    </div>
                                                    {selectedOta === ota.name && <CheckCircle2 size={16} className="text-orange-600" />}
                                                </div>
                                            ))}

                                            {/* Custom Entry Logic */}
                                            <div className="pt-2 border-t mt-2">
                                                {!isCustomOta ? (
                                                    <button
                                                        onClick={() => setIsCustomOta(true)}
                                                        className="flex items-center gap-2 p-3 w-full text-sm font-medium text-gray-500 hover:text-slate-700"
                                                    >
                                                        <Plus size={16} /> Add Travel Agency
                                                    </button>
                                                ) : (
                                                    <div className="p-2 space-y-2">
                                                        <Input
                                                            autoFocus
                                                            placeholder="Enter Agency Name"
                                                            className="h-9 text-sm"
                                                            value={customOtaName}
                                                            onChange={(e) => setCustomOtaName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && customOtaName) {
                                                                    setSelectedOta(customOtaName);
                                                                    setSelectedSource('OTA');
                                                                    setIsCustomOta(false);
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="w-full h-8 bg-slate-800"
                                                            onClick={() => {
                                                                if (customOtaName) {
                                                                    setSelectedOta(customOtaName);
                                                                    setSelectedSource('OTA');
                                                                    setIsCustomOta(false);
                                                                }
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        }

                        return buttonContent;
                    })}
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-800">Guest name</Label>
                        <Input
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Enter full guest name"
                            className="h-12 rounded-lg border-gray-300 shadow-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-full">
                            <Label className="font-semibold text-slate-800">Inventory Item</Label>
                            <Select
                                onValueChange={(value) => {
                                    const offering = gridData?.data.offerings.find(o => o.id === value);
                                    if (offering) {
                                        setEntityId(offering.id);
                                        setEntityType(offering.type);
                                        setSelectedOffering(offering); // ← add this
                                    }
                                }}
                            >
                                <SelectTrigger className="h-12 border-gray-300 shadow-none">
                                    <SelectValue placeholder="Select item" />
                                </SelectTrigger>

                                <SelectContent>
                                    {gridData?.data.offerings.map((offering) => (
                                        <SelectItem
                                            key={offering.id}
                                            value={offering.id}
                                            className="text-sm"
                                        >
                                            {offering.name} ({offering.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-800">Check in date</Label>
                            <Input
                                type='date'
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className="h-12 border-gray-300 shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-800">Checkout date</Label>
                            <Input
                                type='date'
                                value={endDate}
                                disabled={!startDate}
                                min={getMinCheckoutDate()}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-12 shadow-none border-gray-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-800">Amount</Label>
                        <Input
                            readOnly
                            value={
                                calculatedAmount > 0
                                    ? calculatedAmount.toLocaleString()
                                    : '—'
                            }
                            placeholder="Auto-calculated"
                            className="h-12 border-gray-300 shadow-none bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                        {numberOfNights > 0 && pricePerNight > 0 && (
                            <p className="text-xs text-gray-400">
                                {pricePerNight.toLocaleString()} × {numberOfNights} night{numberOfNights > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-semibold text-slate-800">Note (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="E.g., party request, party size"
                            className="min-h-[100px] rounded-lg border-gray-300 resize-none shadow-none"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                        className="h-12 rounded-[7px] border-orange-500 text-orange-600 font-bold hover:bg-orange-50 hover:text-orange-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={createBookingMutation.isPending}
                        onClick={() => {
                            // --- validate empty fields ---
                            if (!entityId || !entityType || !guestName || !startDate || !endDate || !calculatedAmount) {
                                toast.error('Please fill all required fields');
                                return;
                            }

                            // --- validate ota name when OTA is selected ---
                            if (selectedSource === 'OTA' && !resolvedOtaName) {
                                toast.error('Please select or enter an OTA name');
                                return;
                            }

                            // --- validate checkin and checkout date ---
                            const start = new Date(startDate);
                            const end = new Date(endDate);

                            const diffInMs = end.getTime() - start.getTime();
                            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                            if (diffInDays < 1) {
                                toast.error('Checkout must be at least 1 day after check-in');
                                return;
                            }
                            const payload: ICreateManualReservationDTO = {
                                entity_id: entityId,
                                entity_type: entityType,
                                source: selectedSource,
                                ota_name: resolvedOtaName,
                                guest_name: guestName,
                                start_date: startDate,
                                end_date: endDate,
                                quantity: 1,
                                amount: calculatedAmount,
                                notes,
                            };

                            console.log(payload);

                            handleCreateBooking(payload);
                        }}
                        className="h-12 rounded-[7px] bg-[#f0511f] hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-orange-100"
                    >
                        {createBookingMutation.isPending ? 'Creating...' : 'Confirm Booking'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}