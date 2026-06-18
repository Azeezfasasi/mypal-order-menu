import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  BusinessCategoriesApi,
  IBusinessCategory,
} from "@/services/api/business-categories-api";
import { BusinessContextApi } from "@/services/api/business-context-api";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddCategoryModal({ open, onClose }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const { mutate: addCategory, isLoading } =
    BusinessContextApi.useAddCategory();
  const { data: categoriesResp, isLoading: categoriesLoading } =
    BusinessCategoriesApi.useGetAllCategories();
  const categories: IBusinessCategory[] = categoriesResp?.data || [];

  const { user: business } = useAuth();
  const disabledCategoryIds = new Set<string>();
  if (business?.category?.id) disabledCategoryIds.add(business.category.id);
  if (business?.linkedBusinesses && Array.isArray(business.linkedBusinesses)) {
    business.linkedBusinesses.forEach((lb: any) => {
      if (lb?.category?.id) disabledCategoryIds.add(lb.category.id);
    });
  }

  const handleSubmit = () => {
    if (!categoryId) return;
    addCategory(
      { categoryId },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <label className="block text-sm font-medium mb-2">Category</label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  categoriesLoading
                    ? "Loading categories..."
                    : "Select category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  disabled={disabledCategoryIds.has(c.id)}
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Add Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddCategoryModal;
