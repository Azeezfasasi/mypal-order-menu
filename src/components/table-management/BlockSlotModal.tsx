'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dispatch, SetStateAction, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { TableManagementApi } from '@/services/api/table-management-api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface BlockSlotDTO {
    date: string;
    start_time: string;
    end_time: string;
    table_id?: string;
    reason?: string;
}

type TProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    data: BlockSlotDTO | null;
}

const BlockSlotModal = ({ open, setOpen, data }: TProps) => {
    const [reason, setReason] = useState('');

    const handleClose = () => {
        setReason('');
        setOpen(false);
    };

    const blockSlotMutation = TableManagementApi.useBlockSlot();
    const queryClient = useQueryClient();


    const handleBlock = () => {
        if (!data) return;

        const payload: BlockSlotDTO = {
            date: data.date,
            start_time: data.start_time,
            end_time: data.end_time,
            ...(data.table_id && { table_id: data.table_id }),
            ...(reason.trim() && { reason: reason.trim() }),
        };

        console.log('BLOCK SLOT PAYLOAD:', payload);

        blockSlotMutation.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['tables']
                });
                toast.success('Slot blocked.')
                handleClose();
            }
        })

        // TODO: call API here
    };

    const formatDisplay = (iso: string) => {
        return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-[440px] rounded-[12px] bg-white"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center">
                            <ShieldAlert size={18} className="text-[#B42318]" />
                        </div>
                        <DialogTitle className="text-[#1D2739] text-base font-bold">
                            Block this slot?
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {data && (
                    <div className="space-y-4">
                        {/* Slot summary */}
                        <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-[10px] p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[#667185]">Date</span>
                                <span className="text-[#344054] font-medium">{data.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#667185]">Time</span>
                                <span className="text-[#344054] font-medium">
                                    {formatDisplay(data.start_time)} – {formatDisplay(data.end_time)}
                                </span>
                            </div>
                            {data.table_id && (
                                <div className="flex justify-between">
                                    <span className="text-[#667185]">Scope</span>
                                    <span className="text-[#344054] font-medium">This table only</span>
                                </div>
                            )}
                            {!data.table_id && (
                                <div className="flex justify-between">
                                    <span className="text-[#667185]">Scope</span>
                                    <span className="text-[#344054] font-medium">All tables</span>
                                </div>
                            )}
                        </div>

                        {/* Reason input */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#344054]">
                                Reason <span className="text-[#98A2B3] font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Private event, maintenance, staff break..."
                                rows={3}
                                className="w-full py-2 px-3 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#F56630] outline-none placeholder:text-[#98A2B3] resize-none"
                            />
                        </div>

                        {/* Warning note */}
                        <p className="text-xs text-[#667185] bg-[#FFFAEB] border border-[#FEF0C7] rounded-[8px] px-3 py-2">
                            Blocking this slot will prevent new reservations from being made for this time period.
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={handleClose}
                                className="flex-1 py-2 border border-[#D0D5DD] text-[#344054] font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={blockSlotMutation.isPending}
                                className="flex-1 py-2 bg-[#B42318] text-white font-semibold rounded-lg text-sm hover:bg-[#912018] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {blockSlotMutation.isPending ?
                                    'loading . . .'
                                    :
                                    'Block slot'
                                }
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BlockSlotModal;