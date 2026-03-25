import { CalendarPlus } from "lucide-react";
import SuggestEventForm from "@/components/suggest-event-form";

export const metadata = {
  title: "Suggest an Event - CoolKids",
  description: "Know about a family-friendly event happening soon? Share it with local families!",
};

export default function SuggestEventPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
          <CalendarPlus className="h-7 w-7 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Suggest an Event</h1>
        <p className="mt-3 text-gray-600">
          Know about an upcoming event for families? A festival, storytime, class,
          or fun outing — help other parents discover it!
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <SuggestEventForm />
      </div>
    </div>
  );
}
