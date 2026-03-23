import { supabase } from "@/lib/supabase";
import AddEventForm from "@/components/admin/add-event-form";

export const revalidate = 0;

export default async function AdminAddEventPage() {
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center gap-3">
        <a href="/admin/scraping" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Scrape Dashboard
        </a>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Quick Add Event</h1>
      <p className="mt-2 text-gray-600">
        Manually add an event that the scraper can&apos;t pick up automatically.
      </p>

      <AddEventForm venues={venues ?? []} />
    </div>
  );
}
