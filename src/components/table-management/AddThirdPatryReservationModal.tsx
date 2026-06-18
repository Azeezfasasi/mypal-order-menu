/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import ReservationConfirmationModal from './ReservationConfirmedModal';
import { TableManagementApi } from '@/services/api/table-management-api';
import { Loader2 } from 'lucide-react';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { IMakeExternalReservationDTO } from '@/types/table-management-types';
import { toast } from 'sonner';
// import { useQueryClient } from '@tanstack/react-query';

type OperatingDay = {
    id: string;
    day: string;
    opening_time: string;
    closing_time: string;
    closes_next_day: boolean;
    is_24_hours: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

const parseHour12 = (timeStr: string): number => {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours;
};

type TProps = {
    openModal: boolean;
    setOpenModal: Dispatch<SetStateAction<boolean>>;
    operatingDays?: OperatingDay[]; // ← add this
}

const AddThirdPartyReservationModal = ({ openModal, setOpenModal, operatingDays }: TProps) => {

    const [step, setStep] = useState(1);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const [guest, setGuest] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        special_requests: '',
    });

    const isGuestValid =
        guest.first_name &&
        guest.last_name &&
        guest.phone &&
        guest.email;

    const [queryParams, setQueryParams] = useState<{
        date: string;
        start_time: string;
        end_time: string;
        party_size: string;
    } | null>(null);

    const [partySize, setPartySize] = useState('');

    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    const { data, isLoading: isLoadingAvailableTables } = TableManagementApi.useGetAvailableTables({
        date: queryParams?.date || '',
        start_time: queryParams?.start_time || '',
        end_time: queryParams?.end_time || '',
        party_size: queryParams?.party_size || '',
    });

    const [confirmationData, setConfirmationData] = useState<{
        table: typeof selectedTable;
    } | null>(null);

    const availableTables = data?.data;

    useEffect(() => {
        setSelectedTableId(null);
    }, [availableTables])

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

    const selectedDayName = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
        : null;

    const operatingMap = (operatingDays ?? []).reduce<Record<string, { openHour: number; closeHour: number; is_24_hours: boolean }>>((acc, day) => {
        if (!day.day) return acc;
        acc[day.day] = {
            openHour: parseHour12(day.opening_time),
            closeHour: parseHour12(day.closing_time),
            is_24_hours: day.is_24_hours,
        };
        return acc;
    }, {});

    const selectedDayOp = selectedDayName ? operatingMap[selectedDayName] : null;
    const isSelectedDayClosed = !!selectedDate && !!operatingDays && operatingDays.length > 0 && !selectedDayOp;

    useEffect(() => {
        const params = getISOParams();

        if (!params) {
            setQueryParams(null);
            return;
        }

        setQueryParams(params);
    }, [selectedDate, selectedSlots, partySize]);

    const generateTimeSlots = (openHour = 0, closeHour = 24, is24 = false) => {
        const slots = [];
        const start = is24 ? 0 : openHour;
        const end = is24 ? 24 : closeHour;

        for (let i = start; i < end; i++) {
            const format = (hour: number) => {
                const suffix = hour >= 12 ? 'PM' : 'AM';
                const formatted = hour % 12 === 0 ? 12 : hour % 12;
                return `${formatted}:00 ${suffix}`;
            };
            slots.push({
                label: `${format(i)} - ${format(i + 1)}`,
                start: i,
                end: i + 1,
            });
        }
        return slots;
    };

    const timeSlots = selectedDayOp
        ? generateTimeSlots(selectedDayOp.openHour, selectedDayOp.closeHour, selectedDayOp.is_24_hours)
        : generateTimeSlots();

    useEffect(() => {
        setSelectedSlots([]);
    }, [selectedDate]);

    const handleSlotClick = (index: number) => {
        setSelectedSlots((prev) => {
            if (prev.includes(index)) {
                return prev.filter((i) => i !== index);
            }

            const newSelection = [...prev, index].sort((a, b) => a - b);

            // ensure consecutive
            for (let i = 1; i < newSelection.length; i++) {
                if (newSelection[i] !== newSelection[i - 1] + 1) {
                    return [index]; // reset if not consecutive
                }
            }

            return newSelection;
        });
    };

    const getMergedTime = () => {
        if (selectedSlots.length === 0) return null;

        const startSlot = timeSlots[selectedSlots[0]];
        const endSlot = timeSlots[selectedSlots[selectedSlots.length - 1]];

        return {
            start: startSlot.start,
            end: endSlot.end,
        };
    };

    const handleClose = () => {
        setStep(1);
        setOpenModal(false);
        setOpenConfirmationModal(false);

        setSelectedDate('');
        setSelectedSlots([]);
        setPartySize('');
        setSelectedTableId(null);
        setQueryParams(null);

        setGuest({
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            special_requests: '',
        });

        setThirdParty('');
        setCustomThirdParty('');

        setConfirmationData(null);
    };

    const getISOParams = () => {
        const merged = getMergedTime();

        if (!selectedDate || !merged || !partySize) return null;

        const start = new Date(selectedDate);
        start.setHours(merged.start, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(merged.end, 0, 0, 0);

        return {
            date: selectedDate,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            party_size: partySize,
        };
    };

    const selectedTable = availableTables?.find(
        (table) => table.id === selectedTableId
    );

    const formatTimeRange = () => {
        const merged = getMergedTime();
        if (!merged) return '';

        const format = (hour: number) => {
            const suffix = hour >= 12 ? 'PM' : 'AM';
            const formatted = hour % 12 === 0 ? 12 : hour % 12;
            return `${formatted}:00 ${suffix}`;
        };

        return `${format(merged.start)} - ${format(merged.end)}`;
    };

    const buildPayload = (): IMakeExternalReservationDTO | null => {
        const merged = getMergedTime();

        if (!merged || !selectedTableId) return null;

        const start = new Date(selectedDate);
        start.setHours(merged.start, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(merged.end, 0, 0, 0);

        const platformName =
            thirdParty === 'custom' ? customThirdParty : thirdParty;

        return {
            guest: {
                firstName: guest.first_name,
                lastName: guest.last_name,
                phone: guest.phone,
                email: guest.email,
                specialRequests: guest.special_requests || undefined,
            },

            booking: {
                date: selectedDate,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                partySize: Number(partySize),
                tableId: selectedTableId,
            },

            external: {
                isExternal: true,
                platformName,
            },
        };
    };

    const queryClient = useQueryClient();
    const makeExternalResMutation = TableManagementApi.useMakeExternalReservation();

    const handleConfirm = () => {

        const payload = buildPayload();

        if (!payload) return;

        setConfirmationData({
            table: selectedTable
        });

        makeExternalResMutation.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['tables']
                });
                setStep(1);
                setOpenModal(false);
                setOpenConfirmationModal(true);
            }
        });

    };

    const [thirdParty, setThirdParty] = useState('');
    const [customThirdParty, setCustomThirdParty] = useState('');

    return (
        <div>
            <Dialog
                open={openModal}
                onOpenChange={handleClose}
            >
                <DialogContent className="max-w-[580px] rounded-[10px] bg-white p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogTitle className='hidden'>Add Reservation</DialogTitle>
                    <DialogDescription className='hidden' />
                    <div>

                        {/* RIGHT FORM SECTION */}
                        {step === 1 &&
                            <div className='max-h-[90dvh] overflow-auto col-span-2 bg-white rounded-[10px] '>
                                <div className='h-fit p-5 flex flex-col'>
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-[#1A1A21]">Add External Booking</h2>
                                        <p className="text-[#8C94A6] mt-1">Fill in guest details</p>
                                    </div>

                                    <form className="space-y-3 flex-grow">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-[#344054]">First name</label>
                                                <input
                                                    type="text"
                                                    placeholder="John"
                                                    value={guest.first_name}
                                                    onChange={(e) =>
                                                        setGuest((prev) => ({ ...prev, first_name: e.target.value }))
                                                    }
                                                    className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-[#344054]">Last name</label>
                                                <input
                                                    type="text"
                                                    value={guest.last_name}
                                                    onChange={(e) =>
                                                        setGuest((prev) => ({ ...prev, last_name: e.target.value }))
                                                    }
                                                    placeholder="Doe"
                                                    className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#344054]">Phone number</label>
                                            <input
                                                type="tel"
                                                value={guest.phone}
                                                onChange={(e) =>
                                                    setGuest((prev) => ({ ...prev, phone: e.target.value }))
                                                }
                                                placeholder="+2345678910"
                                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#344054]">Email</label>
                                            <input
                                                type="email"
                                                value={guest.email}
                                                onChange={(e) =>
                                                    setGuest((prev) => ({ ...prev, email: e.target.value }))
                                                }
                                                placeholder="Sofia@gmail.com"
                                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-[#344054]">Special request</label>
                                            <textarea
                                                value={guest.special_requests}
                                                onChange={(e) =>
                                                    setGuest((prev) => ({ ...prev, special_requests: e.target.value }))
                                                }
                                                placeholder="dietary notes, occasions, seating preferences..."
                                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3] h-24 resize-none"
                                            />
                                        </div>
                                    </form>

                                    {/* FOOTER ACTIONS */}
                                    <div className="grid grid-cols-10 gap-3 items-center mt-4 ">
                                        <button
                                            onClick={() => setOpenModal(false)}
                                            className="py-2 col-span-3 px-10 sm:px-3 border border-[#D0D5DD] text-[#344054] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!isGuestValid}
                                            className="col-span-7 py-2 px-10 sm:px-3 bg-[#F56630] disabled:bg-gray-300 text-white font-semibold rounded-lg hover:bg-[#d45528] transition-colors"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }

                        {step === 2 &&
                            <div className='max-h-[90dvh] overflow-auto col-span-2 bg-white rounded-[10px]'>
                                <div className='h-fit p-7 flex flex-col'>
                                    <div className="mb-3">
                                        <h2 className="text-xl font-bold text-[#1A1A21]">Add External Booking</h2>
                                        <p className="text-[#8C94A6] mt-1 text-sm">Fill in date and table reserved</p>
                                    </div>
                                    <div className='grid grid-cols-2 gap-3 items-center mb-5'>
                                        <div>
                                            <label className="text-sm font-semibold text-[#344054] block mb-2">Date</label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    const selected = new Date(e.target.value);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);

                                                    if (selected < today) {
                                                        toast.error("You cannot select a past date");
                                                        return;
                                                    }

                                                    setSelectedDate(e.target.value);
                                                }}
                                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-[#344054] block mb-2">Guest Size</label>
                                            <input
                                                type="number"
                                                value={partySize}
                                                onChange={(e) => setPartySize(e.target.value)}
                                                placeholder="e.g 5"
                                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                            />
                                        </div>
                                    </div>


                                    {/* Time Slots */}
                                    {/* <div className='mb-2'>
                                        <label className="text-sm  text-[#344054] block mb-2">Reservation Time Frame</label>

                                        <div className="flex flex-wrap gap-3">
                                            {timeSlots.map((slot, index) => {
                                                const isSelected = selectedSlots.includes(index);

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSlotClick(index)}
                                                        className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all
                                                            ${isSelected
                                                                ? 'border-[#F56630] text-[#F56630] bg-white'
                                                                : 'border-[#D0D5DD] text-[#344054] hover:bg-gray-50'
                                                            }
                                                        `}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className='text-[11px] text-[#98A2B3] mt-2'>You can select two or more consecutive time frame to merge</p>
                                    </div> */}

                                    {/* Time Slots */}
                                    <div className='mb-2'>
                                        <label className="text-sm text-[#344054] block mb-2">Reservation Time Frame</label>

                                        {!selectedDate ? (
                                            <p className="text-sm text-[#98A2B3] py-3">Select a date first to see available time slots.</p>
                                        ) : isSelectedDayClosed ? (
                                            <div className="flex items-center gap-3 p-4 rounded-[10px] bg-[#FEF3F2] border border-[#FECDCA]">
                                                <span className="text-xl">🔒</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#B42318]">Closed on {selectedDayName}s</p>
                                                    <p className="text-xs text-[#667085] mt-0.5">
                                                        Your business doesn&apos;t operate on {selectedDayName}s. Please select a different date.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap gap-3">
                                                    {timeSlots.map((slot, index) => {
                                                        const isSelected = selectedSlots.includes(index);
                                                        return (
                                                            <button
                                                                key={index}
                                                                onClick={() => handleSlotClick(index)}
                                                                className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all
                                                                    ${isSelected
                                                                        ? 'border-[#F56630] text-[#F56630] bg-white'
                                                                        : 'border-[#D0D5DD] text-[#344054] hover:bg-gray-50'
                                                                    }
                                                                `}
                                                            >
                                                                {slot.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className='text-[11px] text-[#98A2B3] mt-2'>
                                                    Showing hours for {selectedDayName} · You can select consecutive slots to merge
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Tables Grid */}
                                    {isLoadingAvailableTables ?
                                        <div className='my-3 flex items-center gap-2 text-sm'>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            loading . . .
                                        </div>
                                        :
                                        availableTables ?
                                            <div className="grid grid-cols-3 sm:grid-cols-2 gap-3 my-4">
                                                <h2 className='col-span-full font-medium text-sm'>Available tables</h2>
                                                {(availableTables && availableTables.length === 0) ?
                                                    <p className='my-2 col-span-full text-sm text-gray-600'>No tables available</p>
                                                    :
                                                    availableTables?.map((table) => {
                                                        const isSelected = selectedTableId === table.id;

                                                        return (
                                                            <div
                                                                key={table.id}
                                                                onClick={() => setSelectedTableId(table.id)}
                                                                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all
                                                                ${isSelected
                                                                        ? 'border-[#F56630] bg-[#FFF6F3]'
                                                                        : 'bg-[#F9FAFB] border-[#F2F4F7] hover:border-[#F56630]'
                                                                    }
                                                                `}
                                                            >
                                                                <span className="font-bold text-[#1A1A21]">{table.label}</span>
                                                                <span className="text-[12px] text-[#667085]">{table.capacity} Seats</span>
                                                                <span className="text-[12px] text-[#667085] mb-2">{table.location_tag}</span>

                                                                <div className={`text-[11px] font-semibold px-2 py-1 rounded-full w-fit
                                                            ${table.is_active ? 'bg-[#ECFDF3] text-[#027A48]' : 'bg-[#FEF3F2] text-[#B42318]'}
                                                        `}>
                                                                    {table.is_active ? 'Available' : 'Not available'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            :
                                            <></>
                                    }


                                    {/* FOOTER ACTIONS */}
                                    <div className="grid grid-cols-10 gap-3 justify-between items-center pt-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="col-span-3 py-2 px-10 sm:px-3 border border-[#D0D5DD] text-[#344054] font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            disabled={!selectedTableId}
                                            onClick={() => setStep(3)}
                                            className="col-span-7 py-2 px-10 sm:px-3 bg-[#F56630] disabled:opacity-50 text-white font-semibold rounded-lg text-sm hover:bg-[#d45528]"
                                        >
                                            Continue
                                        </button>
                                    </div>

                                </div>
                            </div>
                        }

                        {step === 3 &&
                            <div className='max-h-[90dvh] overflow-auto col-span-2 bg-white rounded-[10px] relative'>
                                <div className='h-fit p-7 flex flex-col'>
                                    {/* Header */}
                                    <div className="mb-4 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1A1A21]">Finalize External Booking</h2>
                                            <p className="text-[#8C94A6] mt-1 text-sm">Enter external platform information</p>
                                        </div>

                                    </div>

                                    {/* Third Party Source */}
                                    <div className="mb-4">
                                        <h3 className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-2">
                                            Source
                                        </h3>

                                        <div className="border border-[#EAECF0] rounded-xl p-2.5 space-y-4">
                                            {/* Select */}
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-[#344054]">
                                                    Select platform
                                                </label>
                                                <select
                                                    value={thirdParty}
                                                    onChange={(e) => setThirdParty(e.target.value)}
                                                    className="w-full font-medium text-sm py-2.5 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none"
                                                >
                                                    <option value="">Select platform</option>
                                                    <option value="reisty">Reisty</option>
                                                    <option value="nextable">Nextable</option>
                                                    <option value="custom">Other</option>
                                                </select>
                                            </div>

                                            {/* Custom input */}
                                            {thirdParty === 'custom' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-[#344054]">
                                                        Enter platform name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customThirdParty}
                                                        onChange={(e) => setCustomThirdParty(e.target.value)}
                                                        placeholder="e.g OpenTable, Instagram, Walk-in"
                                                        className="font-medium text-sm w-full py-2.5 px-3 border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Booking Details Section */}
                                    <div className="mb-6">
                                        <h3 className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-2">Booking Details</h3>
                                        <div className="border border-[#EAECF0] rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#667085]">Date</span>
                                                <span className="text-[#344054] font-medium">{selectedDate}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#667085]">Time</span>
                                                <span className="text-[#344054] font-medium">
                                                    {formatTimeRange()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#667085]">Party size</span>
                                                <span className="text-[#344054] font-medium">
                                                    {partySize} Guests
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#667085]">Contact</span>
                                                <span className="text-[#344054] font-medium">
                                                    {guest.phone}, {guest.email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Assignment Section */}
                                    <div className="mb-6">
                                        <h3 className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-2">Table Assignement</h3>
                                        {selectedTable && (
                                            <div className="border border-[#EAECF0] rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-[#FEE4E2] rounded-lg flex items-center justify-center font-bold text-[#344054]">
                                                        {selectedTable.label.split(' ')[0].charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1A1A21]">{selectedTable.label}</div>
                                                        <div className="text-xs text-[#667085]">
                                                            {selectedTable.capacity} Seats
                                                            {/* {selectedTable.capacity} Seats - {selectedTable.location_tag} */}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-[#ECFDF3] text-[#027A48] text-xs font-semibold rounded-full border border-[#ABEFC6]">
                                                    Selected
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end mt-2">
                                            <button onClick={() => setStep(2)} className="text-sm font-semibold text-[#475467] border border-[#D0D5DD] px-4 py-2 rounded-lg hover:bg-gray-50">
                                                Change table
                                            </button>
                                        </div>
                                    </div>


                                    {/* FOOTER ACTIONS */}
                                    <div className="grid grid-cols-10 gap-3 justify-between items-center pt-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="col-span-3 py-2.5 px-10 sm:px-3 border border-[#D0D5DD] text-[#344054] font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={
                                                !thirdParty ||
                                                (thirdParty === 'custom' && !customThirdParty) ||
                                                makeExternalResMutation.isPending
                                            }
                                            className="col-span-7 py-2.5 px-10 sm:px-3 bg-[#F56630] disabled:opacity-50 text-white font-semibold rounded-lg text-sm hover:bg-[#d45528] transition-colors"
                                        >
                                            {makeExternalResMutation.isPending ?
                                                'loading . . .'
                                                :
                                                "Confirm Reservation"
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }

                    </div>

                </DialogContent >
            </Dialog >

            <ReservationConfirmationModal
                openModal={openConfirmationModal}
                setOpenAddModal={setOpenModal}
                setOpenModal={setOpenConfirmationModal}
                guest={guest}
                date={selectedDate}
                timeRange={formatTimeRange()}
                endTimeISO={getISOParams()?.end_time || ''}
                table={confirmationData?.table}
                partySize={partySize}
                onClose={handleClose}
            />
        </div>
    )
}

export default AddThirdPartyReservationModal

