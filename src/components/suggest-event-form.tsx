"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { Send, CheckCircle } from "lucide-react";

export default function SuggestEventForm() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [eventName, setEventName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill email if logged in
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!eventName.trim()) {
      setError("Please enter an event name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email so we can follow up.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase
      .from("event_suggestions")
      .insert({
        event_name: eventName.trim(),
        venue_name: venueName.trim() || null,
        event_date: eventDate || null,
        event_time: eventTime.trim() || null,
        cost: cost.trim() || null,
        description: description.trim() || null,
        event_url: eventUrl.trim() || null,
        suggested_by_email: email.trim(),
        suggested_by_user_id: user?.id || null,
      });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      console.error("Event suggestion insert error:", insertError);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Thanks for sharing!
        </h3>
        <p className="mt-2 text-gray-600">
          We'll review your event and make it available to local families once approved.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setEventName("");
            setVenueName("");
            setEventDate("");
            setEventTime("");
            setCost("");
            setDescription("");
            setEventUrl("");
          }}
          className="mt-6 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Suggest another event
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event Name */}
      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          id="event-name"
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="e.g. Kids Craft Saturday at the Library"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue-name" className="block text-sm font-medium text-gray-700">
          Where is it?
        </label>
        <input
          id="venue-name"
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="e.g. Sequoyah Regional Library, Canton Park"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Date + Time row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label htmlFor="event-time" className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            id="event-time"
            type="text"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            placeholder="e.g. 2pm - 4pm"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
          Cost
        </label>
        <input
          id="cost"
          type="text"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="e.g. Free, $5/kid, $10/family"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Tell us about it
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What makes this event great for families? Any details about activities, age ranges, what to bring..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Event URL */}
      <div>
        <label htmlFor="event-url" className="block text-sm font-medium text-gray-700">
          Link for more info
        </label>
        <input
          id="event-url"
          type="url"
          value={eventUrl}
          onChange={(e) => setEventUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Your Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
        <p className="mt-1 text-xs text-gray-500">
          So we can let you know when the event is approved.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Sending..." : "Submit Event"}
      </button>
      <p className="text-center text-xs text-gray-400">
        We review suggestions within 48 hours
      </p>
    </form>
  );
}
