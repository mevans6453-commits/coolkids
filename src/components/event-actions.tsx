"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildGoogleCalendarUrl } from "@/lib/google-calendar";
import { MoreHorizontal, CalendarPlus, Share2, EyeOff, Flag, Check } from "lucide-react";
import type { Event } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

type Props = {
  event: Event;
  onHide?: (eventId: string) => void;
};

export default function EventActions({ event, onHide }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [shared, setShared] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleCalendar() {
    window.open(buildGoogleCalendarUrl(event), "_blank");
    setMenuOpen(false);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/events` : "";
    const text = `Check out ${event.name}${event.venue ? ` at ${event.venue.name}` : ""} on CoolKids!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: event.name, text, url });
        setMenuOpen(false);
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard not available
    }
    setMenuOpen(false);
  }

  async function handleHide() {
    if (!user) { router.push("/subscribe"); return; }
    setMenuOpen(false);
    await supabase.from("user_event_interactions").insert({
      user_id: user.id,
      event_id: event.id,
      interaction_type: "hidden",
    });
    onHide?.(event.id);
  }

  async function handleReport() {
    if (!user) { router.push("/subscribe"); return; }
    setMenuOpen(false);
    await supabase.from("user_event_interactions").insert({
      user_id: user.id,
      event_id: event.id,
      interaction_type: "reported",
      report_reason: "User reported",
    });
    setReported(true);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        title="More options"
        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center sm:p-1.5 sm:min-h-0 sm:min-w-0 transition-colors"
      >
        <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={handleShare}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {shared ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4 text-gray-400" />}
            {shared ? "Link copied!" : "Share event"}
          </button>
          <button
            onClick={handleCalendar}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CalendarPlus className="h-4 w-4 text-gray-400" />
            Add to calendar
          </button>
          <div className="mx-3 my-1 border-t border-gray-100" />
          <button
            onClick={handleHide}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <EyeOff className="h-4 w-4 text-gray-400" />
            Not interested
          </button>
          <button
            onClick={handleReport}
            disabled={reported}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
          >
            <Flag className={`h-4 w-4 ${reported ? "text-red-300" : "text-gray-400"}`} />
            {reported ? "Reported" : "Report this event"}
          </button>
        </div>
      )}
    </div>
  );
}
