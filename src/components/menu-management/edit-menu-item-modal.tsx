"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  image_urls?: string[];
  stock_quantity?: number;
  is_available?: boolean;
  categoryId?: string;
  categoryName?: string;
  mealDetail?: {
    mealType?: string;
    cuisine?: string;
    dish?: string;
    servingFormat?: string;
    preparationTime?: string;
  };
  quantityOptions?: Array<{ label: string; price: number }>;
}

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onSubmit: (itemData: {
    id?: string;
    name: string;
    description?: string;
    price: number;
    mealType?: string;
    cuisine?: string;
    dish?: string;
    servingFormat?: string;
    preparationTime?: string;
    quantityOptions?: Array<{ label: string; price: number }>;
  }) => void;
  isSubmitting?: boolean;
}

export default function EditMenuItemModal({
  isOpen,
  onClose,
  item,
  onSubmit,
  isSubmitting = false,
}: EditMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mealType: '',
    cuisine: '',
    dish: '',
    servingFormat: '',
    preparationTime: '',
    // Price is kept as typed text while editing so the field can be cleared and retyped
    quantityOptions: [] as Array<{ label: string; price: number | string }>,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newQuantityLabel, setNewQuantityLabel] = useState('');
  const [newQuantityPrice, setNewQuantityPrice] = useState('');

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: String(item.price || ''),
        mealType: item.mealDetail?.mealType || '',
        cuisine: item.mealDetail?.cuisine || '',
        dish: item.mealDetail?.dish || '',
        servingFormat: item.mealDetail?.servingFormat || '',
        preparationTime: item.mealDetail?.preparationTime || '',
        quantityOptions: item.quantityOptions || [],
      });
      
      // Set image preview
      if (item.image_urls?.[0]) {
        setImagePreview(item.image_urls[0]);
      } else if (item.image) {
        setImagePreview(item.image);
      }
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuantityOption = () => {
    if (!newQuantityLabel.trim() || !newQuantityPrice || isNaN(parseFloat(newQuantityPrice))) {
      alert('Please enter valid label and price for quantity option');
      return;
    }

    setFormData({
      ...formData,
      quantityOptions: [
        ...formData.quantityOptions,
        { label: newQuantityLabel, price: parseFloat(newQuantityPrice) }
      ]
    });

    setNewQuantityLabel('');
    setNewQuantityPrice('');
  };

  const removeQuantityOption = (index: number) => {
    setFormData({
      ...formData,
      quantityOptions: formData.quantityOptions.filter((_, i) => i !== index)
    });
  };

  const updateQuantityOption = (index: number, field: 'label' | 'price', value: string) => {
    setFormData((prev) => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }
    
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      alert('Please enter a valid price');
      return;
    }

    // Options may have been edited inline — check them and convert prices back to numbers
    const quantityOptions = formData.quantityOptions.map((option) => ({
      label: option.label.trim(),
      price: typeof option.price === 'number' ? option.price : parseFloat(option.price),
    }));
    const invalidIndex = quantityOptions.findIndex(
      (option) => !option.label || isNaN(option.price) || option.price < 0
    );
    if (invalidIndex !== -1) {
      alert(`Quantity option ${invalidIndex + 1} needs a name and a valid price.`);
      return;
    }

    onSubmit({
      id: item?.id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      mealType: formData.mealType,
      cuisine: formData.cuisine,
      dish: formData.dish,
      servingFormat: formData.servingFormat,
      preparationTime: formData.preparationTime,
      quantityOptions,
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      price: '',
      mealType: '',
      cuisine: '',
      dish: '',
      servingFormat: '',
      preparationTime: '',
      quantityOptions: [],
    });
    setImagePreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Item Name */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              Item Name
            </label>
            <Input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='e.g. Jollof Rice'
              disabled={isSubmitting}
              className='w-full'
            />
          </div>

          {/* Price */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-1'>
              Price (₦) {formData.quantityOptions.length > 0 && <span className='text-xs font-normal text-gray-500'>(disabled while using quantity options)</span>}
            </label>
            <Input
              type='number'
              name='price'
              value={formData.price}
              onChange={handleChange}
              placeholder='0'
              step='0.01'
              disabled={isSubmitting || formData.quantityOptions.length > 0}
              className='w-full'
            />
            <p className='text-xs text-gray-500 mt-1'>Enter the price in Naira without commas or currency symbol</p>
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-semibold text-gray-900 mb-2'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              placeholder='Enter item description'
              rows={3}
              disabled={isSubmitting}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DB3A07] text-sm'
            />
          </div>

          {/* Meal Details Section */}
          <div className='border-t pt-4'>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Meal Details</h3>
            
            {/* Meal Type */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Meal Type
              </label>
              <Input
                type='text'
                name='mealType'
                value={formData.mealType}
                onChange={handleChange}
                placeholder='e.g. Dinner'
                disabled={isSubmitting}
              />
            </div>

            {/* Quantity/Serving Options */}
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <label className='block text-sm font-semibold text-gray-900'>
                  Quantity/Serving Options (Alternative Pricing)
                </label>
                <span className='text-xs text-blue-600'>{formData.quantityOptions.length} option(s)</span>
              </div>

              {/* Existing Quantity Options */}
              {formData.quantityOptions.length > 0 && (
                <div className='space-y-2 mb-3'>
                  {formData.quantityOptions.map((option, index) => (
                    <div key={index} className='flex gap-2 items-center bg-white p-2 rounded border border-gray-200'>
                      <Input
                        type='text'
                        value={option.label}
                        onChange={(e) => updateQuantityOption(index, 'label', e.target.value)}
                        placeholder='Size name'
                        aria-label={`Option ${index + 1} name`}
                        disabled={isSubmitting}
                        className='flex-1 min-w-0'
                      />
                      <div className='relative w-32 shrink-0'>
                        <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500'>₦</span>
                        <Input
                          type='number'
                          value={option.price}
                          onChange={(e) => updateQuantityOption(index, 'price', e.target.value)}
                          placeholder='0'
                          min='0'
                          step='0.01'
                          aria-label={`Option ${index + 1} price`}
                          disabled={isSubmitting}
                          className='pl-7'
                        />
                      </div>
                      <button
                        type='button'
                        onClick={() => removeQuantityOption(index)}
                        disabled={isSubmitting}
                        className='text-red-500 hover:text-red-700 p-1 shrink-0'
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Quantity Option */}
              <div className='grid grid-cols-2 gap-2 mb-2'>
                <div>
                  <Input
                    type='text'
                    value={newQuantityLabel}
                    onChange={(e) => setNewQuantityLabel(e.target.value)}
                    placeholder='e.g. Small, Medium, Large'
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Input
                    type='number'
                    value={newQuantityPrice}
                    onChange={(e) => setNewQuantityPrice(e.target.value)}
                    placeholder='0'
                    step='0.01'
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type='button'
                onClick={addQuantityOption}
                disabled={isSubmitting}
                className='w-full py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300'
              >
                + Add Size
              </button>

              <div className='mt-2 p-2 bg-blue-100 rounded'>
                <p className='text-xs text-blue-800'>
                  💡 When you add quantity options, the global price field will be ignored. Each option has its own price.
                </p>
              </div>
            </div>

            {/* Cuisine */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Cuisine
              </label>
              <Input
                type='text'
                name='cuisine'
                value={formData.cuisine}
                onChange={handleChange}
                placeholder='e.g. Italian'
                disabled={isSubmitting}
              />
            </div>

            {/* Dish */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Dish
              </label>
              <Input
                type='text'
                name='dish'
                value={formData.dish}
                onChange={handleChange}
                placeholder='e.g. Main course'
                disabled={isSubmitting}
              />
            </div>

            {/* Serving Format */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Serving Format
              </label>
              <Input
                type='text'
                name='servingFormat'
                value={formData.servingFormat}
                onChange={handleChange}
                placeholder='e.g. Platter'
                disabled={isSubmitting}
              />
            </div>

            {/* Preparation Time */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Preparation Time
              </label>
              <Input
                type='text'
                name='preparationTime'
                value={formData.preparationTime}
                onChange={handleChange}
                placeholder='e.g. 30 minutes'
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Menu Item Image */}
          <div className='border-t pt-4'>
            <label className='block text-sm font-semibold text-gray-900 mb-3'>
              Menu Item Image
            </label>
            <div className='relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer group hover:bg-gray-100 transition-colors'>
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt='Preview'
                  fill
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='text-center'>
                  <Upload className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-600'>Upload an image of the menu item</p>
                  <p className='text-xs text-gray-500 mt-1'>Maximum file size: 2MB</p>
                </div>
              )}
              <input
                type='file'
                accept='image/*'
                onChange={handleImageChange}
                disabled={isSubmitting}
                className='absolute inset-0 opacity-0 cursor-pointer'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 pt-4 border-t border-gray-100'>
            <Button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-[#DB3A07] text-white hover:bg-[#c73206] flex items-center justify-center gap-2'
            >
              {isSubmitting && <Loader className='w-4 h-4 animate-spin' />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
