'use client'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { BusinessAttributeApi } from '@/services/api/business-attribute-api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const Attribute = () => {

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [newAttribute, setNewAttribute] = useState('');
    const [selectedAttributeId, setSelectedAttributeId] = useState('');

    const { data: attributeResponse, isLoading } = BusinessAttributeApi.useGetIconicDelicacyAttractions();
    const addIconicDelAttributeMutation = BusinessAttributeApi.useAddIconicDelicacyAttribute();
    const editIconicDelAttributeMutation = BusinessAttributeApi.useUpdateIconicDelicacyAttribute();
    const deleteIconicDelAttributeMutation = BusinessAttributeApi.useDeleteIconicDelicacyAttribute();
    const toggleIconicDelAttributeStatus = BusinessAttributeApi.useToggleIconicDelicacyAttributeStatus();

    const queryClient = useQueryClient();

    const handleAddAttribute = () => {
        if (!newAttribute) {
            toast.error('Enter attribute');
            return;
        }

        addIconicDelAttributeMutation.mutate({
            label: newAttribute
        }, {
            onSuccess: () => {
                toast.success('Attribute added');
                queryClient.invalidateQueries({
                    queryKey: ["Attributes", "iconic-del"],
                })
                setNewAttribute('');
                setOpenAddModal(false);
            }
        })
    }

    const handleEditAttribute = () => {
        if (!selectedAttributeId) {
            toast.error('No selected attribute');
            return;
        }
        if (!newAttribute) {
            toast.error('Enter attribute');
            return;
        }

        editIconicDelAttributeMutation.mutate({
            label: newAttribute,
            attraction_id: selectedAttributeId
        }, {
            onSuccess: () => {
                toast.success('Attribute updated');
                queryClient.invalidateQueries({
                    queryKey: ["Attributes", "iconic-del"],
                })
                setNewAttribute('');
                setSelectedAttributeId('');
                setOpenEditModal(false);
            }
        })
    }

    const handleDeleteAttribute = () => {
        if (!selectedAttributeId) {
            toast.error('No selected attribute');
            return;
        }

        deleteIconicDelAttributeMutation.mutate(
            selectedAttributeId
            , {
                onSuccess: () => {
                    toast.success('Attribute Deleted');
                    queryClient.invalidateQueries({
                        queryKey: ["Attributes", "iconic-del"],
                    })
                    setNewAttribute('');
                    setSelectedAttributeId('');
                    setOpenDeleteModal(false);
                }
            })
    }

    const handleToggleStatus = (id: string, isActive: boolean) => {
        toggleIconicDelAttributeStatus.mutate(
            {
                attraction_id: id,
                status: isActive ? 'On' : 'Off',
            },
            {
                onSuccess: () => {
                    toast.success(`Attribute ${isActive ? 'activated' : 'Deactivated'}`);
                    queryClient.invalidateQueries({
                        queryKey: ["Attributes", "iconic-del"],
                    });
                },
            }
        );
    };

    return (
        <div className='border border-[#E4E7EC] rounded-[8px] p-5 w-full'>
            <div className='flex items-center justify-between'>
                <h1 className='text-[#DB3A07] font-bold text-xl'>Attribute</h1>
                <Button onClick={() => setOpenAddModal(true)} className='bg-[#DE5126] text-white shadow-none font-semibold'>
                    <Plus />
                    add attribute
                </Button>
            </div>

            <div className='mt-5 space-y-5'>
                {isLoading ?
                    <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Loading . . .
                    </p>
                    :
                    attributeResponse && attributeResponse.data.length === 0 ?
                        <p className='mt-5 mb-3 flex items-center gap-2 text-[15px]'>
                            No Attribute added.
                        </p>
                        :
                        attributeResponse?.data.map((attribute) => (
                            <div key={attribute.id} className='bg-[#FFF7F5] p-3 rounded-[8px] flex items-center justify-between'>
                                <h3 className='text-[#031826] font-bold text-base'>
                                    {attribute.label}
                                </h3>
                                <div className='flex items-center gap-4'>
                                    <Switch
                                        disabled={toggleIconicDelAttributeStatus.isPending}
                                        checked={attribute.is_active}
                                        onCheckedChange={(checked) => handleToggleStatus(attribute.id, checked)}
                                        className="shadow-none disabled:opacity-60 disabled:cursor-not-allowed!"
                                    />
                                    <Button
                                        onClick={() => {
                                            setSelectedAttributeId(attribute.id);
                                            setNewAttribute(attribute.label);
                                            setOpenEditModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white shadow-none font-medium'
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedAttributeId(attribute.id);
                                            setNewAttribute(attribute.label);
                                            setOpenDeleteModal(true)
                                        }}
                                        className='bg-[white] border border-[#E3E3E3] text-[#515151] hover:text-white hover:bg-red-500 shadow-none font-medium'
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
            </div>

            {/* --- ADD MODAL --- */}
            <Dialog
                open={openAddModal}
                onOpenChange={setOpenAddModal}
            >
                <DialogContent className="max-w-2xl rounded-[10px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className='justify-start'>
                        <DialogTitle className='text-left'>Add Attribute</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Attribute</label>
                            <Input
                                value={newAttribute}
                                onChange={(e) => setNewAttribute(e.target.value)}
                                className='shadow-none h-11 text-sm'
                                placeholder='Enter attribute name'
                            />
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenAddModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={addIconicDelAttributeMutation.isPending}
                                onClick={handleAddAttribute}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {addIconicDelAttributeMutation.isPending && <Loader2 className='w-4 h-4 animate-spin' />}
                                {addIconicDelAttributeMutation.isPending ?
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
                        <DialogTitle className='text-left'>Edit Attribute</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <div className='mb-3'>
                            <label className='block mb-2 text-sm font-medium' htmlFor="">Attribute</label>
                            <Input
                                value={newAttribute}
                                onChange={(e) => setNewAttribute(e.target.value)}
                                className='shadow-none h-11 text-sm'
                                placeholder='Enter attribute name'
                            />
                        </div>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenEditModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={editIconicDelAttributeMutation.isPending}
                                onClick={handleEditAttribute}
                                className='flex items-center gap-2 justify-center w-full bg-[#EB5119] text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >

                                {editIconicDelAttributeMutation.isPending &&
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                }
                                {editIconicDelAttributeMutation.isPending ?
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
                        <DialogTitle className='text-left'>Delete Attribute</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 ">
                        <p className='text-[15px] mb-3 font-medium'>Are you sure you want to delete this attribute ({newAttribute})? this action is irreversable.</p>
                        <div className='grid grid-cols-2 items-center gap-3 justify-end'>
                            <button onClick={() => setOpenDeleteModal(false)} className='w-full text-sm font-medium bg-[#F1F3F6] py-3 px-3 rounded-[7px]'>Cancel</button>
                            <button
                                disabled={deleteIconicDelAttributeMutation.isPending}
                                onClick={handleDeleteAttribute}
                                className='flex items-center gap-2 justify-center w-full bg-red-500 text-sm font-medium text-white py-3 px-3 rounded-[7px] disabled:opacity-70'
                            >
                                {deleteIconicDelAttributeMutation.isPending &&
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                }
                                {deleteIconicDelAttributeMutation.isPending ?
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

export default Attribute