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

    const { data: sportResponse, isLoading } = BusinessSportApi.useGetBuffetSports();
    const addBuffetSportMutation = BusinessSportApi.useAddBuffetSport();
    const editBuffetSportMutation = BusinessSportApi.useUpdateBuffetSport();
    const deleteBuffetSportMutation = BusinessSportApi.useDeleteBuffetSport();
    const toggleBuffetSportStatus = BusinessSportApi.useToggleBuffetSportStatus();

    const queryClient = useQueryClient();

    const handleAddSport = () => {

        if (!newSport) {
            toast.error('Enter sport name');
            return;
        }

        addBuffetSportMutation.mutate({
            attraction_name: newSport
        }, {
            onSuccess: () => {
                toast.success('Sport added');
                queryClient.invalidateQueries({
                    queryKey: ["sports", "buffet"],
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

        editBuffetSportMutation.mutate({
            attraction_name: newSport,
            attraction_id: selectedSportId
        }, {
            onSuccess: () => {
                toast.success('Sport updated');
                queryClient.invalidateQueries({
                    queryKey: ["sports", "buffet"],
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

        deleteBuffetSportMutation.mutate(
            selectedSportId
            , {
                onSuccess: () => {
                    toast.success('Sport Deleted');
                    queryClient.invalidateQueries({
                        queryKey: ["sports", "buffet"],
                    })
                    setnewSport('');
                    setSelectedSportId('');
                    setOpenDeleteModal(false);
                }
            })
    }

    const handleToggleStatus = (id: string, isActive: boolean) => {
        toggleBuffetSportStatus.mutate(
            {
                attraction_id: id,
                status: isActive ? 'On' : 'Off',
            },
            {
                onSuccess: () => {
                    toast.success(`Sport ${isActive ? 'activated' : 'Deactivated'}`);
                    queryClient.invalidateQueries({
                        queryKey: ["sports", "buffet"],
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
                    <p>loading . . .</p>
                    :
                    sportResponse && sportResponse.data.length === 0 ?
                        <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                            No sport found. Please click the button to add
                        </p>
                        :
                        sportResponse?.data.map((sport) => (
                            <div key={sport.id} className='bg-[#FFF7F5] p-3 rounded-[8px] flex items-center justify-between'>
                                <h3 className='text-[#031826] font-bold text-base'>
                                    {sport.attraction_name}
                                </h3>
                                <div className='flex items-center gap-4'>
                                    <Switch
                                        disabled={toggleBuffetSportStatus.isPending}
                                        checked={sport.is_active}
                                        onCheckedChange={(checked) => handleToggleStatus(sport.id, checked)}
                                        className="shadow-none disabled:opacity-60 disabled:cursor-not-allowed!"
                                    />
                                    <Button
                                        onClick={() => {
                                            setSelectedSportId(sport.id);
                                            setnewSport(sport.attraction_name);
                                            setOpenEditModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedSportId(sport.id);
                                            setnewSport(sport.attraction_name);
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
                                disabled={addBuffetSportMutation.isPending}
                                onClick={handleAddSport}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {addBuffetSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {addBuffetSportMutation.isPending ?
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
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Sport</label>
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
                                disabled={editBuffetSportMutation.isPending}
                                onClick={handleEditSport}

                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {editBuffetSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {editBuffetSportMutation.isPending ?
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
                                disabled={deleteBuffetSportMutation.isPending}
                                onClick={handleDeleteSport}

                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {deleteBuffetSportMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}

                                {deleteBuffetSportMutation.isPending ?
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