
'use client'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import Image from 'next/image'
import successIcon from '../../../../public/images/red-success-icon.svg'
import { BusinessCuisineApi } from '@/services/api/business-cuisine-api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const Cuisine = () => {

    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const { data: myCuisines, isLoading } = BusinessCuisineApi.useGetMyIconicDelicacyCuisine();
    const { data: allCuisines } = BusinessCuisineApi.useGetAllIconicDelicacyCuisine();
    const addIconicDelicacyMutation = BusinessCuisineApi.useAddIconicDelicacyCuisine();
    const removeIconicDelicacyMutation = BusinessCuisineApi.useRemoveIconicDelicacyCuisine();

    const [newCuisine, setNewCuisine] = useState('');

    const queryClient = useQueryClient();

    const handleSubmit = () => {
        if (!newCuisine) {
            toast.error('Select a cuisine')
            return;
        }

        addIconicDelicacyMutation.mutate({
            cuisine_category_ids: [newCuisine]
        }, {
            onSuccess: () => {
                toast.success('Cuisine added');
                queryClient.invalidateQueries({
                    queryKey: ["business-cuisines", "iconic-del", "my-cuisines"]
                })
                setIsUpdateOpen(false);
                setIsSuccessOpen(true);
            }
        })

    }

    const handleCloseModal = () => {
        setIsSuccessOpen(false);
        setIsUpdateOpen(false);
        setNewCuisine('');
    }

    const handleRemoveCuisine = (id: string) => {
        removeIconicDelicacyMutation.mutate({
            cuisine_category_id: id
        }, {
            onSuccess: () => {
                toast.success('Cuisine removed');
                queryClient.invalidateQueries({
                    queryKey: ["business-cuisines", "iconic-del", "my-cuisines"]
                })
            }
        })

    }

    return (
        <div className='border border-[#E4E7EC] rounded-[8px] p-5 w-full'>
            <div className='flex items-center justify-between'>
                <h1 className='text-[#DB3A07] font-bold text-xl'>Cuisine type</h1>
                <Button className='bg-[#DE5126] text-white shadow-none font-semibold' onClick={() => setIsUpdateOpen(true)}>
                    <Plus />
                    Add
                </Button>
            </div>

            <div className='mt-5 space-y-5'>
                {isLoading ?
                    <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'><Loader2 className='w-4 h-4 animate-spin' /> Loading . . .</p>
                    :
                    myCuisines?.data && myCuisines?.data.length === 0 ?
                        <p>No cuisine added.</p>
                        :
                        myCuisines?.data.map((cuisine) => (
                            <div key={cuisine.id} className='bg-[#F0F2F5B2] p-3 rounded-[8px] flex items-center justify-between'>
                                <h3 className='text-[#031826] font-semibold text-[15px]'>{cuisine.name}</h3>
                                <Button onClick={() => handleRemoveCuisine(cuisine.id)} className='shadow-none bg-[#DB3A071A] text-[#DB3A07] hover:text-white hover:bg-[#DB3A07]'>
                                    <Trash2 />
                                    Remove
                                </Button>
                            </div>
                        ))}
            </div>

            <Dialog
                open={isUpdateOpen}
                onOpenChange={handleCloseModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Add Cuisine Type</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 bg-[#F8F8F8] p-4">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Cruisine Type</label>
                            <select value={newCuisine} onChange={(e) => setNewCuisine(e.target.value)} className='h-12 text-sm shadow-none w-full border border-[#D9D9D9] rounded-[8px] p-2 appearance-none'>
                                <option value=''>- - Select - -</option>
                                {allCuisines?.data.map((cuisine) => (
                                    <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={handleCloseModal} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={addIconicDelicacyMutation.isPending}
                                onClick={handleSubmit}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {addIconicDelicacyMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                                {addIconicDelicacyMutation.isPending ?
                                    'loading . . .'
                                    :
                                    'Add'
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isSuccessOpen}
                onOpenChange={handleCloseModal}
            >
                <DialogContent className="max-w-[480px] rounded-[12px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start p-5 pb-0'>
                        <DialogTitle className='text-left'>Cuisine Type</DialogTitle>
                    </DialogHeader>
                    <div className="bg-[#F8F8F8] p-5 rounded-b-[12px] flex flex-col items-center">
                        <Image
                            src={successIcon}
                            width={100}
                            height={100}
                            alt='success'
                        />
                        <h3 className='text-xl mt-3 font-semibold'>Congratulations</h3>
                        <p className='w-[80%] mx-auto text-center text-[#4A4A5D] my-3'>You have successfully added <b>{allCuisines?.data.find(c => c.id === newCuisine)?.name}</b> cuisine to your cuisine type.</p>
                        <button
                            onClick={handleCloseModal}
                            className='w-full rounded-full bg-[#031927] text-base font-medium text-white p-4 mt-5 disabled:opacity-70'
                        >
                            Continue
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Cuisine