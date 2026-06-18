import type { ICreateServiceItemDto } from "@/types/service-offering-types";
import { MenuCategory } from "./menu-category";
import type { Category } from "./types";

interface SubCategoryListProps {
  categories: Category[];
  level?: number;
  onAddCategory: (values: FormData) => void;
  onAddItem: (categoryId: string, values: ICreateServiceItemDto) => void;
  onEditItem: (itemId: string, values: ICreateServiceItemDto) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function SubCategoryList({
  categories,
  level = 1,
  onAddCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteCategory,
}: SubCategoryListProps) {
  if (!categories.length || level > 2) return null;

  return (
    <div className="space-y-3 pl-4 border-l-2 border-border">
      {categories.map((category) => (
        <MenuCategory
          key={category.id}
          category={category}
          level={level}
          onAddCategory={onAddCategory}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onDeleteCategory={onDeleteCategory}
        />
      ))}
    </div>
  );
}
