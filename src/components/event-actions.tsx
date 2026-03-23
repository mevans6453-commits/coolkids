"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { buildGoogleCalendarUrl } from "@/lib/google-calendar";
import { MoreHorizontal, CalendarPlus, Share2, EyeOff, Flag, Check, ShieldAlert, X } from "lucide-react";
import type { Event } from "@/lib/types";

type Props = {
  event: Event;
  onHide?: (eventId: string) => void;
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

const NOT_FOR_KIDS_REASONS = [
  "Adult content",
  "Too mature for kids",
  "Alcohol/bar event",
  "Not family-friendly",
  "Wrong audience",
  "Holiday/closure (not an event)",
];

export default function EventActions({ event, onHide }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [shared, setShared] = useState(false);
  const [flaggedNotForKids, setFlaggedNotForKids] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen && !showReasonPicker) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowReasonPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, showReasonPicker]);

  function handleCalendar() {
    window.open(buildGoogleCalendarUrl(event), "_blank");
    setMenuOpen(false);
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/events?event=${event.id}` : "";
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

  function handleNotForKidsClick() {
    if (!user) { router.push("/subscribe"); return; }
    setMenuOpen(false);
    setShowReasonPicker(true);
  }

  async function submitNotForKids(reason: string) {
    if (!user || !reason.trim()) return;
    setShowReasonPicker(false);

    if (isAdmin) {
      // Admin: immediately flag the event with reason
      await supabase
        .from("events")
        .update({ event_type: "not_for_kids", not_for_kids_reason: reason.trim() })
        .eq("id", event.id);
      setFlaggedNotForKids(true);
      onHide?.(event.id);
    } else {
      // Regular user: record a report with the reason
      await supabase.from("user_event_interactions").insert({
        user_id: user.id,
        event_id: event.id,
        interaction_type: "not_for_kids_report",
        report_reason: reason.trim(),
      });

      // Check if 3+ users have now reported this event
      const { count } = await supabase
        .from("user_event_interactions")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("interaction_type", "not_for_kids_report");

      if (count && count >= 3) {
        await supabase
          .from("events")
          .update({ event_type: "not_for_kids", not_for_kids_reason: reason.trim() })
          .eq("id", event.id);
        onHide?.(event.id);
      }

      setFlaggedNotForKids(true);
    }
    setCustomReason("");
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
            onClick={handleNotForKidsClick}
            disabled={flaggedNotForKids}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
          >
            <ShieldAlert className={`h-4 w-4 ${flaggedNotForKids ? "text-orange-300" : "text-orange-400"}`} />
            {flaggedNotForKids ? (isAdmin ? "Flagged!" : "Reported") : "Not for kids"}
          </button>
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

      {/* Not-for-kids reason picker */}
      {showReasonPicker && (
        <div className="absolute right-0 top-10 z-30 w-64 rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Why isn&apos;t this for kids?</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowReasonPicker(false); }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="py-1">
            {NOT_FOR_KIDS_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={(e) => { e.stopPropagation(); submitNotForKids(reason); }}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && customReason.trim()) submitNotForKids(customReason); }}
                placeholder="Other reason..."
                className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); if (customReason.trim()) submitNotForKids(customReason); }}
                disabled={!customReason.trim()}
                className="rounded bg-orange-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

