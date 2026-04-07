import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";
import MyEventsClient from "@/components/my-events-client";

export default async function MyEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/subscribe");
  }

  // Fetch user's interactions with event + venue data. Wrapped in try/catch
  // so a database outage shows an empty state instead of crashing the page.
  type InteractionRow = {
    interaction_type: string;
    attended_date: string | null;
    event: unknown;
  };
  let interactions: InteractionRow[] | null = null;
  let loadError: string | null = null;
  try {
    const { data, error } = await supabase
      .from("user_event_interactions")
      .select(
        "interaction_type, attended_date, event:events(*, venue:venues(*))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      loadError = error.message;
    } else {
      interactions = (data ?? []) as unknown as InteractionRow[];
    }
  } catch (err) {
    console.error("[MyEvents] Failed to fetch interactions:", err);
    loadError = "Could not connect to the database. Please try again.";
  }

  const starred: Event[] = [];
  const attending: Event[] = [];
  const attendedDates: Record<string, string> = {}; // eventId → YYYY-MM-DD

  for (const i of interactions ?? []) {
    const event = i.event as unknown as Event;
    if (!event) continue;
    if (i.interaction_type === "star") starred.push(event);
    if (i.interaction_type === "attending") {
      attending.push(event);
      if (i.attended_date) {
        attendedDates[event.id] = i.attended_date;
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
      <p className="mt-2 text-gray-600">Events you&apos;ve starred or are attending.</p>

      {loadError && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Could not load your events</p>
          <p className="mt-1 text-sm">{loadError}</p>
        </div>
      )}

      <MyEventsClient attending={attending} starred={starred} attendedDates={attendedDates} />
    </div>
  );
}
