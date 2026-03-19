"use client";

import { CATEGORIES } from "@/lib/types";

export type SortOption = "date" | "venue" | "trending" | "recent";
export type TimeFilter = "all" | "this-week" | "this-weekend" | "this-month" | "next-month";
export type CostFilter = "all" | "free" | "under10" | "under25";

type Props = {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (f: TimeFilter) => void;
  costFilter: CostFilter;
  onCostFilterChange: (f: CostFilter) => void;
  selectedCategories: string[];
  onCategoryToggle: (cat: string) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
};

const pill = "rounded-full px-3 py-1.5 text-xs font-medium transition-colors";
const pillActive = `${pill} bg-[var(--primary)] text-white`;
const pillInactive = `${pill} bg-gray-100 text-gray-600 hover:bg-gray-200`;

export default function EventFilters({
  sortBy, onSortChange,
  timeFilter, onTimeFilterChange,
  costFilter, onCostFilterChange,
  selectedCategories, onCategoryToggle,
  onClearFilters, resultCount, totalCount,
}: Props) {
  const hasFilters = timeFilter !== "all" || costFilter !== "all" || selectedCategories.length > 0 || sortBy !== "date";

  return (
    <div className="mt-6 space-y-3">
      {/* Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Sort:</span>
        {([["date", "Date"], ["venue", "Venue"], ["trending", "Trending"], ["recent", "Recently Added"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => onSortChange(val)} className={sortBy === val ? pillActive : pillInactive}>
            {label}
          </button>
        ))}
      </div>

      {/* Time filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">When:</span>
        {([["all", "All"], ["this-week", "This Week"], ["this-weekend", "This Weekend"], ["this-month", "This Month"], ["next-month", "Next Month"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => onTimeFilterChange(val)} className={timeFilter === val ? pillActive : pillInactive}>
            {label}
          </button>
        ))}
      </div>

      {/* Cost filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Cost:</span>
        {([["all", "All"], ["free", "Free"], ["under10", "Under $10"], ["under25", "Under $25"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => onCostFilterChange(val)} className={costFilter === val ? pillActive : pillInactive}>
            {label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Category:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryToggle(cat)}
            className={selectedCategories.includes(cat) ? pillActive : pillInactive}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count + clear */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>Showing {resultCount} of {totalCount} events</span>
        {hasFilters && (
          <button onClick={onClearFilters} className="text-xs text-[var(--primary)] hover:underline">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
