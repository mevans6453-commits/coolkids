"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildGoogleCalendarUrl } from "@/lib/google-calendar";
import { CalendarPlus, Flag } from "lucide-react";
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
    <div className="flex items-center gap-1">
      <button
        onClick={handleCalendar}
        title="Add to Google Calendar"
        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center sm:p-1 sm:min-h-0 sm:min-w-0"
      >
        <CalendarPlus className="h-5 w-5 sm:h-4 sm:w-4" />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          title="More options"
          className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center sm:p-1 sm:min-h-0 sm:min-w-0"
        >
          <Flag className={`h-5 w-5 sm:h-4 sm:w-4 ${reported ? "text-red-400" : ""}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={handleHide}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Not interested
            </button>
            <button
              onClick={handleReport}
              disabled={reported}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
            >
              {reported ? "Reported" : "Report this event"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
