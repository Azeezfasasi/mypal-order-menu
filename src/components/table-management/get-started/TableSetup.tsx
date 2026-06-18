'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTableManagementSetup, Table } from '@/contexts/table-management-setup-context';
import { BusinessOperatingDayApi } from '@/services/api/operating-days-api';
import { Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const TableSetup = ({ next, prev }: { next: () => void, prev: () => void }) => {

    const { tables, setTables } = useTableManagementSetup();

    const [localTables, setLocalTables] = useState<Table[]>(
        tables.length
            ? tables
            : Array.from({ length: 2 }).map(() => ({
                name: '',
                seats: 1,
                location: 'indoor',
                quantity: 1
            }))
    )

    const updateTable = <K extends keyof Table>(
        index: number,
        key: K,
        value: Table[K]
    ) => {
        const updated = [...localTables]
        updated[index] = { ...updated[index], [key]: value }
        setLocalTables(updated)
    }

    const addTable = () => {
        setLocalTables(prev => [
            ...prev,
            {
                name: ``,
                seats: 1,
                location: 'indoor',
                quantity: 1,
            },
        ])
    }

    const removeTable = (index: number) => {
        if (localTables.length === 1) return
        setLocalTables(prev => prev.filter((_, i) => i !== index))
    }

    const handleContinue = () => {
        const isValidName = localTables.every(
            (t) => t.name.trim()
        )
        const isSeatValid = localTables.every(
            (t) => t.seats > 0
        )
        const isQuantityValid = localTables.every(
            (t) => t.quantity > 0
        )

        if (!isValidName) {
            toast.error('Please fill all table names')
            return
        }

        if (!isSeatValid) {
            toast.error('Seat cannot be 0.')
            return
        }

        if (!isQuantityValid) {
            toast.error('Quantity cannot be 0.')
            return
        }

        setTables(localTables)
        next()
    }

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

    // if (sortedOperatingDays && sortedOperatingDays?.length < 1) {
    //     toast.error('Please set up your operating days');
    //     return
    // };

    return (
        <div>
            {isLoadingOperatingDays ?
                <div className=' flex items-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Loading operating days ...
                </div>
                :
                (sortedOperatingDays && sortedOperatingDays?.length < 1) ?
                    <p className='mt-2 block text-[15px] text-[#363C44] font-medium'>Please setup your operating days to proceed. <Link href={'/services'} className='text-orange-600'>Click here to setup</Link></p>
                    :
                    <div className='w-full bg-white border border-[#E4E7EC] rounded-[10px] p-7 md:p-4'>
                        <h1 className='text-lg font-semibold mb-1'>Table Setup</h1>
                        <p className='text-[15px] md:text-sm text-[#8C94A6]'>
                            Add your tables and their capacity. You can always edit these later
                        </p>

                        <div className='mt-7 space-y-4'>

                            {/* ================= DESKTOP ================= */}
                            <div className='block md:hidden'>
                                <div className='text-[#475367] font-medium text-sm grid grid-cols-[repeat(21,_minmax(0,_1fr))] gap-3 mb-2'>
                                    <p className='col-span-5'>Table name</p>
                                    <p className='col-span-5'>Seats</p>
                                    <p className='col-span-5'>Quantity</p>
                                    <p className='col-span-6'>Location</p>
                                </div>

                                {localTables.map((table, index) => (
                                    <div
                                        key={index}
                                        className='text-[#475367] items-stretch font-medium text-sm grid grid-cols-[repeat(21,_minmax(0,_1fr))] gap-3 mb-2'
                                    >
                                        <Input
                                            value={table.name}
                                            onChange={(e) => updateTable(index, "name", e.target.value)}
                                            className='col-span-5 shadow-none text-sm placeholder:font-light'
                                            placeholder={`T${index + 1}`}
                                        />

                                        <Input
                                            value={table.seats}
                                            onChange={(e) => updateTable(index, "seats", Number(e.target.value))}
                                            className='shadow-none text-sm font-light border border-input h-9 col-span-5 px-2 rounded-[5px] appearance-none'
                                            placeholder='e.g 5'
                                        />
                                        <Input
                                            value={table.quantity}
                                            onChange={(e) => updateTable(index, "quantity", Number(e.target.value))}
                                            className='shadow-none text-sm font-light border border-input h-9 col-span-5 px-2 rounded-[5px] appearance-none'
                                            placeholder='e.g 5'
                                        />

                                        <div className='col-span-6 flex items-center gap-3'>
                                            <select
                                                value={table.location}
                                                onChange={(e) => updateTable(index, "location", e.target.value)}
                                                className='shadow-none text-sm font-light border border-input h-9 flex-1 px-2 rounded-[5px] appearance-none'
                                            >
                                                <option value="indoor">Indoor</option>
                                                <option value="outdoor">Outdoor</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => removeTable(index)}
                                                className='border border-input h-full aspect-square flex items-center justify-center rounded-[6px]'
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ================= MOBILE ================= */}
                            <div className='hidden md:block space-y-4'>
                                {localTables.map((table, index) => (
                                    <div
                                        key={index}
                                        className='border border-[#E4E7EC] rounded-[10px] p-3 space-y-3'
                                    >
                                        <div>
                                            <p className='text-xs text-[#8C94A6] mb-1'>Table name</p>
                                            <Input
                                                value={table.name}
                                                onChange={(e) => updateTable(index, "name", e.target.value)}
                                                className='text-sm'
                                                placeholder={`T${index + 1}`}
                                            />
                                        </div>

                                        <div>
                                            <p className='text-xs text-[#8C94A6] mb-1'>Seats</p>
                                            <Input
                                                value={table.seats}
                                                onChange={(e) => updateTable(index, "seats", Number(e.target.value))}
                                                className='text-sm'
                                                placeholder='e.g 5'
                                            />
                                        </div>

                                        <div>
                                            <p className='text-xs text-[#8C94A6] mb-1'>Quantity</p>
                                            <Input
                                                value={table.quantity}
                                                onChange={(e) => updateTable(index, "quantity", Number(e.target.value))}
                                                className='text-sm'
                                                placeholder='e.g 5'
                                            />
                                        </div>

                                        <div>
                                            <p className='text-xs text-[#8C94A6] mb-1'>Location</p>
                                            <select
                                                value={table.location}
                                                onChange={(e) => updateTable(index, "location", e.target.value)}
                                                className='w-full text-sm border border-input h-9 px-2 rounded-[5px]'
                                            >
                                                <option value="indoor">Indoor</option>
                                                <option value="outdoor">Outdoor</option>
                                            </select>
                                        </div>

                                        <div className='flex justify-end'>
                                            <button
                                                onClick={() => removeTable(index)}
                                                className='border border-input px-3 py-2 rounded-[6px]'
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ADD BUTTON */}
                            <button
                                onClick={addTable}
                                className='bg-[#F2F3F4] text-[#5F6976] w-full flex items-center gap-2 justify-start font-normal p-2 text-sm border border-[#D0D5DD] rounded-[6px]'
                            >
                                <Plus size={18} />
                                Add Table
                            </button>
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className='flex flex-row md:flex-col gap-3 items-center md:items-start justify-between md:justify-start mt-5'>
                            <Button
                                onClick={prev}
                                className='w-auto md:w-full shadow-none bg-white border border-[#667185] rounded-[8px] text-[#667185] hover:bg-gray-200'
                            >
                                Back
                            </Button>

                            <Button
                                onClick={handleContinue}
                                className='w-auto md:w-full shadow-none rounded-[8px]'
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
            }
        </div>
    )
}

export default TableSetup