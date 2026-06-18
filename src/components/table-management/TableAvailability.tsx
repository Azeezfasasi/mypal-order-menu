'use client'
import { ChevronLeft, ChevronRight, CirclePlus, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import ScheduleGrid from "./ScheduleGrid"
import { useEffect, useMemo, useState } from "react"
import StatsOverview from "./StatOverview"
import { TableManagementApi } from "@/services/api/table-management-api"
import { useRouter } from "next/navigation"
import NewBookingOptionsModal from "./NewBookingOptionsModal"
import AddReservationModal from "./AddReservationModal"
import AddThirdPartyReservationModal from "./AddThirdPatryReservationModal"
import Link from "next/link"
import TableView from "./TableView"

// Add this helper outside the component (above the TableAvailability function):
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
};

const formatDayList = (days: string[]): string => {
    if (days.length === 0) return '';

    // Sort by day-of-week order
    const sorted = [...days].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));

    // Group into consecutive runs
    const runs: string[][] = [];
    let current: string[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const prevIdx = DAYS_OF_WEEK.indexOf(sorted[i - 1]);
        const currIdx = DAYS_OF_WEEK.indexOf(sorted[i]);
        if (currIdx === prevIdx + 1) {
            current.push(sorted[i]);
        } else {
            runs.push(current);
            current = [sorted[i]];
        }
    }
    runs.push(current);

    // Format each run: 3+ consecutive → "Mon to Wed", 2 → "Mon, Tue", 1 → "Mon"
    return runs.map(run => {
        if (run.length >= 3) {
            return `${DAY_SHORT[run[0]]} to ${DAY_SHORT[run[run.length - 1]]}`;
        }
        return run.map(d => DAY_SHORT[d]).join(', ');
    }).join(', ');
};

const TableAvailability = () => {

    const [tab, setTab] = useState<'week' | 'day' | 'insights' | 'table'>('week');
    const router = useRouter();

    const [currentMonth, setCurrentMonth] = useState(new Date()); // controls month switch
    const [currentDay, setCurrentDay] = useState(new Date()); // for day navigation

    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const getLastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const formatDateLocal = (date: Date) => {

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const { startDate, endDate } = useMemo(() => {

        if (tab === "week" || tab === "insights") {
            return {
                startDate: getFirstDayOfMonth(currentMonth),
                endDate: getLastDayOfMonth(currentMonth)
            }
        }

        if (tab === "day") {
            return {
                startDate: currentDay,
                endDate: currentDay
            };
        }

        if (tab === "table") {
            return {
                startDate: currentDay,
                endDate: currentDay
            };
        }

        return { startDate: null, endDate: null };
    }, [tab, currentMonth, currentDay]);

    useEffect(() => {
        console.log('START DATE: ', startDate)
        console.log('END DATE: ', endDate)
    }, [startDate, endDate])

    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);

            // sync day immediately
            setCurrentDay(getFirstDayOfMonth(newMonth));

            return newMonth;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);

            // sync day immediately
            setCurrentDay(getFirstDayOfMonth(newMonth));

            return newMonth;
        });
    };

    const { data: weekGridResponse } = TableManagementApi.useGetWeekGrid({
        data: {
            start_date: startDate ? formatDateLocal(startDate) : '',
            end_date: endDate ? formatDateLocal(endDate) : '',
        },
        trigger: tab === 'week'
    })

    const weekGridData = weekGridResponse?.data;

    const { data: insightsResponse, isLoading: isLoadingInsights } = TableManagementApi.useGetInsights({
        data: {
            start_date: startDate ? formatDateLocal(startDate) : '',
            end_date: endDate ? formatDateLocal(endDate) : '',
        },
        trigger: tab === 'insights'
    })

    const insightsData = insightsResponse?.data;

    const { data: dayGridResponse } = TableManagementApi.useGetDayGrid({
        day: startDate ? formatDateLocal(startDate) : '',
        trigger: tab === 'day'
    })

    const dayGridData = dayGridResponse?.data;

    const { data: tableViewResponse, isLoading: isLoadingTableView } = TableManagementApi.useGetTableView({
        day: startDate ? formatDateLocal(startDate) : '',
        trigger: tab === 'table'
    })

    const tableViewData = tableViewResponse?.data;

    const [openBookingOptions, setOpenBookingOptions] = useState(false);
    const [openReservationModal, setOpenReservationModal] = useState(false);
    const [openThirdPartyReservationModal, setOpenThirdPartyReservationModal] = useState(false);

    const { data: operatingDaysResponse, isLoading: isLoadingOperatingDays } = TableManagementApi.useGetBusinessOperatingDays();
    const operatingDays = operatingDaysResponse?.data;

    const { data: allTableResponse, isLoading: isLoadingTables } = TableManagementApi.useGetAllTables();
    const tablesList = allTableResponse?.data;

    // Inside TableAvailability, after `const operatingDays = operatingDaysResponse?.data;`:
    const openDays = (operatingDays ?? [])
        .filter(d => d.day && DAYS_OF_WEEK.includes(d.day))
        .map(d => d.day);

    const closedDays = DAYS_OF_WEEK.filter(d => !openDays.includes(d));

    const openLabel = openDays.length > 0 ? `Open: ${formatDayList(openDays)}` : 'No open days';
    const closedLabel = closedDays.length > 0 ? `Closed: ${formatDayList(closedDays)}` : 'Open all week';

    return (
        <>
            <div className="flex sm:flex-col sm:gap-2 items-start justify-between mb-3">
                <h3 className="text-xl font-semibold sm:mb-2">Manage Your Tables</h3>
                <div className="flex items-center gap-2 justify-end sm:mb-2">
                    <Button
                        onClick={() => setOpenBookingOptions(true)}
                        className="bg-[#EB5017] text-white font-semibold flex items-center gap-2 rounded-[8px] shadow-none"
                    >
                        <CirclePlus size={18} />
                        New Booking
                    </Button>
                    <Button onClick={() => router.push('/table-management/table-setup')} className="bg-white text-[#EB5017] border border-[#EB5017] hover:bg-gray-200 font-semibold flex items-center gap-2 rounded-[8px] shadow-none">
                        View Tables
                    </Button>
                </div>
            </div>

            <div className="w-full rounded-[10px] border border-[#E4E7EC] min-h-[400px]">

                {/* --- HEADER --- */}
                <div className="border-b border-[#E1E3E7] p-3 flex md:flex-col md:gap-3 items-center md:items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-[5px] border border-[#E1E3E7]">
                            <div onClick={handlePrevMonth} className="border-r border-[#E1E3E7] p-2 cursor-pointer">
                                <ChevronLeft size={18} />
                            </div>
                            <div className="p-2 text-sm font-semibold">
                                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                            </div>
                            <div onClick={handleNextMonth} className="border-l border-[#E1E3E7] p-2 cursor-pointer">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex md:flex-wrap items-center gap-2">
                            <div className="px-2 py-1 rounded-full flex items-center gap-2 border border-[#E1E3E7]">
                                <div className="w-4 h-4 rounded-full bg-[#35A853]" />
                                <p className="text-[13px] text-[#5F6976]">Available</p>
                            </div>
                            <div className="px-2 py-1 rounded-full flex items-center gap-2 border border-[#E1E3E7]">
                                <div className="w-4 h-4 rounded-full bg-[#F5BB41]" />
                                <p className="text-[13px] text-[#5F6976]">Partially booked</p>
                            </div>
                            <div className="px-2 py-1 rounded-full flex items-center gap-2 border border-[#E1E3E7]">
                                <div className="w-4 h-4 rounded-full bg-[#DC2626]" />
                                <p className="text-[13px] text-[#5F6976]">Fully booked</p>
                            </div>
                            <div className="px-2 py-1 rounded-full flex items-center gap-2 border border-[#E1E3E7]">
                                <div className="w-4 h-4 rounded-full bg-black" />
                                <p className="text-[13px] text-[#5F6976]">Blocked</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- FILTER --- */}
                <div className="border-b border-[#E1E3E7] flex justify-between items-center p-5 sm:px-1">
                    <div className="border-b border-[#E4E7EC] flex items-center ">
                        <div onClick={() => setTab('week')} className={`cursor-pointer text-sm font-semibold pb-3 px-6 sm:px-4 ${tab === 'week' ? 'border-b border-[#F56630] text-[#F56630]' : 'text-[#344054]'} `}>
                            Week <span className="sm:hidden">grid</span>
                        </div>
                        <div
                            onClick={() => {
                                setTab('day');

                                const isCurrentMonth =
                                    currentMonth.getMonth() === new Date().getMonth() &&
                                    currentMonth.getFullYear() === new Date().getFullYear();

                                setCurrentDay(
                                    isCurrentMonth ? new Date() : getFirstDayOfMonth(currentMonth)
                                );
                            }}
                            className={`cursor-pointer text-sm font-semibold pb-3 px-6 sm:px-4 ${tab === 'day' ? 'border-b border-[#F56630] text-[#F56630]' : 'text-[#344054]'} `}
                        >
                            Day <span className="sm:hidden">view</span>
                        </div>
                        <div onClick={() => setTab('insights')} className={`cursor-pointer text-sm font-semibold pb-3 px-6 sm:px-3 ${tab === 'insights' ? 'border-b border-[#F56630] text-[#F56630]' : 'text-[#344054]'} `}>
                            Insights
                        </div>
                        <div
                            onClick={() => {
                                setCurrentDay(getFirstDayOfMonth(currentMonth));
                                setTab('table');
                            }}
                            className={`cursor-pointer text-sm font-semibold pb-3 px-6 sm:px-4 ${tab === 'table'
                                ? 'border-b border-[#F56630] text-[#F56630]'
                                : 'text-[#344054]'
                                }`}
                        >
                            Table <span className="sm:hidden">view</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <button className="cursor-default text-[13px] text-[#344054] py-1.5 px-3 rounded-[5px] border border-[#D0D5DD] font-semibold">
                            {openLabel}
                        </button>
                        <button className="cursor-default text-[13px] text-[#344054] py-1.5 px-3 rounded-[5px] border border-[#D0D5DD] font-semibold">
                            {closedLabel}
                        </button>
                        <button onClick={() => router.push('/services')} className="text-[13px] text-[#344054] py-1.5 px-3 rounded-[5px] border border-[#D0D5DD] hover:bg-gray-200 duration-200 font-semibold">
                            Edit
                        </button>
                    </div>
                </div>
                {(isLoadingOperatingDays || isLoadingTables) ?
                    <div className="flex items-center gap-2 text-sm m-5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        loading configurations . . .
                    </div>
                    :
                    operatingDays && operatingDays.length === 0 ?
                        <p className="m-5 font-medium">
                            Setup your operating days <Link href={'/services'} className="text-[#EB5017]">here. </Link>
                        </p>
                        :
                        tablesList && tablesList.length === 0 ?
                            <p className="m-5 font-medium">
                                You don&apos;t have any tables. Setup your tables <Link href={'/table-management/table-setup'} className="text-[#EB5017]">here. </Link>
                            </p>
                            :
                            <>
                                {tab === 'week' &&
                                    <ScheduleGrid
                                        tab="week"
                                        weekData={weekGridData}
                                        currentDay={currentDay}
                                        setCurrentDay={setCurrentDay}
                                        operatingDays={operatingDays}
                                    />
                                }
                                {tab === 'day' &&
                                    <ScheduleGrid
                                        tab={'day'}
                                        dayData={dayGridData}
                                        currentDay={currentDay}
                                        setCurrentDay={setCurrentDay}
                                        operatingDays={operatingDays}
                                    />
                                }
                                {tab === 'insights' &&
                                    <>
                                        {isLoadingInsights ?
                                            <div className="flex items-center gap-2 text-sm m-5">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                loading . . .
                                            </div>
                                            :
                                            insightsData ?
                                                <StatsOverview data={insightsData} />
                                                :
                                                <></>
                                        }
                                    </>
                                }
                                {tab === 'table' &&
                                    <TableView
                                        isLoading={isLoadingTableView}
                                        tableViewData={tableViewData}
                                        currentDay={currentDay}
                                        setCurrentDay={setCurrentDay}
                                        operatingDays={operatingDays}
                                    />
                                }
                            </>}

                <NewBookingOptionsModal
                    open={openBookingOptions}
                    setOpen={setOpenBookingOptions}
                    onSelectNewReservation={() => setOpenReservationModal(true)}
                    onSelectThirdPartyReservation={() => setOpenThirdPartyReservationModal(true)}
                />

                <AddReservationModal
                    openModal={openReservationModal}
                    setOpenModal={setOpenReservationModal}
                    operatingDays={operatingDays}  // ← add
                />

                <AddThirdPartyReservationModal
                    openModal={openThirdPartyReservationModal}
                    setOpenModal={setOpenThirdPartyReservationModal}
                    operatingDays={operatingDays}  // ← add
                />

            </div>
        </>
    )
}

export default TableAvailability