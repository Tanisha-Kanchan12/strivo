"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { FilterChipData } from "@/types/matching";

interface FilterChipsProps {
  chips: FilterChipData[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export const FilterChips = memo(function FilterChips({
  chips,
  activeFilter,
  onFilterChange,
}: FilterChipsProps) {
  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onFilterChange(chip.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            activeFilter === chip.id ? "chip-active" : "chip-inactive"
          )}
        >
          {chip.label}
        </button>
      ))}
    </>
  );
});
