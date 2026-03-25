import type { Event } from "./types";

/**
 * Share an event using the native share sheet (mobile) or clipboard (desktop).
 * Returns true if shared successfully.
 */
export async function shareEvent(
  event: Event,
  origin?: string
): Promise<"shared" | "copied" | "failed"> {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${base}/events?event=${event.id}`;
  const text = `Check out ${event.name}${event.venue ? ` at ${event.venue.name}` : ""} on CoolKids!`;

  // Try native share (mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: event.name, text, url });
      return "shared";
    } catch {
      // User cancelled — fall through to clipboard
    }
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
