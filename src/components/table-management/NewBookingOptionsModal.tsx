'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

type Props = {
    open: boolean;
    setOpen: (val: boolean) => void;
    onSelectNewReservation: () => void;
    onSelectThirdPartyReservation: () => void;
};

const NewBookingOptionsModal = ({ open, setOpen, onSelectNewReservation, onSelectThirdPartyReservation }: Props) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[500px] rounded-[10px] px-4!">
                <DialogHeader>
                    <DialogTitle className='font-bold'>Select Booking Type</DialogTitle>
                </DialogHeader>

                <div className="mt-4 mb-2 flex flex-col gap-3">
                    {/* Option 1 */}
                    <div
                        onClick={() => {
                            setOpen(false);
                            onSelectNewReservation();
                        }}
                        className="flex items-center justify-between p-4 border border-[#E4E7EC] rounded-[20px] text-left hover:bg-[#F9FAFB] transition"
                    >
                        <div>
                            <h3 className="font-semibold text-[#1D2739]">
                                Make new reservation
                            </h3>
                            <p className="text-xs text-[#667185]">
                                Create a booking directly for a customer
                            </p>
                        </div>
                        <button className='bg-[#EB5017] text-white h-8 w-8 rounded-full flex items-center justify-center'>
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Option 2 */}
                    <div
                        onClick={() => {
                            setOpen(false);
                            onSelectThirdPartyReservation();
                        }}
                        className="flex items-center justify-between p-4 border border-[#E4E7EC] rounded-[20px] text-left hover:bg-[#F9FAFB] transition"
                    >
                        <div>
                            <h3 className="font-semibold text-[#1D2739]">
                                Record from External platform
                            </h3>
                            <p className="text-xs text-[#667185]">
                                Log bookings from external platforms
                            </p>
                        </div>

                        <button className='bg-[#EB5017] text-white h-8 w-8 rounded-full flex items-center justify-center'>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewBookingOptionsModal;