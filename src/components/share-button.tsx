"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { Event } from "@/lib/types";

type Props = {
  event: Event;
};

export default function ShareButton({ event }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/events` : "";
    const text = `Check out ${event.name}${event.venue ? ` at ${event.venue.name}` : ""} on CoolKids!`;

    // Try native share (mobile) first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: event.name, text, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Clipboard fallback (desktop)
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? "Link copied!" : "Share event"}
      className={`flex items-center justify-center rounded-full p-2 text-xs transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5 ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {copied ? (
        <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      ) : (
        <Share2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      )}
    </button>
  );
}
