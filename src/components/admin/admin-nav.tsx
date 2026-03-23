"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  MapPin,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/scraping", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/add-event", label: "Add Event", icon: CalendarPlus },
  { href: "/admin/add-venue", label: "Add Venue", icon: MapPin },
  { href: "/admin/review", label: "Review Queue", icon: ClipboardList },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleRefreshCache() {
    setRefreshing(true);
    setToast(null);
    try {
      const res = await fetch("/api/revalidate", { method: "POST" });
      const data = await res.json();
      if (data.revalidated) {
        setToast("Cache cleared! Public pages will show fresh data.");
      } else {
        setToast("Failed to clear cache.");
      }
    } catch {
      setToast("Error clearing cache.");
    }
    setRefreshing(false);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="mb-6">
      <nav className="rounded-lg bg-slate-800 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto">
          <span className="mr-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Admin
          </span>

          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}

          <div className="ml-auto flex items-center gap-3">
            {toast && (
              <span className="text-xs font-medium text-green-400">{toast}</span>
            )}
            <button
              onClick={handleRefreshCache}
              disabled={refreshing}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Clearing..." : "Refresh Cache"}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
