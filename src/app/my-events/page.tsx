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

  // Fetch user's interactions with event + venue data
  const { data: interactions } = await supabase
    .from("user_event_interactions")
    .select("interaction_type, attended_date, event:events(*, venue:venues(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

      <MyEventsClient attending={attending} starred={starred} attendedDates={attendedDates} />
    </div>
  );
}
