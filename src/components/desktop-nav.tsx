"use client";

import { useAuth } from "./auth-provider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function DesktopNav() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
      {isAdmin && (
        <a href="/this-weekend" className="text-gray-600 hover:text-[var(--primary)]">
          This Weekend
        </a>
      )}
      <a href="/events" className="text-gray-600 hover:text-[var(--primary)]">
        Events
      </a>
      <a href="/venues" className="text-gray-600 hover:text-[var(--primary)]">
        Venues
      </a>
      <a href="/suggest" className="text-gray-600 hover:text-[var(--primary)]">
        Suggest
      </a>
      <a href="/my-events" className="text-gray-600 hover:text-[var(--primary)]">
        My Events
      </a>
      {isAdmin && (
        <a href="/admin/scraping" className="text-orange-500 hover:text-orange-600">
          Admin
        </a>
      )}
    </nav>
  );
}
