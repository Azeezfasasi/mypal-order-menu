import { Button } from '@/components/ui/button'
import { useTableManagementSetup } from '@/contexts/table-management-setup-context';
import { BusinessOperatingDayApi } from '@/services/api/operating-days-api';
import { TableManagementApi } from '@/services/api/table-management-api';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const ReviewLaunch = ({ prev }: { prev: () => void }) => {

    const { tables, bookingRules } = useTableManagementSetup();

    const router = useRouter();

    const addBulkTablesMutation = TableManagementApi.useCreateBulkTable();
    const updateBookingRulesMutation = TableManagementApi.useUpdateBookingRules();

    const activeRules = [
        bookingRules.autoConfirm && "Auto-confirm",
        bookingRules.waitlist && "Waitlist",
        bookingRules.deposit && "Deposit",
        bookingRules.peakPricing && "Peak pricing",
    ].filter(Boolean);

    const queryClient = useQueryClient();

    const handleSubmit = async () => {

        if (!tables.length) return;

        if (sortedOperatingDays && sortedOperatingDays?.length < 1) {
            toast.error('Please set up your operating days');
            return
        };

        try {
            const tablesPayload = tables.map((t) => ({
                label: t.name,
                capacity: t.seats,
                location: t.location,
                is_active: true,
                quantity: t.quantity,
            }));

            console.log(tablesPayload)

            await Promise.all([
                updateBookingRulesMutation.mutateAsync({
                    turn_time: bookingRules.turnTime,
                    min_notice: bookingRules.minNotice,
                    auto_confirm: bookingRules.autoConfirm,
                    waitlist_mode: bookingRules.waitlist,
                    deposit_required: bookingRules.deposit,
                    peak_pricing: bookingRules.peakPricing,
                }),
                addBulkTablesMutation.mutateAsync(tablesPayload)
            ]);

            queryClient.invalidateQueries({
                queryKey: ['tables', 'status']
            })

            setTimeout(() => {
                router.replace('/table-management/view');
            }, 1000)


        } catch (error) {
            console.error(error);
        }
    };

    const isLoading = updateBookingRulesMutation.isPending || addBulkTablesMutation.isPending;

    const { data: operatingDaysResponse, isLoading: isLoadingOperatingDays } =
        BusinessOperatingDayApi.useGetBusinessOperatingDays();

    const operatingDays = operatingDaysResponse?.data;

    const WEEK_ORDER = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    const sortedOperatingDays = operatingDays
        ?.filter(d => d.day)
        ?.slice()
        ?.sort(
            (a, b) =>
                WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day)
        );


    return (
        <div className='w-full bg-white border border-[#E4E7EC] rounded-[10px] p-7 md:p-4'>
            <h1 className='text-lg font-semibold mb-1'>Review & Launch</h1>
            <p className='text-[15px] text-[#8C94A6]'>Everything looks good? launch to go live</p>

            {/* <div className='mt-8'>
                <h4 className='text-sm font-normal text-[#363C44] mb-2'>RESTAURANT</h4>
                <div className='text-sm font-normal text-[#363C44] border p-4 rounded-[10px] space-y-2'>
                    <div className='flex items-center justify-between w-full'>
                        <p>Name</p>
                        <p>Restaurant name</p>
                    </div>
                    <div className='flex items-center justify-between w-full'>
                        <p>Type</p>
                        <p>Fine Dining</p>
                    </div>
                    <div className='flex items-center justify-between w-full'>
                        <p>Location</p>
                        <p>Ikeja</p>
                    </div>
                    <div className='flex items-center justify-between w-full'>
                        <p>Email</p>
                        <p>hello@reaturantname.com</p>
                    </div>
                </div>
            </div> */}

            <div className='mt-4'>
                <h4 className='text-sm font-normal text-[#363C44] mb-2'>OPERATING DAYS/HOURS</h4>
                <div className='text-sm font-normal text-[#363C44] border p-4 rounded-[10px] space-y-2'>
                    {isLoadingOperatingDays ?
                        <div className=' flex items-center gap-2'>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Loading operating hours...
                        </div>
                        :
                        sortedOperatingDays?.map((data) => (
                            <div key={data.id} className='flex items-center justify-between w-full'>
                                <p>{data.day}</p>
                                <p>
                                    {data.is_24_hours
                                        ? "24 Hours"
                                        : `${data.opening_time} - ${data.closing_time}`}
                                </p>
                            </div>
                        ))}
                </div>
                {(sortedOperatingDays && sortedOperatingDays?.length < 1) && <p className='mt-2 text-right block text-sm text-[#363C44] font-medium'>To update operating days, click <Link href={'/services'} className='text-orange-600'>here</Link></p>}

            </div>
            <div className='mt-8'>
                <h4 className='text-sm font-normal text-[#363C44] mb-2'>TABLES</h4>
                <div className='text-sm font-normal text-[#363C44] border p-4 rounded-[10px] space-y-2'>
                    <div className='flex items-center justify-between w-full'>
                        <p>No. of Tables</p>
                        <p>{tables.length}</p>
                    </div>
                    <div className='flex items-center justify-between w-full'>
                        <p>Turn time</p>
                        <p>{bookingRules.turnTime} minutes</p>
                    </div>
                </div>
            </div>

            {/* <div className='mt-8'>
                <h4 className='text-sm font-normal text-[#363C44] mb-2'>ACTIVE RULES</h4>
                <div className='text-sm font-normal text-[#363C44] border p-4 rounded-[10px] flex items-center gap-3'>
                    <div className='bg-[#FEE1D8] text-[#363C44] rounded-[4px] text-sm px-4 py-2'>
                        Auto-confirm
                    </div>
                    <div className='bg-[#FEE1D8] text-[#363C44] rounded-[4px] text-sm px-4 py-2'>
                        Waitlist
                    </div>
                    <div className='bg-[#FEE1D8] text-[#363C44] rounded-[4px] text-sm px-4 py-2'>
                        Deposit
                    </div>
                </div>
            </div> */}

            <div className='mt-8'>
                <h4 className='text-sm font-normal text-[#363C44] mb-2'>ACTIVE RULES</h4>
                <div className='text-sm font-normal text-[#363C44] border p-4 rounded-[10px] flex flex-wrap items-center gap-3'>
                    {activeRules.length === 0 ?
                        <p className="text-sm text-gray-400">No active rules</p>

                        :

                        activeRules.map((rule, i) => (
                            <div key={i} className='bg-[#FEE1D8] text-[#363C44] rounded-[4px] text-sm px-4 py-2'>
                                {rule}
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className='flex items-center justify-between mt-5'>
                <Button onClick={prev} className='shadow-none bg-white border border-[#667185] rounded-[8px] text-[#667185] hover:bg-gray-200'>
                    Back
                </Button>
                <Button disabled={isLoading || isLoadingOperatingDays } onClick={handleSubmit} className='shadow-none rounded-[8px] disabled:opacity-60'>
                    {isLoading ?
                        'loading . . .'
                        :
                        'Launch Restaurant'
                    }
                </Button>
            </div>
        </div>
    )
}

export default ReviewLaunch