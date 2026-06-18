interface MenuHeaderProps {
  onAddCategory: (values: FormData) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MenuHeader({ onAddCategory }: MenuHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-orange-600 font-sora">
          Menu
        </h2>
        {/* <AddCategoryDialog
          onAddCategory={onAddCategory}
          buttonText="Add Menu"
          level={0}
        /> */}
      </div>
    </div>
  );
}
