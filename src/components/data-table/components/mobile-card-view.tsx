// // components/ui/data-table/mobile-card-view.tsx
// import React from "react";
// import { Row } from "@tanstack/react-table";
// import { Card, CardContent } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { TableConfig, ResponsiveColumnConfig } from "../enhanced_table_types";

// interface MobileCardViewProps<T> {
//   rows: Row<T>[];
//   config: TableConfig<T>;
//   onRowSelect?: (row: Row<T>) => void;
// }

// export function MobileCardView<T>({
//   rows,
//   config,
//   onRowSelect,
// }: MobileCardViewProps<T>) {
//   const getPriorityColumns = () => {
//     return config.columns
//       .filter((col) => !col.meta?.hideOnMobile && (col.meta?.priority || 0) > 0)
//       .sort((a, b) => (b.meta?.priority || 0) - (a.meta?.priority || 0))
//       .slice(0, 3); // Show top 3 priority columns
//   };

//   const priorityColumns = getPriorityColumns();

//   const renderCellValue = (column: ResponsiveColumnConfig<T>, row: Row<T>) => {
//     const value = column.accessorKey
//       ? row.getValue(column.accessorKey as string)
//       : column.accessorFn
//       ? column.accessorFn(row.original)
//       : "";

//     if (column.type === "badge") {
//       return (
//         <Badge variant="secondary" className="text-xs">
//           {column.format ? column.format(value) : String(value)}
//         </Badge>
//       );
//     }

//     if (column.type === "currency") {
//       return (
//         <span className="font-medium">
//           {column.format ? column.format(value) : `$${value}`}
//         </span>
//       );
//     }

//     if (column.type === "date") {
//       return (
//         <span className="text-sm text-muted-foreground">
//           {column.format
//             ? column.format(value)
//             : new Date(value).toLocaleDateString()}
//         </span>
//       );
//     }

//     return (
//       <span className="text-sm">
//         {column.format ? column.format(value) : String(value)}
//       </span>
//     );
//   };

//   if (rows.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-8 text-center">
//         <div className="text-lg font-medium">
//           {config.emptyStateMessage || "No results found"}
//         </div>
//         <div className="text-sm text-muted-foreground mt-2">
//           Try adjusting your search or filter criteria
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-3">
//       {rows.map((row) => (
//         <Card
//           key={row.id}
//           className={cn(
//             "transition-all duration-200",
//             row.getIsSelected() && "ring-2 ring-primary",
//             "hover:shadow-md cursor-pointer"
//           )}
//           onClick={() => onRowSelect?.(row)}
//         >
//           <CardContent className="p-4">
//             <div className="flex items-start justify-between">
//               <div className="flex items-start space-x-3 flex-1">
//                 {/* Selection checkbox */}
//                 {config.enableSelection && (
//                   <Checkbox
//                     checked={row.getIsSelected()}
//                     onCheckedChange={(value) => row.toggleSelected(!!value)}
//                     onClick={(e) => e.stopPropagation()}
//                     className="mt-1"
//                   />
//                 )}

//                 {/* Main content */}
//                 <div className="flex-1 min-w-0">
//                   <div className="grid grid-cols-1 gap-2">
//                     {priorityColumns.map((column) => (
//                       <div key={column.id} className="flex flex-col space-y-1">
//                         <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                           {typeof column.header === "string"
//                             ? column.header
//                             : column.id}
//                         </div>
//                         <div className="truncate">
//                           {renderCellValue(column, row)}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Actions */}
//               {config.actions && config.actions.length > 0 && (
//                 <div className="flex items-center space-x-1 ml-3">
//                   {config.actions
//                     .filter((action) => !action.hidden?.(row.original))
//                     .slice(0, 2) // Show max 2 actions on mobile
//                     .map((action) => {
//                       const Icon = action.icon;
//                       return (
//                         <Button
//                           key={action.id}
//                           variant={action.variant || "ghost"}
//                           size="sm"
//                           className="h-8 w-8 p-0"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             action.onClick(row.original);
//                           }}
//                           disabled={action.disabled?.(row.original)}
//                         >
//                           {Icon && <Icon className="h-4 w-4" />}
//                         </Button>
//                       );
//                     })}
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// }
