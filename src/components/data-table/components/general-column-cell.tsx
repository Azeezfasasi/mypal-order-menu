import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Mail, Phone, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import {
  TableColumn,
  ImageConfig,
  LinkConfig,
  TagsConfig,
  ProgressConfig,
  RatingConfig,
  StatusConfig,
} from "../enhanced_table_types";
import {
  formatDate,
  formatPercentage,
  getInitials,
  isObjectWithName,
  isArrayOfStringOrNumber,
  isStringOrNumber,
  getEnhancedStatusColor,
} from "../table-utils";
import { ExtendedBadgeVariant, StatusBadge } from "../../shared/status-badge";

export default function GeneralColumnCell<T>({
  column,
  value,
  row,
}: {
  column: TableColumn<T>;
  value: unknown;
  row: { original: T };
}) {
  switch (column.type) {
    case "date":
      return <span>{formatDate(value as string | Date, column.format)}</span>;
    case "datetime":
      return <span>{new Date(value as string | Date).toLocaleString()}</span>;
    case "currency":
      return <span>{formatCurrency(Number(value), column.currency)}</span>;
    case "percentage":
      return <span>{formatPercentage(Number(value))}</span>;
    case "number":
      return <span>{Number(value).toLocaleString()}</span>;
    case "status": {
      const statusConfig: StatusConfig = column.statusConfig || {};
      const statusValue = String(value);

      // Get the appropriate variant
      const statusVariant = getEnhancedStatusColor(
        statusValue,
        statusConfig.colorMap
      );

      // Get the icon if configured
      const StatusIcon =
        statusConfig.showIcon && statusConfig.iconMap?.[statusValue];

      return (
        <StatusBadge
          variant={statusVariant}
          badgeType={statusConfig.badgeType || "badge"}
          showDot={statusConfig.showDot}
          dotPosition={statusConfig.dotPosition}
          icon={StatusIcon || undefined}
          className={cn("capitalize", statusConfig.className)}
        >
          {statusValue}
        </StatusBadge>
      );
    }

    case "avatar": {
      const imageConfig: ImageConfig = column.imageConfig || {};
      const sizeClass = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
      }[imageConfig.size || "md"];
      const name = isObjectWithName(row.original) ? row.original.name : "U";
      return (
        <div className="flex items-center gap-2">
          <Avatar className={sizeClass}>
            <AvatarImage
              src={isStringOrNumber(value) ? String(value) : undefined}
            />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          {imageConfig.showName && <span className="font-medium">{name}</span>}
        </div>
      );
    }
    case "image": {
      const imgConfig: ImageConfig = column.imageConfig || {};
      const imgSizeClass = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
      }[imgConfig.size || "md"];
      return (
        <Image
          src={
            isStringOrNumber(value)
              ? String(value)
              : imgConfig.fallback || "/placeholder.svg"
          }
          alt=""
          className={cn(imgSizeClass, "object-cover", {
            "rounded-full": imgConfig.shape === "circle",
            rounded: imgConfig.shape === "rounded",
          })}
          width={64}
          height={64}
        />
      );
    }
    case "link": {
      const linkConfig: LinkConfig = column.linkConfig || {};
      return (
        <a
          href={isStringOrNumber(value) ? String(value) : undefined}
          target={linkConfig.target || "_blank"}
          rel={
            linkConfig.external !== false ? "noopener noreferrer" : undefined
          }
          className={cn(
            "text-blue-600 hover:underline flex items-center gap-1",
            linkConfig.className
          )}
        >
          {String(value)}
          {linkConfig.external !== false && (
            <ExternalLink className="w-3 h-3" />
          )}
        </a>
      );
    }
    case "email":
      return (
        <a
          href={isStringOrNumber(value) ? `mailto:${value}` : undefined}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Mail className="w-3 h-3" />
          {String(value)}
        </a>
      );
    case "phone":
      return (
        <a
          href={isStringOrNumber(value) ? `tel:${value}` : undefined}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Phone className="w-3 h-3" />
          {String(value)}
        </a>
      );
    case "boolean":
      return (
        <div className="flex items-center">
          {Boolean(value) ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <X className="w-4 h-4 text-red-600" />
          )}
        </div>
      );
    case "tags": {
      const tagsConfig: TagsConfig = column.tagsConfig || {};
      const tags = isArrayOfStringOrNumber(value)
        ? value
        : isStringOrNumber(value)
        ? [value]
        : [];
      const maxDisplay = tagsConfig.maxDisplay || 3;
      const displayTags = tags.slice(0, maxDisplay);
      const remainingCount = tags.length - maxDisplay;
      return (
        <div className="flex flex-wrap gap-1">
          {displayTags.map((tag, index) => (
            <StatusBadge
              key={index}
              variant={
                (tagsConfig.variant as ExtendedBadgeVariant) || "secondary"
              }
              className="text-xs"
              style={{
                backgroundColor:
                  tagsConfig.colorMap?.[String(tag)] || undefined,
              }}
            >
              {String(tag)}
            </StatusBadge>
          ))}
          {remainingCount > 0 && (
            <StatusBadge variant="outline" className="text-xs">
              +{remainingCount}
            </StatusBadge>
          )}
        </div>
      );
    }
    case "progress": {
      const progressConfig: ProgressConfig = column.progressConfig || {};
      const percentage = Math.round(Number(value) * 100);
      return (
        <div className="flex items-center gap-2">
          <Progress value={percentage} className="flex-1" />
          {progressConfig.showPercentage && (
            <span className="text-sm text-muted-foreground min-w-[3ch]">
              {percentage}%
            </span>
          )}
        </div>
      );
    }
    case "rating": {
      const ratingConfig: RatingConfig = column.ratingConfig || {};
      const max = ratingConfig.max || 5;
      const rating = Math.round(Number(value));
      const Icon = ratingConfig.icon || Star;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => (
            <Icon
              key={i}
              className={cn("w-4 h-4", {
                "text-yellow-400 fill-current": i < rating,
                "text-gray-300": i >= rating,
              })}
            />
          ))}
          {ratingConfig.showValue && (
            <span className="text-sm text-muted-foreground ml-1">
              ({String(value)})
            </span>
          )}
        </div>
      );
    }
    default:
      return <span>{String(value)}</span>;
  }
}
