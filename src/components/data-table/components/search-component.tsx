// components/ui/data-table/search-component.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "relative max-w-sm",
}) => (
  <div className={className}>
    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-8"
    />
  </div>
);
