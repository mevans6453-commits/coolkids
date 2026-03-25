"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

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
            {user && (
              <a
                href="/my-events"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                My Events
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
