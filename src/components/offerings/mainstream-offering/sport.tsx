'use client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { BusinessSportApi } from '@/services/api/business-sports-api'

const Sports = () => {

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [newSport, setnewSport] = useState('');
    const [selectedSportId, setSelectedSportId] = useState('');

    const { data: sportResponse, isLoading } = BusinessSportApi.useGetIconicDelicacySports();
    const addIconicDelSportMutation = BusinessSportApi.useAddIconicDelicacySport();
    const editIconicDelSportMutation = BusinessSportApi.useUpdateIconicDelicacySport();
    const deleteIconicDelSportMutation = BusinessSportApi.useDeleteIconicDelicacySport();
    const toggleIconicDelSportStatus = BusinessSportApi.useToggleIconicDelicacySportStatus();

    const queryClient = useQueryClient();

    const handleAddSport = () => {

        if (!newSport) {
            toast.error('Enter sport name');
            return;
        }

        addIconicDelSportMutation.mutate({
            label: newSport
        }, {
            onSuccess: () => {
                toast.success('Sport added');
                queryClient.invalidateQueries({
                    queryKey: ["sports", "iconic-del"],
                })
                setnewSport('');
                setOpenAddModal(false);
            }
        })
    }


    const handleEditSport = () => {
        if (!selectedSportId) {
            toast.error('No selected sport');
            return;
        }
        if (!newSport) {
            toast.error('Enter sport name');
            return;
        }

        editIconicDelSportMutation.mutate({
            label: newSport,
            attraction_id: selectedSportId
        }, {
            onSuccess: () => {
                toast.success('Sport updated');
                queryClient.invalidateQueries({
                    queryKey: ["sports", "iconic-del"],
                })
                setnewSport('');
                setSelectedSportId('');
                setOpenEditModal(false);
            }
        })
    }

    const handleDeleteSport = () => {
        if (!selectedSportId) {
            toast.error('No selected sport');
            return;
        }

        deleteIconicDelSportMutation.mutate(
            selectedSportId
            , {
                onSuccess: () => {
                    toast.success('Sport Deleted');
                    queryClient.invalidateQueries({
                        queryKey: ["sports", "iconic-del"],
                    })
                    setnewSport('');
                    setSelectedSportId('');
                    setOpenDeleteModal(false);
                }
            })
    }

    const handleToggleStatus = (id: string, isActive: boolean) => {
        toggleIconicDelSportStatus.mutate(
            {
                attraction_id: id,
                status: isActive ? 'On' : 'Off',
            },
            {
                onSuccess: () => {
                    toast.success(`Sport ${isActive ? 'activated' : 'Deactivated'}`);
                    queryClient.invalidateQueries({
                        queryKey: ["sports", "iconic-del"],
                    });
                },
            }
        );
    };

    return (
        <div className='border border-[#E4E7EC] rounded-[8px] p-5 w-full'>
            <div className='flex items-center justify-between'>
                <h1 className='text-[#DB3A07] font-bold text-xl'>Sports</h1>
                <Button onClick={() => setOpenAddModal(true)} className='bg-[#DE5126] text-white shadow-none font-semibold'>
                    <Plus />
                    add sport
                </Button>
            </div>

            <div className='mt-5 space-y-5'>
                {isLoading ?
                    <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Loading . . .
                    </p>
                    :
                    sportResponse && sportResponse.data.length === 0 ?
                        <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                            No sport added.
                        </p>
                        :
                        sportResponse?.data.map((sport) => (
                            <div key={sport.id} className='bg-[#FFF7F5] p-3 rounded-[8px] flex items-center justify-between'>
                                <h3 className='text-[#031826] font-bold text-base'>
                                    {sport.label}
                                </h3>
                                <div className='flex items-center gap-4'>
                                    <Switch
                                        disabled={toggleIconicDelSportStatus.isPending}
                                        checked={sport.is_active}
                                        onCheckedChange={(checked) => handleToggleStatus(sport.id, checked)}
                                        className="shadow-none disabled:opacity-60 disabled:cursor-not-allowed!"
                                    />
                                    <Button
                                        onClick={() => {
                                            setSelectedSportId(sport.id);
                                            setnewSport(sport.label);
                                            setOpenEditModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedSportId(sport.id);
                                            setnewSport(sport.label);
                                            setOpenDeleteModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
            </div>

            <Dialog
                open={openAddModal}
                onOpenChange={setOpenAddModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Add Sport</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Sport</label>
                            <Input
                                value={newSport}
                                onChange={(e) => setnewSport(e.target.value)}
                                className='shadow-none h-11 text-sm'
                                placeholder='Enter sport name'
                            />
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenAddModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={addIconicDelSportMutation.isPending}
                                onClick={handleAddSport}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {addIconicDelSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {addIconicDelSportMutation.isPending ?
                                    'loading . . .'
                                    :
                                    'Add'
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- EDIT MODAL --- */}
            <Dialog
                open={openEditModal}
                onOpenChange={setOpenEditModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Edit Sport</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Sport name</label>
                            <Input
                                value={newSport}
                                onChange={(e) => setnewSport(e.target.value)}
                                className='shadow-none h-11 text-sm'
                                placeholder='Enter sport name'
                            />
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenEditModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={editIconicDelSportMutation.isPending}
                                onClick={handleEditSport}

                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {editIconicDelSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {editIconicDelSportMutation.isPending ?
                                    'loading . . .'
                                    :
                                    'Edit'
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- DELETE MODAL --- */}
            <Dialog
                open={openDeleteModal}
                onOpenChange={setOpenDeleteModal}
            >
                <DialogContent className="max-w-xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Delete Sport</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <p className='text-[15px] mb-3 font-medium'>Are you sure you want to delete this sport ({newSport})? this action is irreversable.</p>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenDeleteModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={deleteIconicDelSportMutation.isPending}
                                onClick={handleDeleteSport}

                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {deleteIconicDelSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {deleteIconicDelSportMutation.isPending ?
                                    'loading . . .'
                                    :
                                    'Delete'
                                }
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Sports