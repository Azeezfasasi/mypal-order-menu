import type { ICreateServiceItemDto } from "@/types/service-offering-types";
import { MenuCategory } from "./menu-category";
import type { Category } from "./types";

interface MenuListProps {
  categories: Category[];
  onAddCategory: (values: FormData) => void;
  onAddItem: (categoryId: string, values: ICreateServiceItemDto) => void;
  onEditItem: (itemId: string, values: ICreateServiceItemDto) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function MenuList({
  categories,
  onAddCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDeleteCategory,
}: MenuListProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <MenuCategory
          key={category.id}
          category={category}
          onAddCategory={onAddCategory}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onDeleteCategory={onDeleteCategory}
          // level={1} // Pass initial level
        />
      ))}
    </div>
  );
}
