import { supabase } from "@/lib/supabase";
import ScrapeDashboard from "@/components/admin/scrape-dashboard";

export const revalidate = 0; // Always fresh data for admin

export default async function AdminScrapingPage() {
  // Fetch all venues
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, preferred_strategy, scrape_url, is_active, categories")
    .eq("is_active", true)
    .order("name");

  // Fetch recent scrape runs (latest 500 — enough to get most recent per venue)
  const { data: scrapeRuns } = await supabase
    .from("scrape_runs")
    .select("*")
    .order("run_date", { ascending: false })
    .limit(500);

  // Fetch event summary data for breakdown
  const { data: events } = await supabase
    .from("events")
    .select("id, venue_id, name, event_type, age_range_min, age_range_max")
    .eq("status", "published");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Scrape Monitoring</h1>
      <p className="mt-2 text-gray-600">
        Admin dashboard — venue scraping status, strategy performance, and event management.
      </p>
      <ScrapeDashboard
        venues={venues ?? []}
        scrapeRuns={scrapeRuns ?? []}
        events={events ?? []}
      />
    </div>
  );
}
