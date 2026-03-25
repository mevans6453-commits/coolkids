"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function AuthButton() {
  const { user, authLoaded, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email === ADMIN_EMAIL;

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  if (!authLoaded) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
    );
  }

  if (!user) {
    return (
      <a
        href="/subscribe"
        className="rounded-full bg-[var(--primary)] px-4 py-2 text-white hover:bg-[var(--primary-light)]"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Desktop only: My Events + Admin + username */}
      <a
        href="/my-events"
        className="hidden sm:inline text-sm text-gray-600 hover:text-[var(--primary)]"
      >
        My Events
      </a>
      {isAdmin && (
        <a
          href="/admin/scraping"
          className="hidden sm:inline text-sm font-medium text-orange-500 hover:text-orange-600"
        >
          Admin
        </a>
      )}
      <a
        href="/profile"
        className="hidden sm:inline text-sm text-gray-600 hover:text-[var(--primary)]"
      >
        {user.email?.split("@")[0]}
      </a>
      <button
        onClick={handleSignOut}
        className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Sign Out
      </button>
    </div>
  );
}
