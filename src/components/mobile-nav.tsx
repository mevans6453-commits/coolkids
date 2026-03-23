"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-[var(--border)] bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-3">
            <a
              href="/this-weekend"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              This Weekend
            </a>
            <a
              href="/events"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Events
            </a>
            <a
              href="/venues"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Venues
            </a>
            <a
              href="/suggest"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Suggest a Venue
            </a>
            <a
              href="/my-events"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              My Events
            </a>
            {isAdmin && (
              <a
                href="/admin/scraping"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-orange-500 hover:bg-orange-50"
              >
                Admin
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
