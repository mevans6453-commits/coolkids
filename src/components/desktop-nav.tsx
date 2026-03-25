"use client";

import { useAuth } from "./auth-provider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function DesktopNav() {
  return (
    <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
      <a href="/events" className="text-gray-600 hover:text-[var(--primary)]">
        Events
      </a>
      <a href="/venues" className="text-gray-600 hover:text-[var(--primary)]">
        Venues
      </a>
      <a href="/suggest" className="text-gray-600 hover:text-[var(--primary)]">
        Suggest
      </a>
    </nav>
  );
}
