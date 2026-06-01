"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, memo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FilterChipData } from "@/types/matching";

interface ExploreFiltersPanelProps {
  allFilters: FilterChipData[];
  customFilters: FilterChipData[];
  activeFilter: string;
  onApplyFilter: (filterId: string) => void;
  onCustomFilterAdded: (filter: FilterChipData) => void;
  onClose: () => void;
}

export const ExploreFiltersPanel = memo(function ExploreFiltersPanel({
  allFilters,
  customFilters,
  activeFilter,
  onApplyFilter,
  onCustomFilterAdded,
  onClose,
}: ExploreFiltersPanelProps) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const combined = useMemo(
    () => [
      { id: "ALL", label: "All" },
      ...allFilters.filter((f) => f.id !== "ALL"),
      ...customFilters,
    ],
    [allFilters, customFilters]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return combined;
    return combined.filter((chip) => chip.label.toLowerCase().includes(q));
  }, [combined, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return combined.some((c) => c.label.toLowerCase() === q);
  }, [combined, query]);

  async function addCustomFilter() {
    const label = query.trim();
    if (!label) return;
    setAdding(true);
    try {
      const res = await fetch("/api/filters/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add filter");
      const newFilter = { id: data.filter.id, label: data.filter.label };
      onCustomFilterAdded(newFilter);
      onApplyFilter(newFilter.id);
      setQuery("");
      onClose();
      toast.success(`Added "${label}" as your filter`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add filter");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl border border-strivo-line">
      <div className="border-b border-strivo-line p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-strivo-secondary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filters..."
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-[min(50vh,400px)] overflow-y-auto overflow-x-hidden">
        {filtered.map((chip) => (
          <label
            key={chip.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 border-b border-strivo-line px-4 py-3 transition-colors hover:bg-strivo-muted",
              activeFilter === chip.id && "bg-blue-50"
            )}
          >
            <input
              type="radio"
              name="explore-filter"
              checked={activeFilter === chip.id}
              onChange={() => {
                onApplyFilter(chip.id);
                onClose();
              }}
              className="h-4 w-4 accent-[#3B82F6]"
            />
            <span className="flex-1 text-sm font-medium text-strivo-text">
              {chip.label}
            </span>
          </label>
        ))}

        {query.trim() && !exactMatch && (
          <div className="border-t border-strivo-line p-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              onClick={addCustomFilter}
              loading={adding}
              disabled={adding}
            >
              <Plus className="h-4 w-4" />
              + Add {query.trim()} as your filter
            </Button>
          </div>
        )}

        {filtered.length === 0 && !query.trim() && (
          <p className="p-6 text-center text-sm text-strivo-secondary">
            No filters found.
          </p>
        )}
      </div>
    </div>
  );
});
