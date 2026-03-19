import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calendar, MapPin, Star, Hand } from "lucide-react";
import type { Event } from "@/lib/types";

export default async function MyEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/subscribe");
  }

  // Fetch user's interactions with event + venue data
  const { data: interactions } = await supabase
    .from("user_event_interactions")
    .select("interaction_type, event:events(*, venue:venues(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const starred: Event[] = [];
  const attending: Event[] = [];

  for (const i of interactions ?? []) {
    const event = i.event as unknown as Event;
    if (!event) continue;
    if (i.interaction_type === "star") starred.push(event);
    if (i.interaction_type === "attending") attending.push(event);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
      <p className="mt-2 text-gray-600">Events you&apos;ve starred or are attending.</p>

      {/* Attending section */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Hand className="h-5 w-5 text-blue-600" />
          I&apos;m Attending ({attending.length})
        </h2>
        {attending.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No events yet. Browse <a href="/events" className="text-blue-600 hover:underline">upcoming events</a> and click &quot;I&apos;m Going&quot;.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attending.map((event) => (
              <MiniEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Starred section */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
          Starred ({starred.length})
        </h2>
        {starred.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No starred events yet. Browse <a href="/events" className="text-blue-600 hover:underline">upcoming events</a> and click the star button.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {starred.map((event) => (
              <MiniEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniEventCard({ event }: { event: Event }) {
  const dateStr = new Date(event.start_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md">
      <div className="flex flex-wrap gap-1">
        {event.categories?.slice(0, 2).map((cat) => (
          <span
            key={cat}
            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {cat}
          </span>
        ))}
      </div>
      <h3 className="mt-2 font-semibold text-gray-900">{event.name}</h3>
      <div className="mt-2 space-y-1 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{dateStr}{event.start_time && ` \u2022 ${event.start_time}`}</span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{event.venue.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
