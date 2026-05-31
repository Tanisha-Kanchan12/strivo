"use client";

import { cn } from "@/lib/utils";

interface SelectableChipProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  tone?: "light" | "dark";
}

export function SelectableChip({
  label,
  description,
  selected,
  onClick,
  className,
  tone = "light",
}: SelectableChipProps) {
  const isDark = tone === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-4 text-left transition-all",
        isDark
          ? selected
            ? "chip-active-dark"
            : "chip-inactive-dark"
          : selected
            ? "chip-active"
            : "chip-inactive",
        className
      )}
    >
      <span className="block text-sm font-semibold">{label}</span>
      {description && (
        <span
          className={cn(
            "mt-1 block text-xs",
            isDark
              ? selected
                ? "text-strivo-text"
                : "text-white/75"
              : selected
                ? "text-white"
                : "text-strivo-secondary"
          )}
        >
          {description}
        </span>
      )}
    </button>
  );
}

interface SelectableChipGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export function SelectableChipGrid({
  children,
  columns = 2,
}: SelectableChipGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}
