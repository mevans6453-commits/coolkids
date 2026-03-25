import { MapPin } from "lucide-react";
import SuggestVenueForm from "@/components/suggest-venue-form";

export const metadata = {
  title: "Suggest a Venue - CoolKids",
  description: "Know a great family-friendly spot? Tell us about it!",
};

export default function SuggestVenuePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <MapPin className="h-7 w-7 text-[var(--primary)]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Suggest a Venue</h1>
        <p className="mt-3 text-gray-600">
          Know a family-friendly spot we should add? A farm, park, museum,
          play place — anything kids love. Tell us about it!
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SuggestVenueForm />
      </div>
    </div>
  );
}
