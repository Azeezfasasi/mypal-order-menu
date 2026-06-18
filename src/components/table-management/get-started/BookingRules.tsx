'use client'
import { Button } from "@/components/ui/button"
import { useTableManagementSetup } from "@/contexts/table-management-setup-context";

const BookingRules = ({ next, prev }: { next: () => void, prev: () => void }) => {

    const { bookingRules, setBookingRules } = useTableManagementSetup();

    type BooleanKeys = 'autoConfirm' | 'waitlist' | 'deposit' | 'peakPricing'

    const toggle = (key: BooleanKeys) => {
        setBookingRules(prev => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    const handleContinue = () => {
        if (!bookingRules.turnTime || !bookingRules.minNotice) {
            alert('Please complete booking rules')
            return
        }
        next()
    }

    return (
        <div className='w-full bg-white border border-[#E4E7EC] rounded-[10px] p-7 sm:p-5'>

            <h1 className='text-lg font-semibold mb-1'>Booking Rules</h1>
            <p className='text-[15px] sm:text-sm text-[#8C94A6]'>
                Choose how the system handles reservations and turn times.
            </p>

            <div className='mt-7 space-y-3'>

                {/* GRID */}
                <div className='text-[#475367] items-stretch font-medium text-sm grid grid-cols-2 sm:grid-cols-1 gap-3'>

                    {/* TURN TIME */}
                    <div className="flex flex-col gap-1">
                        <label>Turn time (hr/mins)</label>
                        <select
                            className='shadow-none text-sm font-light border border-input h-9 px-2 rounded-[5px]'
                            value={bookingRules.turnTime}
                            onChange={(e) =>
                                setBookingRules(prev => ({
                                    ...prev,
                                    turnTime: Number(e.target.value),
                                }))
                            }
                        >
                            <option value={60}>60 mins (1hr)</option>
                            <option value={90}>90 mins (1hr 30 mins)</option>
                            <option value={120}>120 mins (2 hrs)</option>
                        </select>
                    </div>

                    {/* MIN NOTICE */}
                    <div className="flex flex-col gap-1">
                        <label>Min notice (mins)</label>
                        <select
                            value={bookingRules.minNotice}
                            onChange={(e) =>
                                setBookingRules(prev => ({
                                    ...prev,
                                    minNotice: Number(e.target.value),
                                }))
                            }
                            className='shadow-none text-sm font-light border border-input h-9 px-2 rounded-[5px]'
                        >
                            <option value={15}>15 mins</option>
                            <option value={30}>30 mins</option>
                            <option value={60}>60 mins</option>
                        </select>
                    </div>

                    {/* CARD TEMPLATE */}
                    {[
                        {
                            key: "autoConfirm",
                            title: "Auto Confirm Booking",
                            desc: "No manual approval needed. Reservation confirm instantly.",
                        },
                        {
                            key: "waitlist",
                            title: "Waitlist mode",
                            desc: "Allow guests to join a waitlist when fully booked",
                        },
                        {
                            key: "deposit",
                            title: "Deposit required",
                            desc: "Collect a deposit at booking to reduce no shows.",
                        },
                        {
                            key: "peakPricing",
                            title: "Peak pricing",
                            desc: "Enable dynamic pricing on Fri & Sat evenings",
                        },
                    ].map((item) => {
                        const isActive = bookingRules[item.key as keyof typeof bookingRules];

                        return (
                            <div
                                key={item.key}
                                className={`rounded-[8px] p-4 sm:p-3 border ${isActive
                                        ? 'bg-[#FEF2EE] border-[#F85B2B]'
                                        : 'bg-[#F9FAFB] border-[#F9FAFB]'
                                    }`}
                            >
                                <div className="shadow-md w-8 h-8 rounded-[8px] border border-[#FCD2C2] flex items-center justify-center bg-white mb-4">
                                    <input
                                        checked={isActive as boolean}
                                        onChange={() => toggle(item.key as BooleanKeys)}
                                        className="h-5 w-5 accent-[#F56630]"
                                        type="checkbox"
                                    />
                                </div>

                                <h3 className="font-semibold text-[#1D2739] text-base sm:text-sm mb-2">
                                    {item.title}
                                </h3>

                                <p className="text-sm sm:text-xs text-[#667185]">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER */}
            <div className='flex items-center justify-between sm:flex-col sm:gap-3 mt-5'>
                <Button
                    onClick={prev}
                    className='shadow-none bg-white border border-[#667185] rounded-[8px] text-[#667185] hover:bg-gray-200 sm:w-full'
                >
                    Back
                </Button>

                <Button
                    onClick={handleContinue}
                    className='shadow-none rounded-[8px] sm:w-full'
                >
                    Continue
                </Button>
            </div>
        </div>
    )
}

export default BookingRules