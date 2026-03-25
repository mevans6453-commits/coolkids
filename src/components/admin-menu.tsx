"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function AdminMenu() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isAdmin) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-orange-500 hover:bg-orange-50"
        aria-label="Admin menu"
        title="Admin menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
          <a
            href="/this-weekend"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-orange-500 hover:bg-orange-50"
          >
            🗓 This Weekend
          </a>
          <a
            href="/admin/scraping"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-orange-500 hover:bg-orange-50"
          >
            ⚙️ Admin Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
