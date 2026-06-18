/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableManagementApi } from '@/services/api/table-management-api';
import { ArrowLeft, Loader2, Pen, Plus, /* Trash2, */ } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type Table = {
    id?: string;
    name: string;
    seats: number;
    quantity: number;
    location: string;

    isNew?: boolean;
    isEditing?: boolean;
    original?: {
        name: string;
        seats: number;
        location: string;
    };
}

const TableSetupPage = () => {

    const router = useRouter();

    const { data: allTableResponse, isLoading } = TableManagementApi.useGetAllTables();
    const tablesList = allTableResponse?.data;

    const [localTables, setLocalTables] = useState<Table[]>([]);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (tablesList) {
            setLocalTables(
                tablesList.map((t) => ({
                    id: t.id,
                    name: t.label,
                    seats: t.capacity,
                    location: t.location_tag ?? 'indoor',
                    quantity: t.quantity,
                    isNew: false,
                    isEditing: false,
                }))
            );
        }
    }, [tablesList]);

    const { mutate: addTableMutation } = TableManagementApi.useAddSingleTable();
    const { mutate: updateTableMutation } = TableManagementApi.useUpdateSingleTable();
    // const { mutate: deleteTableMutation } = TableManagementApi.useDeleteSingleTable();


    const handleChange = (index: number, field: keyof Table, value: any) => {
        setLocalTables(prev =>
            prev.map((t, i) =>
                i === index ? { ...t, [field]: value } : t
            )
        );
    };

    const addTable = () => {
        setLocalTables(prev => [
            ...prev,
            {
                id: undefined,
                name: '',
                seats: 1,
                location: 'indoor',
                quantity: 1,
                isNew: true,
                isEditing: true, // ✅ immediately editable
            },
        ]);
    };

    const handleEdit = (index: number) => {
        setLocalTables(prev =>
            prev.map((t, i) =>
                i === index
                    ? {
                        ...t,
                        isEditing: true,
                        original: {
                            name: t.name,
                            seats: t.seats,
                            location: t.location,
                        },
                    }
                    : t
            )
        );
    };

    const handleCancel = (index: number) => {
        setLocalTables(prev =>
            prev.map((t, i) => {
                if (i !== index) return t;

                // if it's a new row → remove it
                if (t.isNew) {
                    return null;
                }

                return {
                    ...t,
                    ...t.original,
                    isEditing: false,
                    original: undefined,
                };
            }).filter(Boolean) as Table[]
        );
    };

    const handleSave = (table: Table, index: number) => {
        if (!table.name.trim()) {
            toast.error('Table name required');
            return;
        }

        if (table.seats <= 0) {
            toast.error('Seats must be greater than 0');
            return;
        }

        const payload = {
            label: table.name,
            capacity: table.seats,
            location_tag: table.location,
            quantity: table.quantity,
            is_active: true,
        };

        if (table.isNew) {
            // ✅ ADD API fully integrated
            addTableMutation(payload, {
                onSuccess: () => {
                    toast.success('Table added');
                    queryClient.invalidateQueries({ queryKey: ['tables', 'list'] });
                },
            });
        } else {
            updateTableMutation(
                {
                    table_id: table.id!,
                    data: payload,
                },
                {
                    onSuccess: () => {
                        toast.success('Table updated');
                        queryClient.invalidateQueries({ queryKey: ['tables', 'list'] });
                    },
                }
            );
        }

        // exit edit mode locally
        setLocalTables(prev =>
            prev.map((t, i) =>
                i === index
                    ? { ...t, isEditing: false, isNew: false }
                    : t
            )
        );
    };

    // const handleDelete = (table: any, index: number) => {
    //     if (table.isNew) {
    //         // just remove locally
    //         setLocalTables(prev => prev.filter((_, i) => i !== index));
    //         return;
    //     }

    //     deleteTableMutation(
    //         { table_id: table.id },
    //         {
    //             onSuccess: () => {
    //                 toast.success('Table deleted');
    //                 queryClient.invalidateQueries({ queryKey: ['tables', 'list'] });
    //                 setLocalTables(prev => prev.filter((t) => t.id !== table.id));
    //             },
    //         }
    //     );
    // };

    return (
        <div className='w-full max-w-5xl mx-auto bg-white border border-[#E4E7EC] rounded-[15px] p-5 md:p-3'>

            <button
                onClick={() => router.push('/table-management/view')}
                className='shadow-none bg-white border border-[#667185] rounded-[8px] px-3 py-2 text-[#667185] hover:bg-gray-200 mb-3'
            >
                <ArrowLeft size={20} />
            </button>

            <h1 className='text-lg font-semibold mb-1'>Table Settings</h1>
            <p className='text-[15px] md:text-sm text-[#8C94A6]'>
                Add your tables and their capacity. You can always edit these later
            </p>

            {isLoading ? (
                <p className='flex items-center gap-2 my-4 text-sm'>
                    <Loader2 className='animate-spin w-4 h-4' />
                    loading tables ...
                </p>
            ) : (
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
                                    disabled={!table.isEditing}
                                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                                    className='col-span-5 shadow-none text-sm placeholder:font-light disabled:opacity-90'
                                    placeholder={`T${index + 1}`}
                                />

                                <Input
                                    value={table.seats}
                                    disabled={!table.isEditing}
                                    onChange={(e) => handleChange(index, 'seats', Number(e.target.value))}
                                    className='col-span-5 shadow-none text-sm border border-input h-9 px-2 rounded-[5px] disabled:opacity-90'
                                    placeholder='e.g 5'
                                />

                                <Input
                                    value={table.quantity}
                                    disabled={!table.isEditing}
                                    onChange={(e) => handleChange(index, 'quantity', Number(e.target.value))}
                                    className='shadow-none text-sm font-light border border-input h-9 col-span-5 px-2 rounded-[5px] disabled:opacity-90'
                                    placeholder='e.g 5'
                                />

                                <div className='col-span-6 flex items-center gap-3'>
                                    <Input
                                        value={table.location}
                                        disabled={!table.isEditing}
                                        onChange={(e) => handleChange(index, 'location', e.target.value)}
                                        className='shadow-none text-sm border border-input h-9 flex-1 px-2 rounded-[5px] disabled:opacity-90'
                                        placeholder='Enter location'
                                    />

                                    {!table.isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(index)}
                                            className='border border-input h-full aspect-square flex items-center justify-center rounded-[6px]'
                                        >
                                            <Pen size={16} />
                                        </button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => handleCancel(index)}
                                                className='bg-gray-200 text-sm hover:bg-gray-400 text-black hover:text-white shadow-none'
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleSave(table, index)}
                                                className='shadow-none text-sm'
                                            >
                                                Save
                                            </Button>
                                        </>
                                    )}
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
                                        disabled={!table.isEditing}
                                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                                        className='text-sm disabled:opacity-90'
                                        placeholder={`T${index + 1}`}
                                    />
                                </div>

                                <div>
                                    <p className='text-xs text-[#8C94A6] mb-1'>Seats</p>
                                    <Input
                                        value={table.seats}
                                        disabled={!table.isEditing}
                                        onChange={(e) => handleChange(index, 'seats', Number(e.target.value))}
                                        className='text-sm disabled:opacity-90'
                                        placeholder='e.g 5'
                                    />
                                </div>

                                <div>
                                    <p className='text-xs text-[#8C94A6] mb-1'>Quantity</p>
                                    <Input
                                        value={table.quantity}
                                        disabled={!table.isEditing}
                                        onChange={(e) => handleChange(index, 'quantity', Number(e.target.value))}
                                        className='text-sm disabled:opacity-90'
                                        placeholder='e.g 5'
                                    />
                                </div>

                                <div>
                                    <p className='text-xs text-[#8C94A6] mb-1'>Location</p>
                                    <Input
                                        value={table.location}
                                        disabled={!table.isEditing}
                                        onChange={(e) => handleChange(index, 'location', e.target.value)}
                                        className='text-sm disabled:opacity-90'
                                        placeholder='Enter location'
                                    />
                                </div>

                                <div className='flex gap-2 justify-end'>
                                    {!table.isEditing ? (
                                        <button
                                            onClick={() => handleEdit(index)}
                                            className='border border-input px-3 py-2 rounded-[6px]'
                                        >
                                            <Pen size={16} />
                                        </button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => handleCancel(index)}
                                                className='bg-gray-200 text-sm text-black'
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleSave(table, index)}
                                                className='text-sm'
                                            >
                                                Save
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ADD TABLE BUTTON */}
                    <button
                        onClick={addTable}
                        className='bg-[#F2F3F4] text-[#5F6976] w-full flex items-center gap-2 justify-start font-normal p-2 text-sm border border-[#D0D5DD] rounded-[6px]'
                    >
                        <Plus size={18} />
                        Add Table
                    </button>

                </div>
            )}
        </div>
    )
}

export default TableSetupPage