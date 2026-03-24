import { supabase } from "@/lib/supabase";
import type { Event, DadJoke as DadJokeType } from "@/lib/types";
import ThisWeekendClient from "@/components/this-weekend-client";

export const revalidate = 300;

export default async function ThisWeekendPage() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate this Saturday + Sunday
  // On Saturday: we're on Saturday, Sunday is tomorrow
  // On Sunday: Saturday was yesterday, we're on Sunday — weekend isn't over until Monday
  // Mon–Fri: look ahead to the coming Saturday
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  const saturday = new Date(today);
  const sunday = new Date(today);

  if (dayOfWeek === 6) {
    // It's Saturday — today + tomorrow
    sunday.setDate(today.getDate() + 1);
  } else if (dayOfWeek === 0) {
    // It's Sunday — yesterday + today (the weekend isn't over!)
    saturday.setDate(today.getDate() - 1);
  } else {
    // Mon–Fri — look ahead to coming Saturday
    const daysUntilSaturday = 6 - dayOfWeek;
    saturday.setDate(today.getDate() + daysUntilSaturday);
    sunday.setDate(saturday.getDate() + 1);
  }

  // Format dates for Supabase queries (YYYY-MM-DD)
  const satStr = saturday.toISOString().split("T")[0];
  const sunStr = sunday.toISOString().split("T")[0];

  // End of month for "Coming Up" section
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonthStr = endOfMonth.toISOString().split("T")[0];

  // Fetch events that overlap this weekend (start_date <= sunday AND (end_date >= saturday OR (end_date is null AND start_date >= saturday)))
  const { data: allEvents } = await supabase
    .from("events")
    .select("*, venue:venues!inner(*)")
    .eq("status", "published")
    .eq("venue.is_active", true)
    .neq("event_type", "hours")
    .not("event_type", "eq", "not_for_kids")
    .lte("start_date", endOfMonthStr)
    .order("start_date", { ascending: true });

  // Dad joke
  const { data: jokes } = await supabase.from("dad_jokes").select("*");
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todaysJoke =
    jokes && jokes.length > 0
      ? (jokes[dayOfYear % jokes.length] as DadJokeType)
      : null;

  // Split events: weekend vs coming-up (rest of month after this weekend)
  const weekendEvents: Event[] = [];
  const comingUpEvents: Event[] = [];

  const satDate = saturday.getTime();
  const sunDate = sunday.getTime();
  const mondayAfterWeekend = new Date(sunday);
  mondayAfterWeekend.setDate(sunday.getDate() + 1);

  (allEvents as Event[] || []).forEach((e) => {
    const start = new Date(e.start_date + "T00:00:00").getTime();
    const end = e.end_date ? new Date(e.end_date + "T00:00:00").getTime() : start;

    // Event overlaps this weekend if it starts before/on Sunday AND ends on/after Saturday
    if (start <= sunDate && end >= satDate) {
      weekendEvents.push(e);
    } else if (start > sunDate && start <= endOfMonth.getTime()) {
      comingUpEvents.push(e);
    }
  });

  // Interaction counts for events
  const allEventIds = [...weekendEvents, ...comingUpEvents].map((e) => e.id);
  const { data: interactions } = allEventIds.length > 0
    ? await supabase
        .from("user_event_interactions")
        .select("event_id, interaction_type")
        .in("event_id", allEventIds)
        .in("interaction_type", ["star", "attending"])
    : { data: [] };

  const interactionCounts: Record<string, { stars: number; attending: number }> = {};
  (interactions || []).forEach((i) => {
    if (!interactionCounts[i.event_id]) {
      interactionCounts[i.event_id] = { stars: 0, attending: 0 };
    }
    if (i.interaction_type === "star") interactionCounts[i.event_id].stars++;
    else if (i.interaction_type === "attending") interactionCounts[i.event_id].attending++;
  });

  const todayStr = today.toISOString().split("T")[0];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <ThisWeekendClient
      weekendEvents={weekendEvents}
      comingUpEvents={comingUpEvents}
      interactionCounts={interactionCounts}
      saturdayStr={satStr}
      sundayStr={sunStr}
      todayStr={todayStr}
      isWeekend={isWeekend}
      todaysJoke={todaysJoke}
    />
  );
}
