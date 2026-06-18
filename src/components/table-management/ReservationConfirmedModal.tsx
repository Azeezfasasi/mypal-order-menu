import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Dispatch, SetStateAction } from 'react';
import confirmedIcon from '../../../public/images/reservation-confirmed-icon.svg'
import Image from 'next/image';

type TProps = {
    openModal: boolean;
    setOpenModal: Dispatch<SetStateAction<boolean>>;
    setOpenAddModal: Dispatch<SetStateAction<boolean>>;
    onClose: () => void;
    onReset?: () => void;

    guest: {
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        special_requests: string;
    };

    date: string;
    timeRange: string;
    endTimeISO: string;

    table?: {
        label: string;
        capacity: number;
        location_tag: string | null;
    };

    partySize: string;
};

export default function ReservationConfirmationModal({ onClose, openModal, onReset, setOpenModal, setOpenAddModal, guest, date, timeRange, endTimeISO, table, partySize }: TProps) {
    return (
        <Dialog
            open={openModal}
            onOpenChange={(v) => {
                setOpenModal(v);
                if (!v) setOpenAddModal(false);
                if (onReset) onReset()
            }}
        >
            <DialogContent className="max-w-[450px] rounded-[10px] overflow-hidden bg-transparent flex items-center justify-center p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogTitle className='hidden'>Confirmation</DialogTitle>

                <div className="max-h-[90dvh] overflow-auto bg-[#F9FAFB] w-full p-6 border border-gray-100">

                    <div className="bg-white border border-gray-100 rounded-[10px] p-6 flex flex-col items-center text-center mb-6">
                        <div className="mb-1.5 relative">
                            <Image src={confirmedIcon} alt='' />
                        </div>

                        <h1 className="text-lg font-bold text-[#1A1A21] mb-2">Reservation confirmed</h1>
                        <p className="text-[#8C94A6] text-[14px] leading-relaxed mb-6">
                            {guest.first_name} {guest.last_name} is all set for {date}.<br />
                            Their table is locked in and the team is notified.
                        </p>

                        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#5F6976] px-4 py-2 rounded-full text-[13px] font-semibold">
                            <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></span>
                            {table?.label} • {date} • {timeRange} • Party of {partySize}
                        </div>
                    </div>

                    <div className="space-y-5 px-1 mb-4">
                        <DetailRow
                            label="Date and time"
                            value={`${date} - ${timeRange}`}
                            subValue={`Est. finish ${new Date(endTimeISO).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`}
                        />
                        <DetailRow
                            label="Guest"
                            value={`${guest.first_name} ${guest.last_name}`}
                            subValue={`${guest.phone} - ${guest.email}`}
                        />
                        <DetailRow
                            label="Table"
                            value={`${table?.label}`}
                            // value={`${table?.label} - ${table?.location_tag}`}
                            subValue={`${table?.capacity} seats`}
                        />
                        <DetailRow
                            label="Notes"
                            value={guest.special_requests || 'No special request'}
                            subValue=""
                        />
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">

                        <div className="flex flex-row sm:flex-col gap-3.5">

                            {/* <button className="flex-1 py-2.5 px-3 text-sm rounded-[8px] border border-[#667185] bg-white text-[#667185] font-semibold hover:bg-slate-50 transition-colors">
                                View reservation
                            </button> */}

                            {onReset &&
                                <button
                                    onClick={() => {
                                        setOpenModal(false);
                                        setOpenAddModal(true);
                                        onReset();
                                    }}
                                    className="flex-1 py-2.5 px-3 text-sm rounded-[8px] border border-[#667185] bg-white text-[#667185] font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                >
                                    <Plus size={20} className="text-[#CC400C]" />
                                    Add another
                                </button>
                            }

                            <button
                                onClick={() => {
                                    setOpenModal(false);
                                    setOpenAddModal(false);
                                    onClose();
                                    if (onReset) onReset()
                                }}
                                className="flex-1 py-2.5 px-4 text-sm rounded-[8px] border border-[#667185] bg-white text-[#667185] font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

            </DialogContent >
        </Dialog >
    );
}

function DetailRow({ label, value, subValue }: { label: string; value: string; subValue: string }) {
    return (
        <div className="flex justify-between items-start border-b border-gray-200 pb-4 ">
            <span className="text-slate-700 font-medium text-sm">{label}</span>
            <div className="text-right">
                <p className="text-slate-900 font-bold text-sm">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{subValue}</p>
            </div>
        </div>
    );
}