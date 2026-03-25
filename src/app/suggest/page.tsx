import { MapPin, CalendarPlus } from "lucide-react";

export const metadata = {
  title: "Suggest - CoolKids",
  description: "Suggest a venue or event for CoolKids! Help local families discover great things to do.",
};

export default function SuggestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Help Us Grow!</h1>
        <p className="mt-3 text-gray-600">
          Know something great for local families? Submit it below and we'll review it within 48 hours.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Suggest a Venue */}
        <a
          href="/suggest/venue"
          className="group rounded-xl border-2 border-gray-200 bg-white p-8 text-center transition-all hover:border-[var(--primary)] hover:shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-blue-100">
            <MapPin className="h-8 w-8 text-[var(--primary)]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Suggest a Venue</h2>
          <p className="mt-2 text-sm text-gray-500">
            A farm, park, museum, play place — anywhere kids love to go.
          </p>
          <span className="mt-4 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
            Add a venue →
          </span>
        </a>

        {/* Suggest an Event */}
        <a
          href="/suggest/event"
          className="group rounded-xl border-2 border-gray-200 bg-white p-8 text-center transition-all hover:border-orange-400 hover:shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 transition-colors group-hover:bg-orange-100">
            <CalendarPlus className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Suggest an Event</h2>
          <p className="mt-2 text-sm text-gray-500">
            A festival, storytime, class, or family outing happening soon.
          </p>
          <span className="mt-4 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            Add an event →
          </span>
        </a>
      </div>
    </div>
  );
}
