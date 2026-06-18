import React, { useState } from 'react';
import { Plus, Minus, Loader2, Lock } from 'lucide-react';
import { TableViewResponse } from '@/types/table-management-types';
import Link from 'next/link';
import { TableManagementApi } from '@/services/api/table-management-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'

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

interface TableViewProps {
    currentDay: Date;
    setCurrentDay: (date: Date) => void;
    tableViewData: TableViewResponse | undefined;
    isLoading: boolean;
    operatingDays?: OperatingDay[];
}

interface TableCardProps {
    title: string;
    totalSet: number;
    booked: number;
    id: string;
    currentDay: Date;
}

const formatColDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const TableView = ({ currentDay, setCurrentDay, tableViewData, isLoading, operatingDays }: TableViewProps) => {

    const year = currentDay.getFullYear();
    const month = currentDay.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

    // Mirror exactly how ScheduleGrid derives isDayClosed
    const currentDayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' });
    const openDayNames = new Set((operatingDays ?? []).map(d => d.day));
    const isDayClosed = !!operatingDays && operatingDays.length > 0 && !openDayNames.has(currentDayName);

    return (
        <div>
            {/* Scrollable date header */}
            <div className="mx-5 overflow-x-auto mb-4">
                <div className="flex text-xs text-[#344054] bg-[#F9FAFB] w-max">
                    {dates.map((date, index) => {
                        const isActive = isSameDay(date, currentDay);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const isClosed = !!operatingDays && operatingDays.length > 0 && !openDayNames.has(dayName);

                        return (
                            <div
                                key={index}
                                onClick={() => setCurrentDay(new Date(date))}
                                className={`shrink-0 w-[120px] flex items-center justify-center gap-2 text-center whitespace-nowrap py-4 cursor-pointer transition-colors duration-150 border-r border-[#E1E3E7] last:border-r-0 ${isActive
                                    ? 'bg-[#E1E3E7] font-semibold text-[#101928]'
                                    : 'hover:bg-[#F0F1F3]'
                                    }`
                                }
                            >
                                {formatColDate(date)}

                                {isClosed && (
                                    // <div className="text-[10px] text-[#C0C5CC] mt-0.5">Closed</div>
                                    <Lock className='w-3 h-3' />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Body */}
            {isDayClosed ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="text-[#1D2739] font-semibold text-base mb-1">Closed</h3>
                    <p className="text-[#8C94A6] text-sm">
                        {currentDayName} is not an operating day for this business. To update operating days, Click <Link href={'/services'} className="text-orange-600 font-medium">here</Link>
                    </p>
                </div>
            ) : isLoading ? (
                <div className='mx-3 my-9 flex items-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    loading . . .
                </div>
            ) : !tableViewData ? (
                <p className="mx-5 my-9 text-sm text-gray-500">No data</p>
            ) : (
                <div className='px-5 space-y-4 mb-4'>
                    <h3 className='font-semibold text-[15px]'>Tables of today</h3>
                    {tableViewData.map((table) => (
                        <TableCard currentDay={currentDay} key={table.id} id={table.id} title={table.label} totalSet={table.total_quantity} booked={table.booked_today} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TableView;

// --- helper function to format date---
const formatDateLocal = (date: Date) => {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

// TableCard component
const TableCard = ({ id, currentDay, title, totalSet, booked }: TableCardProps) => {

    const updateTableQuantityMutation = TableManagementApi.useUpdateDateTableQuantity();
    const queryClient = useQueryClient();

    const remaining = totalSet - booked;
    const [inputValue, setInputValue] = useState(totalSet);
    const isFullyBooked = remaining <= 0;
    const progressWidth = Math.min((booked / totalSet) * 100, 100);
    const [error, setError] = useState('');

    const hasChanged = inputValue !== totalSet;

    const handleApply = () => {

        const payload = {
            table_id: id,
            dates: [
                formatDateLocal(currentDay),
            ],
            quantity_override: inputValue
        };

        console.log(payload);

        updateTableQuantityMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Table quantity updated.')
                queryClient.invalidateQueries({
                    queryKey: ['tables', 'table-view']
                })
            }
        })
    };

    return (
        <div className={`p-3 rounded-xl border mb-4 transition-colors ${isFullyBooked ? 'bg-[#FEF2EE]' : 'bg-[#F9FAFB]'
            } border-[#E1E3E7]`}>

            <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>

                <span className={`px-3 py-0.5 rounded-full text-sm font-medium border ${isFullyBooked
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-green-50 text-green-600 border-green-200'
                    }`}>
                    {isFullyBooked ? 'Booked' : 'Available'}
                </span>
            </div>

            <div className="text-sm text-slate-500 mb-4">
                {isFullyBooked ? (
                    <p>Fully Booked</p>
                ) : (
                    <p>{remaining} of {totalSet} available - {booked} Booked today</p>
                )}
            </div>

            <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">
                    {totalSet} set, {booked} booked, {remaining < 0 ? 0 : remaining} remaining
                </p>

                <div className="w-full h-2 bg-gray-100 border border-gray-300 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-orange-600 transition-all duration-500 ease-out"
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between sm:justify-end items-center">
                <span className="text-sm text-slate-500 sm:hidden">
                    Update tables for today
                </span>

                <div className="flex items-center gap-3">

                    <div className="flex items-center bg-gray-100 rounded-md overflow-hidden">

                        <button
                            onClick={() => setInputValue(prev => prev + 1)}
                            className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <Plus size={18} />
                        </button>

                        <span className="px-3 font-semibold text-gray-700 min-w-[32px] text-center">
                            {inputValue}
                        </span>

                        <button
                            disabled={inputValue <= 0}
                            onClick={() => {

                                if (inputValue <= booked) {
                                    setError(`Cannot go below ${booked} booked table${booked > 1 ? 's' : ''}`);

                                    setTimeout(() => setError(''), 2500);

                                    return;
                                }

                                setError('');

                                setInputValue(prev => prev - 1);
                            }}
                            className="p-1.5 hover:bg-gray-200 text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Minus size={18} />
                        </button>

                    </div>

                    <button
                        onClick={handleApply}
                        disabled={!hasChanged || updateTableQuantityMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        {updateTableQuantityMutation.isPending ?
                            <Loader2 className='w-4 h-4 animate-spin' />
                            :
                            'Apply'
                        }
                    </button>

                </div>
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-2 text-right">
                    {error}
                </p>
            )}
        </div>
    );
};