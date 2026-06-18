import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { AddCategoryDialog } from "./add-category-dialog";
import { getCategoryBackgroundImage } from "./menu-utils";
import { Category } from "./types";

interface CategoryHeaderProps {
  category: Category;
  isExpanded: boolean;
  toggleExpand: () => void;
  level?: number;
  onDeleteCategory?: () => void;
  isDefaultCategory?: boolean;
  hasItems?: boolean;
  hasSubCategories?: boolean;
  onAddCategory: (values: FormData) => void;
  canAddSubcategories?: boolean | null;
}

export function CategoryHeader({
  category,
  isExpanded,
  toggleExpand,
  level = 0,
  onDeleteCategory,
  isDefaultCategory,
  hasItems,
  hasSubCategories,
  onAddCategory,
  canAddSubcategories,
}: CategoryHeaderProps) {
  const bgImage =
    category.image_url || getCategoryBackgroundImage(category.name);
  const isTopLevel = level === 0;

  const handleAddSubcategoryToCurrent = (formData: FormData) => {
    // Update parentCategory in FormData if not already set
    formData.set("parentCategory", category.id);
    onAddCategory(formData);
  };

  const handleAddTopLevelCategory = (formData: FormData) => {
    // Remove or set empty parentCategory for top-level categories
    formData.delete("parentCategory");
    onAddCategory(formData);
  };

  function getCategoryHeight(isTopLevel: boolean, isExpanded: boolean) {
    if (isTopLevel) return isExpanded ? "h-[120px]" : "h-[100px]";
    return isExpanded ? "h-[80px]" : "h-[50px]";
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg transition-[height] duration-500 group font-sora",
        getCategoryHeight(isTopLevel, isExpanded)
      )}
      style={
        isTopLevel
          ? {
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      <div
        className={cn(
          "flex items-center justify-between p-4 w-full h-full",
          !isTopLevel && "bg-secondary hover:bg-secondary/80 transition-colors"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className={cn(
              "transition-all duration-200 rounded-full p-1",
              isTopLevel
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "text-foreground hover:bg-muted"
            )}
            aria-label={isExpanded ? "Collapse category" : "Expand category"}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
          <button onClick={toggleExpand}>
            <h2
              className={cn(
                "font-medium transition-all",
                isTopLevel
                  ? "text-4xl text-white md:text-2xl"
                  : "text-xl text-foreground md:text-base"
              )}
            >
              {category.name}
            </h2>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isTopLevel && canAddSubcategories ? (
            <AddCategoryDialog
              parentId={null}
              onAddCategory={handleAddTopLevelCategory}
              parentCategoryName={category.name}
              buttonText="Add category"
              showTriggerButton={false} // Show button only when expanded
              triggerButtonVariant="default"
              triggerButtonClassName="bg-primary hover:bg-orange-600 text-primary-foreground"
              triggerButtonSize="sm"
              icon={<Plus className="h-4 w-4 mr-1" />}
              level={1}
            />
          ) : (
            canAddSubcategories && (
              <AddCategoryDialog
                parentId={category.id}
                parentCategoryName={category.name}
                onAddCategory={handleAddSubcategoryToCurrent}
                buttonText="Add Subcategory"
                showTriggerButton={false} // Show button only when expanded
                triggerButtonVariant="default"
                triggerButtonClassName="bg-primary hover:bg-primary/90 text-primary-foreground"
                triggerButtonSize="sm"
                icon={<Plus className="h-4 w-4 mr-1" />}
                level={level + 1}
              />
            )
          )}

          {onDeleteCategory && !isDefaultCategory && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-white",
                    isTopLevel
                      ? "bg-red-600/70 hover:bg-red-600"
                      : "bg-destructive hover:bg-destructive/90"
                  )}
                  title={`Delete category "${category.name}"`}
                  aria-label={`Delete category ${category.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{category.name}&quot;?
                    This action cannot be undone.
                    {hasItems && (
                      <p className="mt-2 font-semibold text-destructive">
                        This will also delete all items in this category!
                      </p>
                    )}
                    {hasSubCategories && (
                      <p className="mt-2 font-semibold text-destructive">
                        This will also delete all its subcategories and their
                        items!
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteCategory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
