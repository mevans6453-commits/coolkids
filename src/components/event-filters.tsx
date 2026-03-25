"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, LayoutGrid, List } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, type AgeFilter } from "@/lib/types";

export type SortOption = "date" | "for-you" | "venue" | "trending" | "recent";
export type TimeFilter = "all" | "this-week" | "this-weekend" | "this-month" | "next-month";
export type CostFilter = "all" | "free" | "under10" | "under25";
export type ViewMode = "list" | "grid" | "calendar";
export type GroupBy = "none" | "category" | "venue";

type Props = {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (f: TimeFilter) => void;
  costFilter: CostFilter;
  onCostFilterChange: (f: CostFilter) => void;
  selectedCategories: string[];
  onCategoryToggle: (cat: string) => void;
  ageFilter: AgeFilter;
  onAgeFilterChange: (f: AgeFilter) => void;

  groupBy: GroupBy;
  onGroupByChange: (g: GroupBy) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  hasUserZip?: boolean;
};

const SORT_OPTIONS: [SortOption, string][] = [["for-you", "For You ✨"], ["date", "Date"], ["venue", "Venue"], ["trending", "Trending"], ["recent", "Recently Added"]];
const TIME_OPTIONS: [TimeFilter, string][] = [["all", "All"], ["this-week", "This Week"], ["this-weekend", "This Weekend"], ["this-month", "This Month"], ["next-month", "Next Month"]];
const COST_OPTIONS: [CostFilter, string][] = [["all", "All"], ["free", "Free"], ["under10", "Under $10"], ["under25", "Under $25"]];
const AGE_OPTIONS: [AgeFilter, string][] = [["all", "All Ages"], ["toddler", "Toddler (0-2)"], ["preschool", "Preschool (3-5)"], ["elementary", "Elementary (6-10)"], ["tween-teen", "Tween/Teen (11+)"]];
const GROUP_OPTIONS: [GroupBy, string][] = [["none", "None (Date)"], ["category", "Category"], ["venue", "Venue"]];

function sortLabel(v: SortOption) { return SORT_OPTIONS.find(([k]) => k === v)?.[1] ?? "Date"; }
function timeLabel(v: TimeFilter) { return TIME_OPTIONS.find(([k]) => k === v)?.[1] ?? "All"; }
function costLabel(v: CostFilter) { return COST_OPTIONS.find(([k]) => k === v)?.[1] ?? "All"; }
function ageLabel(v: AgeFilter) { return AGE_OPTIONS.find(([k]) => k === v)?.[1] ?? "All Ages"; }
function groupLabel(v: GroupBy) { return GROUP_OPTIONS.find(([k]) => k === v)?.[1] ?? "None"; }

export default function EventFilters(props: Props) {
  const {
    sortBy, onSortChange, timeFilter, onTimeFilterChange,
    costFilter, onCostFilterChange, selectedCategories, onCategoryToggle,
    ageFilter, onAgeFilterChange,
    groupBy, onGroupByChange,
    onClearFilters, resultCount, totalCount, viewMode, onViewModeChange,
  } = props;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasFilters = timeFilter !== "all" || costFilter !== "all" || selectedCategories.length > 0 || sortBy !== "date" || ageFilter !== "all" || groupBy !== "none";

  // Count active filters for badge
  const activeFilterCount = [
    sortBy !== "date",
    timeFilter !== "all",
    costFilter !== "all",
    selectedCategories.length > 0,
    ageFilter !== "all",
    groupBy !== "none",
  ].filter(Boolean).length;

  const filterDropdowns = (
    <>
      <Dropdown
        label="Sort"
        value={sortBy !== "date" ? sortLabel(sortBy) : undefined}
        onClear={sortBy !== "date" ? () => onSortChange("date") : undefined}
      >
        {SORT_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => onSortChange(val)}
            className={`block w-full px-4 py-2 text-left text-sm ${sortBy === val ? "bg-blue-50 font-medium text-[var(--primary)]" : "text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </Dropdown>

      <Dropdown
        label="Group"
        value={groupBy !== "none" ? groupLabel(groupBy) : undefined}
        onClear={groupBy !== "none" ? () => onGroupByChange("none") : undefined}
      >
        {GROUP_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => onGroupByChange(val)}
            className={`block w-full px-4 py-2 text-left text-sm ${groupBy === val ? "bg-blue-50 font-medium text-[var(--primary)]" : "text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </Dropdown>

      <Dropdown
        label="When"
        value={timeFilter !== "all" ? timeLabel(timeFilter) : undefined}
        onClear={timeFilter !== "all" ? () => onTimeFilterChange("all") : undefined}
      >
        {TIME_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => onTimeFilterChange(val)}
            className={`block w-full px-4 py-2 text-left text-sm ${timeFilter === val ? "bg-blue-50 font-medium text-[var(--primary)]" : "text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </Dropdown>

      <Dropdown
        label="Cost"
        value={costFilter !== "all" ? costLabel(costFilter) : undefined}
        onClear={costFilter !== "all" ? () => onCostFilterChange("all") : undefined}
      >
        {COST_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => onCostFilterChange(val)}
            className={`block w-full px-4 py-2 text-left text-sm ${costFilter === val ? "bg-blue-50 font-medium text-[var(--primary)]" : "text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </Dropdown>

      <Dropdown
        label="Category"
        value={selectedCategories.length > 0 ? `${selectedCategories.length} selected` : undefined}
        onClear={selectedCategories.length > 0 ? () => selectedCategories.forEach(c => onCategoryToggle(c)) : undefined}
        keepOpen
      >
        {CATEGORIES.map((cat) => (
          <label key={cat} className="flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => onCategoryToggle(cat)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[var(--primary)]"
            />
            {CATEGORY_LABELS[cat] || cat}
          </label>
        ))}
      </Dropdown>

      <Dropdown
        label="Age"
        value={ageFilter !== "all" ? ageLabel(ageFilter) : undefined}
        onClear={ageFilter !== "all" ? () => onAgeFilterChange("all") : undefined}
      >
        {AGE_OPTIONS.map(([val, label]) => (
          <button key={val} onClick={() => onAgeFilterChange(val)}
            className={`block w-full px-4 py-2 text-left text-sm ${ageFilter === val ? "bg-blue-50 font-medium text-[var(--primary)]" : "text-gray-700 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </Dropdown>


      {hasFilters && (
        <button onClick={onClearFilters} className="text-xs text-[var(--primary)] hover:underline">
          Clear all
        </button>
      )}
    </>
  );

  return (
    <div className="mt-6">
      {/* Mobile: single "Filters" button */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Results count + view toggle always visible on mobile */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {resultCount} of {totalCount}
          </span>
          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={() => onViewModeChange("list")}
              className={`rounded-l-lg p-1.5 ${viewMode === "list" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              className={`rounded-r-lg p-1.5 ${viewMode === "grid" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile expanded filters */}
      {mobileFiltersOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          {filterDropdowns}
        </div>
      )}

      {/* Desktop: show filters inline (unchanged) */}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        {filterDropdowns}

        {/* Spacer + results count + view toggle */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {resultCount} of {totalCount}
          </span>
          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={() => onViewModeChange("list")}
              className={`rounded-l-lg p-1.5 ${viewMode === "list" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              className={`rounded-r-lg p-1.5 ${viewMode === "grid" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable dropdown component */
function Dropdown({ label, value, onClear, keepOpen, children }: {
  label: string;
  value?: string;
  onClear?: () => void;
  keepOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          value ? "border-[var(--primary)] bg-blue-50 text-[var(--primary)]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {value ? `${label}: ${value}` : label}
        {value && onClear ? (
          <X className="ml-1 h-3 w-3" onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }} />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 top-10 z-20 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onClick={() => { if (!keepOpen) setOpen(false); }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
