'use client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { OrderOptionsApi } from '@/services/api/order-options-api'
import { useQueryClient } from '@tanstack/react-query'

const OrderOptions = () => {

    const [openAddModal, setOpenAddModal] = useState(false);
    // const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [newOrderOption, setnewOrderOption] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState('');

    const { data: orderOptions } = OrderOptionsApi.useGetAllOrderOptions();
    const { data: myOrderOptions, isLoading } = OrderOptionsApi.useGetMyOrderOptions();

    const addOrderOptionMutation = OrderOptionsApi.useAddOrderOptions();
    const deleteOrderOptionMutation = OrderOptionsApi.useDeleteOrderOptions();
    const enableOrderOptionMutation = OrderOptionsApi.useEnableOrderOptions();
    const disableOrderOptionMutation = OrderOptionsApi.useDisableOrderOptions();
    // const editOrderOptionMutation = OrderOptionsApi.useEditOrderOptions();

    const queryClient = useQueryClient();

    const handleAddSport = () => {

        if (!newOrderOption) {
            toast.error('Select an order option');
            return;
        }

        addOrderOptionMutation.mutate({
            order_options: [{ id: newOrderOption, status: true }]
        }, {
            onSuccess: () => {
                toast.success('order option added');
                queryClient.invalidateQueries({
                    queryKey: ["my-order-options"],
                })
                setnewOrderOption('');
                setOpenAddModal(false);
            }
        })
    }


    // const handleEditOrderOption = () => {
    //     if (!selectedOrderId) {
    //         toast.error('No selected order option');
    //         return;
    //     }
    //     if (!newOrderOption) {
    //         toast.error('Select new order option');
    //         return;
    //     }

    //     editOrderOptionMutation.mutate({
    //         name: newOrderOption,
    //         id: selectedOrderId
    //     }, {
    //         onSuccess: () => {
    //             toast.success('order option updated');
    //             queryClient.invalidateQueries({
    //                 queryKey: ["my-order-options"],
    //             })
    //             setnewOrderOption('');
    //             setOpenEditModal(false);
    //         }
    //     })

    // }

    const handleDeleteOrderOption = () => {
        if (!selectedOrderId) {
            toast.error('No selected order option');
            return;
        }

        deleteOrderOptionMutation.mutate(selectedOrderId, {
            onSuccess: () => {
                toast.success('order option deleted');
                queryClient.invalidateQueries({
                    queryKey: ["my-order-options"],
                })
                setnewOrderOption('');
                setSelectedOrderId('');
                setOpenDeleteModal(false);
            }
        })
    }


    return (
        <div className='border border-[#E4E7EC] rounded-[8px] p-5 w-full'>
            <div className='flex items-center justify-between'>
                <h1 className='text-[#DB3A07] font-bold text-xl'>Order Options</h1>
                <Button onClick={() => setOpenAddModal(true)} className='bg-[#DE5126] text-white shadow-none font-semibold'>
                    <Plus />
                    add order options
                </Button>
            </div>

            <div className='mt-5 space-y-5'>
                {isLoading ?
                    <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Loading . . .
                    </p>
                    :
                    myOrderOptions && myOrderOptions.data.order_options.length === 0 ?
                        <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                            You do not have any order option
                        </p>
                        :
                        myOrderOptions?.data.order_options.map((orderOption) => (
                            <div key={orderOption.id} className='bg-[#FFF7F5] p-3 rounded-[8px] flex items-center justify-between'>
                                <h3 className='text-[#031826] font-bold text-base'>
                                    {orderOption.name}
                                </h3>
                                <div className='flex items-center gap-4'>
                                    <Switch
                                        checked={orderOption.status}
                                        disabled={
                                            enableOrderOptionMutation.isPending ||
                                            disableOrderOptionMutation.isPending
                                        }
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                enableOrderOptionMutation.mutate(orderOption.id, {
                                                    onSuccess: () => {
                                                        toast.success('Order option enabled');
                                                        queryClient.invalidateQueries({
                                                            queryKey: ["my-order-options"],
                                                        });
                                                    }
                                                });
                                            } else {
                                                disableOrderOptionMutation.mutate(orderOption.id, {
                                                    onSuccess: () => {
                                                        toast.success('Order option disabled');
                                                        queryClient.invalidateQueries({
                                                            queryKey: ["my-order-options"],
                                                        });
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                    {/* <Button
                                        onClick={() => {
                                            setnewOrderOption(orderOption.id);
                                            setOpenEditModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Edit
                                    </Button> */}
                                    <Button
                                        onClick={() => {
                                            setSelectedOrderId(orderOption.id);
                                            setnewOrderOption(orderOption.name);
                                            setOpenDeleteModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                }
            </div>

            <Dialog
                open={openAddModal}
                onOpenChange={setOpenAddModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Add Order Option</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Select</label>
                            <select value={newOrderOption} onChange={(e) => setnewOrderOption(e.target.value)} className='h-12 text-sm shadow-none w-full border border-[#D9D9D9] rounded-[8px] p-2 appearance-none'>
                                <option value=''>- - Select - -</option>
                                {orderOptions?.data.order_options.map((option) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenAddModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={addOrderOptionMutation.isPending}
                                onClick={handleAddSport}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70 disabled:cursor-pointer'
                            >
                                {addOrderOptionMutation.isPending ?
                                    "loading . . ."
                                    :
                                    "Add"
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- EDIT MODAL --- */}
            {/* <Dialog
                open={openEditModal}
                onOpenChange={setOpenEditModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Edit Order Option</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Select</label>
                            <select value={newOrderOption} onChange={(e) => setnewOrderOption(e.target.value)} className='h-12 text-sm shadow-none w-full border border-[#D9D9D9] rounded-[8px] p-2 appearance-none'>
                                <option value=''>- - Select - -</option>
                                {orderOptions?.data.order_options.map((option) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenEditModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                onClick={handleEditOrderOption}

                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog> */}

            {/* --- DELETE MODAL --- */}
            <Dialog
                open={openDeleteModal}
                onOpenChange={setOpenDeleteModal}
            >
                <DialogContent className="max-w-xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Delete Order Option</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <p className='text-[15px] mb-3 font-medium'>Are you sure you want to delete <b>{newOrderOption}</b> order option?</p>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenDeleteModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                onClick={handleDeleteOrderOption}
                                disabled={deleteOrderOptionMutation.isPending}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {deleteOrderOptionMutation.isPending ?
                                    "loading . . ."
                                    :
                                    "Delete"
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default OrderOptions