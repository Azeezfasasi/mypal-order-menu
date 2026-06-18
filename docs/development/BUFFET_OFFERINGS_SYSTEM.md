# Buffet Offerings System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Structure](#data-structure)
4. [Configuration System](#configuration-system)
5. [Component Hierarchy](#component-hierarchy)
6. [Features](#features)
7. [Permissions & Access Control](#permissions--access-control)
8. [UI/UX Guidelines](#uiux-guidelines)
9. [API Integration](#api-integration)
10. [Common Use Cases](#common-use-cases)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Buffet Offerings System is a flexible, hierarchical menu management solution designed for managing buffet services, special offers, and add-ons (drinks, extras). It supports nested categories, items with rich media, and fine-grained permission controls.

### Key Capabilities

- ✅ **Multi-level nesting** - Up to configurable depth (e.g., Drinks → Beer → Lager → Items)
- ✅ **Rich media support** - Images for categories, subcategories, and items
- ✅ **Flexible pricing** - Per-person, per-adult/child pricing models
- ✅ **Protected defaults** - Prevent editing/deletion of system defaults
- ✅ **Configurable permissions** - Control add/edit/delete per category type
- ✅ **Responsive UI** - Optimized for desktop and mobile

---

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ (React 18+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState)
- **Data Fetching**: React Query (via ServiceOfferingApi)
- **Image Optimization**: Next.js Image component

### File Structure

```
src/components/offerings/buffet-offerings/
├── index.tsx                          # Main container component
├── category-section.tsx               # Category/subcategory renderer
├── category-config.ts                 # Configuration & permissions
├── data-transformers.ts               # API ↔ UI data transformers
├── add-item-modal.tsx                 # Modal for adding items
├── add-subcategory-modal.tsx          # Modal for adding subcategories
├── add-subcategory-modal-simple.tsx   # Simplified subcategory modal
├── edit-item-modal.tsx                # Modal for editing items
├── edit-subcategory-modal.tsx         # Modal for editing subcategories
└── dummy-data.ts                      # Sample data for testing
```

---

## Data Structure

### Hierarchy

```
Category (Top Level)
└── CategoryType: BUFFET_MEAL | SPECIAL_OFFER | BUFFET_ADDON
    │
    ├── SubCategory (Level 0)
    │   ├── Items []
    │   └── SubCategories [] (nested)
    │       │
    │       └── SubCategory (Level 1)
    │           ├── Items []
    │           └── SubCategories [] (Level 2, etc.)
```

### Type Definitions

#### BuffetCategoryUI

```typescript
interface BuffetCategoryUI {
  id: string;
  name: string;
  categoryType: CategoryType; // 'buffet_meal' | 'special_offer' | 'buffet_addon'
  imageUrl?: string;
  subCategories: BuffetSubCategoryUI[];
}
```

#### BuffetSubCategoryUI

```typescript
interface BuffetSubCategoryUI {
  id: string;
  name: string;
  pricePerAdult?: number; // For buffet meals
  pricePerChild?: number; // For buffet meals
  imageUrl?: string;
  items: BuffetItemUI[];
  subCategories?: BuffetSubCategoryUI[]; // Recursive nesting
  isDefault?: boolean; // Protected from edit/delete
}
```

#### BuffetItemUI

```typescript
interface BuffetItemUI {
  id: string;
  name: string;
  price?: number; // Per-person price
  description?: string;
  imageUrls?: string[]; // Multiple images
  backgroundImageUrl?: string;
  isDefault?: boolean; // Protected from edit/delete
}
```

### Example Data Structure

```json
{
  "id": "drinks-menu-001",
  "name": "Drinks Menu",
  "categoryType": "buffet_addon",
  "imageUrl": "https://example.com/drinks.jpg",
  "subCategories": [
    {
      "id": "beer-001",
      "name": "Beer",
      "isDefault": true,
      "imageUrl": "https://example.com/beer.jpg",
      "items": [],
      "subCategories": [
        {
          "id": "lager-001",
          "name": "Lager",
          "isDefault": true,
          "items": [
            {
              "id": "heineken-001",
              "name": "Heineken",
              "price": 1500,
              "description": "Premium Dutch lager",
              "imageUrls": ["https://example.com/heineken.jpg"],
              "isDefault": false
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Configuration System

### Category Types

| Category Type   | Description        | Use Case                        |
| --------------- | ------------------ | ------------------------------- |
| `BUFFET_MEAL`   | Main buffet meals  | Breakfast, Lunch, Dinner menus  |
| `SPECIAL_OFFER` | Promotional offers | Sunday Brunch, Holiday Specials |
| `BUFFET_ADDON`  | Additional items   | Drinks, Desserts, Extras        |

### Configuration Options

Located in `category-config.ts`:

```typescript
interface CategoryConfig {
  // Visual styling
  gradient: string; // Header gradient/color
  headerColor: string; // Subcategory header color
  borderColor: string; // Border color
  palette: "warm" | "cool" | "neutral"; // Color scheme

  // Display options
  showPricing?: boolean; // Show per-adult/child prices
  showAddButton?: boolean; // Show "Add Category" button
  buttonText?: string; // Button label text

  // Permissions
  canAddSubcategory?: boolean; // Allow adding nested subcategories
  canEditSubcategory?: boolean; // Allow editing subcategories
  canDeleteSubcategory?: boolean; // Allow deleting subcategories
  canAddItem?: boolean; // Allow adding items
  canEditItem?: boolean; // Allow editing items
  canDeleteItem?: boolean; // Allow deleting items

  // Nesting control
  maxNestingDepth?: number; // Max nesting levels (0 = flat)
}
```

### Current Configurations

#### BUFFET_MEAL (Breakfast, Lunch, Dinner)

```typescript
{
  showPricing: true,              // Display adult/child prices
  canAddSubcategory: false,       // ❌ Cannot add subcategories
  canEditSubcategory: true,       // ✅ Can edit existing
  canDeleteSubcategory: false,    // ❌ Cannot delete
  canAddItem: false,              // ❌ Cannot add items
  canEditItem: true,              // ✅ Can edit existing
  canDeleteItem: false,           // ❌ Cannot delete
  maxNestingDepth: 0,             // Flat structure only
  palette: 'warm'
}
```

**Use Case**: Fixed menu structure where items are predefined and only prices/descriptions can be updated.

#### SPECIAL_OFFER (Promotions)

```typescript
{
  showAddButton: true,            // Show "New offer" button
  canAddSubcategory: true,        // ✅ Can add offers
  canEditSubcategory: true,       // ✅ Can edit
  canDeleteSubcategory: true,     // ✅ Can delete
  canAddItem: true,               // ✅ Can add items
  canEditItem: true,              // ✅ Can edit
  canDeleteItem: true,            // ✅ Can delete
  maxNestingDepth: 0,             // No nesting
  palette: 'warm'
}
```

**Use Case**: Fully flexible promotional offers that can be created, edited, and removed.

#### BUFFET_ADDON (Drinks Menu)

```typescript
{
  canAddSubcategory: false,       // ❌ Not using for now
  canEditSubcategory: true,       // ✅ Can edit
  canDeleteSubcategory: true,     // ✅ Can delete
  canAddItem: true,               // ✅ Can add items
  canEditItem: true,              // ✅ Can edit
  canDeleteItem: true,            // ✅ Can delete
  maxNestingDepth: 2,             // Up to 2 levels deep
  palette: 'neutral'
}
```

**Use Case**: Flexible drink menu with categories (Beer, Wine) that can contain items.

---

## Component Hierarchy

### Main Components Flow

```
BuffetOfferingsContent (index.tsx)
│
├── ServiceOfferingApi.useBusinessMenus() ← API data fetching
│
├── transformBuffetData() ← Transform API → UI data
│
└── CategorySection (for each category)
    │
    ├── Accordion (Collapsible category)
    │   │
    │   ├── Category Header (with image/gradient)
    │   │   └── "Add Category" button (if allowed)
    │   │
    │   └── AccordionContent
    │       │
    │       ├── SubCategories (recursive)
    │       │   ├── renderSubCategoryHeader()
    │       │   │   ├── Chevron (expand/collapse)
    │       │   │   ├── Name + Pricing badges
    │       │   │   ├── "Default" badge (if isDefault)
    │       │   │   └── Action buttons
    │       │   │       ├── "Add Subcategory" (blue)
    │       │   │       ├── "Add Item" (orange)
    │       │   │       ├── "Edit" (gray)
    │       │   │       └── "Delete" (red)
    │       │   │
    │       │   └── renderSubCategoryContent()
    │       │       ├── Nested SubCategories (recursive)
    │       │       └── Items List
    │       │
    │       └── Items
    │           ├── Item Row
    │           │   ├── Thumbnail image (64x64)
    │           │   ├── Name + Price + Description
    │           │   ├── "Default" badge (if isDefault)
    │           │   └── Edit/Delete buttons
    │           │
    │           └── "Add Item" button (bottom)
```

### State Management

**Local State (CategorySection)**

```typescript
const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(
  new Set(),
);
```

- Tracks which subcategories are expanded/collapsed
- Uses Set for O(1) lookup performance

**Modal States (BuffetOfferingsContent)**

```typescript
const [addSubcategoryModal, setAddSubcategoryModal] = useState({...});
const [addItemModal, setAddItemModal] = useState({...});
const [editSubcategoryModal, setEditSubcategoryModal] = useState({...});
const [editItemModal, setEditItemModal] = useState({...});
const [deleteConfirmation, setDeleteConfirmation] = useState({...});
```

---

## Features

### 1. Nested Subcategories

**Maximum Depth Control**

```typescript
// Check if more nesting is allowed
const canAddMoreNesting =
  config.maxNestingDepth === undefined ||
  config.maxNestingDepth === null ||
  currentDepth < config.maxNestingDepth;
```

**Depth Tracking**

```typescript
// Recursive depth passing
renderSubCategoryHeader(subCategory, false, false, true, currentDepth + 1);
renderSubCategoryContent(subCategory, true, currentDepth + 1);
```

**Example Nesting Levels**:

```
Drinks Menu (Category)
└─ Beer (Depth 0)
   └─ Lager (Depth 1)
      └─ Premium Lager (Depth 2) ← Max depth reached
         ❌ Cannot add more subcategories
```

### 2. Default Item Protection

**Backend Flag**

```json
{
  "isDefault": true // Set by backend/admin
}
```

**Frontend Behavior**

```typescript
// Hide Edit button
{config.canEditItem && !item.isDefault && (
  <Button>Edit</Button>
)}

// Hide Delete button
{config.canDeleteItem && !item.isDefault && (
  <Button>Delete</Button>
)}
```

**Visual Indicator**

```tsx
{
  item.isDefault && (
    <Badge className="bg-blue-100 text-blue-700">Default</Badge>
  );
}
```

### 3. Smart Button Display

**Logic Flow**:

```typescript
// Subcategory has nested children?
if (hasNestedSubCategories && canAddMoreNesting) {
  show("Add Subcategory"); // Blue button
} else if (!hasNestedSubCategories && canAddItems) {
  show("Add Item"); // Orange button
}

// Always check permissions and isDefault
if (canEdit && !isDefault) {
  show("Edit"); // Gray button
}

if (canDelete && !isDefault) {
  show("Delete"); // Red button
}
```

### 4. Image Handling

**Category/Subcategory Images** (Background)

```typescript
const bgStyle = subCategory.imageUrl
  ? {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${subCategory.imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  : {};
```

**Item Images** (Thumbnail)

```tsx
{
  item.imageUrls && item.imageUrls.length > 0 && (
    <div className="relative w-16 h-16">
      <Image
        src={item.imageUrls[0]}
        alt={item.name}
        fill
        sizes="64px"
        className="object-cover rounded-md"
      />
    </div>
  );
}
```

### 5. Responsive Pricing Display

**Buffet Meals** (Per Adult/Child)

```tsx
{
  category.categoryType === "buffet_meal" && (
    <>
      <Badge>{formatCurrency(pricePerAdult)} per Adult</Badge>
      <Badge>{formatCurrency(pricePerChild)} per Child</Badge>
    </>
  );
}
```

**Add-ons/Items** (Per Person)

```tsx
{
  item.price && <span>{formatCurrency(item.price)} per person</span>;
}
```

---

## Permissions & Access Control

### Permission Hierarchy

```
Category Type Config
    ↓
Can Add/Edit/Delete Subcategory?
    ↓
Can Add/Edit/Delete Item?
    ↓
Is Default? (Override)
    ↓
Show/Hide Buttons
```

### Permission Matrix

| Action             | BUFFET_MEAL      | SPECIAL_OFFER    | BUFFET_ADDON     |
| ------------------ | ---------------- | ---------------- | ---------------- |
| Add Subcategory    | ❌               | ✅               | ❌\*             |
| Edit Subcategory   | ✅ (if !default) | ✅ (if !default) | ✅ (if !default) |
| Delete Subcategory | ❌               | ✅ (if !default) | ✅ (if !default) |
| Add Item           | ❌               | ✅               | ✅               |
| Edit Item          | ✅ (if !default) | ✅ (if !default) | ✅ (if !default) |
| Delete Item        | ❌               | ✅ (if !default) | ✅ (if !default) |

\*Temporarily disabled, can be re-enabled in config

### Override Rules

1. **isDefault always wins** - Even if `canEdit: true`, editing is blocked if `isDefault: true`
2. **Depth limits enforced** - Cannot add subcategories beyond `maxNestingDepth`
3. **Nested logic** - Cannot add items AND subcategories at same level

---

## UI/UX Guidelines

### Color Coding

| Element         | Color      | Purpose                           |
| --------------- | ---------- | --------------------------------- |
| Add Subcategory | Blue       | Structural/organizational actions |
| Add Item        | Orange     | Content actions                   |
| Edit            | Gray       | Modification actions              |
| Delete          | Red        | Destructive actions               |
| Default Badge   | Light Blue | System-protected items            |

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ CATEGORY (Large, gradient/image background)        │
│                                    [Add Category]   │
├─────────────────────────────────────────────────────┤
│  ▼ Subcategory (Medium, colored/image)  [Buttons]  │
│    ├─────────────────────────────────────────────  │
│    │ • Item with image (Small, light bg) [Buttons] │
│    │ • Item with image (Small, light bg) [Buttons] │
│    └─────────────────────────────────────────────  │
└─────────────────────────────────────────────────────┘
```

### Interaction Patterns

**Expand/Collapse**

- Click anywhere on subcategory header to expand/collapse
- Chevron rotates 180° when expanded
- Smooth transitions (200ms)

**Hover States**

- Buttons: Background color change
- Subcategories with images: Opacity change (90%)
- Items: Subtle background highlight

**Loading States**

- Skeleton screens during data fetch
- Spinner with "Loading buffet offerings..." text
- Error boundaries with retry options

---

## API Integration

### Endpoints

**Fetch All Business Menus**

```typescript
ServiceOfferingApi.useBusinessMenus();
// GET /api/business-menus
// Returns: IServiceCategory[]
```

**Delete Category**

```typescript
ServiceOfferingApi.useDeleteCategory();
// DELETE /api/categories/:id
```

**Delete Item**

```typescript
ServiceOfferingApi.useDeleteServiceItem();
// DELETE /api/items/:id
```

### Data Transformation

**API → UI Transformation**

```typescript
transformBuffetData(apiCategories: IServiceCategory[]): BuffetCategoryUI[]
```

**Recursive Transformation**

```typescript
transformSubCategoryRecursive(sub: IServiceCategory): BuffetSubCategoryUI
// Handles unlimited nesting depth
// Maps API field names to UI-friendly names
// Preserves isDefault flags
```

**UI → API Transformation**

```typescript
convertToServiceCategory(subCategory: BuffetSubCategoryUI, categoryType: CategoryType): IServiceCategory
convertToServiceItem(item: BuffetItemUI): IServiceItem
```

### React Query Integration

**Automatic Refetching**

- On window focus
- After mutations (create/update/delete)
- Stale time: 30 seconds (configurable)

**Optimistic Updates**

- Immediate UI feedback
- Rollback on error
- Toast notifications for success/failure

---

## Common Use Cases

### Use Case 1: Adding a New Drink Item

**Scenario**: Add "Corona Extra" to Lager subcategory

**Steps**:

1. Navigate to Drinks Menu → Beer → Lager
2. Click "Add Item" button (orange)
3. Fill in modal:
   - Name: "Corona Extra"
   - Price: ₦2000
   - Description: "Mexican premium lager"
   - Upload image
4. Submit
5. Item appears in list with Edit/Delete buttons

**Code Flow**:

```typescript
handleAddItem(lagerId)
  → setAddItemModal({ isOpen: true, categoryId: lagerId })
  → <AddItemModal> submission
  → API: POST /items
  → React Query refetch
  → UI updates
```

### Use Case 2: Editing Default Buffet Meal

**Scenario**: Update price for "Breakfast" (default)

**UI Behavior**:

- ❌ Edit button is hidden (because isDefault: true)
- ✅ Only view mode available
- 💡 Badge shows "Default"

**Workaround**:
If editing is needed, backend must:

1. Remove `isDefault: true` flag
2. Frontend will automatically show Edit button

### Use Case 3: Creating Special Offer

**Scenario**: Add "Sunday Brunch Special"

**Steps**:

1. Navigate to Special Offers category
2. Click "New offer" button (top right)
3. Fill in modal:
   - Name: "Sunday Brunch Special"
   - Upload banner image
4. Submit
5. Add items to the new offer:
   - "Unlimited Breakfast Buffet" - ₦15,000
   - "Complimentary Mimosa" - ₦0

**Permissions**: Full control (add/edit/delete) because category type is SPECIAL_OFFER

### Use Case 4: Managing Nested Drinks Menu

**Current Structure**:

```
Drinks Menu
├─ Beer [Default] ← Cannot edit/delete
│  ├─ Lager [Default] ← Cannot edit/delete
│  │  └─ Items ← Can add/edit/delete items
│  └─ Stout [Default]
└─ Wine
   └─ Red Wine
```

**Limitations**:

- ❌ Cannot add more subcategories (canAddSubcategory: false)
- ✅ Can add items to any subcategory
- ✅ Can edit/delete non-default items
- ❌ Cannot edit/delete default subcategories

---

## Troubleshooting

### Issue 1: "Add Subcategory" Button Not Showing

**Possible Causes**:

1. `canAddSubcategory: false` in config
2. Max nesting depth reached
3. Subcategory already has items (structural constraint)

**Solution**:

```typescript
// Check config
categoryConfigs[CategoryType.BUFFET_ADDON].canAddSubcategory = true;

// Check depth
config.maxNestingDepth = 3; // Increase if needed

// Check if subcategory has items
// Cannot mix items and subcategories at same level
```

### Issue 2: Cannot Delete Item

**Possible Causes**:

1. Item has `isDefault: true`
2. Category config has `canDeleteItem: false`

**Solution**:

```typescript
// Check item
console.log(item.isDefault); // Should be false/undefined

// Check config
categoryConfigs[CategoryType.BUFFET_MEAL].canDeleteItem = true;
```

### Issue 3: Images Not Loading

**Possible Causes**:

1. Invalid image URL
2. CORS issues
3. Next.js Image domains not configured

**Solution**:

```javascript
// next.config.js
module.exports = {
  images: {
    domains: [
      "mipal-business-data.s3.eu-west-2.amazonaws.com",
      "your-cdn-domain.com",
    ],
  },
};
```

### Issue 4: Nesting Depth Not Working

**Debug Steps**:

```typescript
// Add console logs in renderSubCategoryHeader
console.log("Current Depth:", currentDepth);
console.log("Max Depth:", config.maxNestingDepth);
console.log("Can Add More:", canAddMoreNesting);

// Verify depth is being passed correctly
renderSubCategoryHeader(subCategory, false, false, true, currentDepth + 1);
// ↑ Check this
```

### Issue 5: Permissions Not Applying

**Check List**:

1. ✅ Verify category type is correct
2. ✅ Check config for that specific category type
3. ✅ Ensure `isDefault` flag is being read correctly
4. ✅ Clear browser cache and reload

**Debug**:

```typescript
// In CategorySection component
console.log("Category Type:", category.categoryType);
console.log("Config:", config);
console.log("Is Default:", subCategory.isDefault || item.isDefault);
```

---

## Performance Considerations

### Optimization Strategies

**1. Memoization**

```typescript
const categories = useMemo(() => {
  return transformBuffetData(apiCategories);
}, [apiCategories]);
```

**2. Lazy Loading Images**

```tsx
<Image loading="lazy" placeholder="blur" blurDataURL="/placeholder.jpg" />
```

**3. Virtual Scrolling** (Future Enhancement)
For very long lists of items, consider:

- `react-window`
- `react-virtual`

**4. Code Splitting**

```typescript
const AddItemModal = dynamic(() => import('./add-item-modal'), {
  loading: () => <Spinner />
});
```

### Best Practices

1. **Avoid Deep Nesting** - Max 2-3 levels recommended
2. **Optimize Images** - Use WebP format, max 500KB
3. **Limit Items per Subcategory** - Keep under 50 for best UX
4. **Use Pagination** - For subcategories with 20+ items

---

## Future Enhancements

### Planned Features

- [ ] Drag-and-drop reordering
- [ ] Bulk operations (multi-select delete/edit)
- [ ] Search and filter functionality
- [ ] Export/import menu data (CSV/JSON)
- [ ] Multi-language support
- [ ] Advanced analytics (popular items, revenue)
- [ ] Menu scheduling (time-based availability)
- [ ] Inventory integration

### Configuration Expansions

```typescript
interface CategoryConfig {
  // New fields
  allowReordering?: boolean;
  allowBulkOperations?: boolean;
  showAnalytics?: boolean;
  customValidation?: (data: any) => boolean;
}
```

---

## Contributing

### Adding a New Category Type

1. **Define Type**

```typescript
// src/types/service-offering-types.ts
export enum CategoryType {
  BUFFET_MEAL = "buffet_meal",
  SPECIAL_OFFER = "special_offer",
  BUFFET_ADDON = "buffet_addon",
  NEW_TYPE = "new_type", // ← Add here
}
```

2. **Add Configuration**

```typescript
// category-config.ts
export const categoryConfigs: Record<CategoryType, CategoryConfig> = {
  // ... existing configs
  [CategoryType.NEW_TYPE]: {
    gradient: "bg-green-600",
    palette: "cool",
    canAddSubcategory: true,
    canAddItem: true,
    maxNestingDepth: 1,
    // ... other settings
  },
};
```

3. **Update Transformers** (if needed)

```typescript
// data-transformers.ts
// Add any special transformation logic
```

4. **Test Thoroughly**

- Create items
- Edit items
- Delete items
- Test nesting
- Verify permissions

---

## Support & Contact

**Documentation Maintained By**: Development Team  
**Last Updated**: October 30, 2025  
**Version**: 2.0.0

For questions or issues:

- Create an issue in the repository
- Contact: dev-team@mipal.com
- Slack: #buffet-offerings-support

---

## Changelog

### Version 2.0.0 (October 30, 2025)

- ✅ Added configurable nesting depth control
- ✅ Implemented default item/subcategory protection
- ✅ Enhanced UI with image thumbnails for items
- ✅ Added smart button display logic
- ✅ Improved visual hierarchy and styling
- ✅ Hidden Edit buttons for default items
- ✅ Disabled Add Subcategory for BUFFET_ADDON (temporary)

### Version 1.0.0 (Initial Release)

- Basic category/subcategory/item structure
- Image support for categories
- CRUD operations
- Permission system
- Responsive UI

---

**End of Documentation**
