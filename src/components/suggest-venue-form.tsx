"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, CheckCircle } from "lucide-react";

export default function SuggestVenueForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueUrl, setVenueUrl] = useState("");
  const [whyGreat, setWhyGreat] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill email if logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!venueName.trim()) {
      setError("Please enter a venue name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email so we can follow up.");
      return;
    }

    setSubmitting(true);

    // Build notes from "why great" + age range
    const noteParts: string[] = [];
    if (whyGreat.trim()) noteParts.push(whyGreat.trim());
    if (ageRange.trim()) noteParts.push(`Best for ages: ${ageRange.trim()}`);
    const notes = noteParts.length > 0 ? noteParts.join(" | ") : null;

    const { error: insertError } = await supabase
      .from("venue_suggestions")
      .insert({
        suggested_by_email: email.trim(),
        venue_name: venueName.trim(),
        venue_url: venueUrl.trim() || null,
        notes,
      });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      console.error("Suggestion insert error:", insertError);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">
          Thanks for the suggestion!
        </h3>
        <p className="mt-2 text-gray-600">
          We'll check it out and add it to CoolKids if it's a good fit for local
          families.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setVenueName("");
            setVenueUrl("");
            setWhyGreat("");
            setAgeRange("");
          }}
          className="mt-6 text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Suggest another venue
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Venue Name */}
      <div>
        <label
          htmlFor="venue-name"
          className="block text-sm font-medium text-gray-700"
        >
          Venue Name <span className="text-red-500">*</span>
        </label>
        <input
          id="venue-name"
          type="text"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="e.g. Mountain Top Petting Zoo"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Website URL */}
      <div>
        <label
          htmlFor="venue-url"
          className="block text-sm font-medium text-gray-700"
        >
          Website URL
        </label>
        <input
          id="venue-url"
          type="url"
          value={venueUrl}
          onChange={(e) => setVenueUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* What makes it great */}
      <div>
        <label
          htmlFor="why-great"
          className="block text-sm font-medium text-gray-700"
        >
          What makes it great for families?
        </label>
        <textarea
          id="why-great"
          value={whyGreat}
          onChange={(e) => setWhyGreat(e.target.value)}
          rows={3}
          placeholder="My kids love the outdoor playground and they do free story time on Saturdays..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Age Range */}
      <div>
        <label
          htmlFor="age-range"
          className="block text-sm font-medium text-gray-700"
        >
          Best for what ages?
        </label>
        <input
          id="age-range"
          type="text"
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          placeholder="e.g. 2-8, all ages, teens"
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
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
          So we can let you know when the venue is added.
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-light)] disabled:opacity-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Sending..." : "Submit Suggestion"}
      </button>
      <p className="text-center text-xs text-gray-400">
        We review suggestions within 48 hours
      </p>
    </form>
  );
}
