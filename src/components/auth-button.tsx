"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  if (loading) {
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
      <a
        href="/my-events"
        className="text-sm text-gray-600 hover:text-[var(--primary)]"
      >
        My Events
      </a>
      <a
        href="/profile"
        className="text-sm text-gray-600 hover:text-[var(--primary)]"
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
