"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/types";
import { CheckCircle, Plus } from "lucide-react";

type VenueOption = { id: string; name: string; city: string | null };

type Props = {
  venues: VenueOption[];
};

export default function AddEventForm({ venues }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [venueId, setVenueId] = useState("");
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cost, setCost] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewVenue = venueId === "__new__";

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function resetForm() {
    setVenueId("");
    setNewVenueName("");
    setNewVenueCity("");
    setEventName("");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setCost("");
    setIsFree(false);
    setDescription("");
    setSourceUrl("");
    setSelectedCategories([]);
    setSubmitted(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    if (!venueId) {
      setError("Please select a venue.");
      return;
    }
    if (isNewVenue && !newVenueName.trim()) {
      setError("Please enter the new venue name.");
      return;
    }

    setSubmitting(true);

    let targetVenueId = venueId;

    // Create new venue if needed
    if (isNewVenue) {
      const { data: newVenue, error: venueErr } = await supabase
        .from("venues")
        .insert({
          name: newVenueName.trim(),
          city: newVenueCity.trim() || "Canton",
          county: "Cherokee",
          state: "GA",
          categories: selectedCategories,
          is_active: true,
        })
        .select("id")
        .single();

      if (venueErr || !newVenue) {
        setError("Failed to create venue: " + (venueErr?.message || "Unknown error"));
        setSubmitting(false);
        return;
      }
      targetVenueId = newVenue.id;
    }

    // Build pricing
    const pricingNotes =
      !cost.trim() && !isFree ? "Check venue website for pricing" : null;

    const { error: insertErr } = await supabase.from("events").insert({
      venue_id: targetVenueId,
      name: eventName.trim(),
      start_date: startDate,
      end_date: endDate || null,
      start_time: startTime.trim() || null,
      end_time: endTime.trim() || null,
      cost: isFree ? "Free" : cost.trim() || null,
      cost_min: null,
      cost_max: null,
      is_free: isFree,
      pricing_notes: pricingNotes,
      description: description.trim() || null,
      source_url: sourceUrl.trim() || null,
      categories: selectedCategories,
      event_type: "event",
      status: "published",
    });

    setSubmitting(false);

    if (insertErr) {
      setError("Failed to save event: " + insertErr.message);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  // Success screen
  if (submitted) {
    return (
      <div className="mt-8 rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Event Added!</h2>
        <p className="mt-2 text-gray-600">
          &ldquo;{eventName}&rdquo; has been saved and will appear on the events page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={resetForm}
            className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-light)]"
          >
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add Another
          </button>
          <a
            href="/events"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Events
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Venue */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Venue <span className="text-red-500">*</span>
        </label>
        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">Select a venue...</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}{v.city ? ` (${v.city})` : ""}
            </option>
          ))}
          <option value="__new__">+ Add new venue</option>
        </select>
      </div>

      {/* New venue fields */}
      {isNewVenue && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <p className="text-xs font-medium text-blue-700">New Venue Details</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Venue Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              placeholder="e.g. Robins Air Force Base"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={newVenueCity}
              onChange={(e) => setNewVenueCity(e.target.value)}
              placeholder="e.g. Warner Robins"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
      )}

      {/* Event name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="e.g. Wings Over Georgia Air Show"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-gray-400">Leave blank for single-day events</p>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="e.g. 10 AM"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="e.g. 5 PM"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Cost */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost</label>
          <input
            type="text"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={isFree}
            placeholder="e.g. $10, $5-$15"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
        <div className="pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => {
                setIsFree(e.target.checked);
                if (e.target.checked) setCost("");
              }}
              className="h-4 w-4 rounded border-gray-300 text-[var(--primary)]"
            />
            <span className="text-sm font-medium text-gray-700">Free event</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the event..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Event URL</label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
        />
        <p className="mt-1 text-xs text-gray-400">Link to the event page on the venue website</p>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategories.includes(cat)
                  ? "bg-[var(--primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--primary-light)] disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Add Event"}
      </button>
    </form>
  );
}
