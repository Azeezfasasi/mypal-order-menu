import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  unit_type: string;
  image_url: string;
}

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: MenuItemFormData) => void;
}

export default function AddMenuItemModal({ isOpen, onClose, onSubmit }: AddMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    unit_type: 'pieces',
    image_url: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      unit_type: 'pieces',
      image_url: '',
    });
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className='fixed top-0 left-0 w-screen h-dvh bg-black/30 flex items-center justify-center z-50'>
      <div onClick={(e) => e.stopPropagation()} className='bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Add Menu Item</h2>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          {/* Image Upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Item Image</label>
            <div className='relative w-full h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden'>
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt='Preview'
                  width={160}
                  height={160}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='text-center'>
                  <Upload className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-600'>Click to upload</p>
                </div>
              )}
              <input
                type='file'
                accept='image/*'
                onChange={handleImageChange}
                className='absolute inset-0 opacity-0 cursor-pointer'
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Item Name *</label>
            <Input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='Enter item name'
              required
              className='w-full'
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Description</label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Enter item description'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
              rows={3}
            />
          </div>

          {/* Price */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Price (₦) *</label>
            <Input
              type='number'
              name='price'
              value={formData.price}
              onChange={handleChange}
              placeholder='Enter price'
              required
              className='w-full'
              step='0.01'
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Stock Quantity *</label>
            <Input
              type='number'
              name='stock_quantity'
              value={formData.stock_quantity}
              onChange={handleChange}
              placeholder='Enter stock quantity'
              required
              className='w-full'
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Unit Type</label>
            <select
              name='unit_type'
              value={formData.unit_type}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
            >
              <option value='pieces'>Pieces</option>
              <option value='kg'>Kilogram (kg)</option>
              <option value='liters'>Liters (L)</option>
              <option value='portions'>Portions</option>
            </select>
          </div>

          {/* Buttons */}
          <div className='flex gap-2 pt-4'>
            <Button
              type='button'
              onClick={onClose}
              className='flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='flex-1 bg-orange-600 text-white hover:bg-orange-700'
            >
              Add Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
