"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/types";
import { CheckCircle, MapPin, Plus } from "lucide-react";

export default function AdminAddVenuePage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function resetForm() {
    setName("");
    setCity("");
    setWebsite("");
    setScrapeUrl("");
    setSelectedCategories([]);
    setSubmitted(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Venue name is required.");
      return;
    }

    setSubmitting(true);

    const { error: insertErr } = await supabase.from("venues").insert({
      name: name.trim(),
      city: city.trim() || "Canton",
      county: "Cherokee",
      state: "GA",
      website: website.trim() || null,
      scrape_url: scrapeUrl.trim() || website.trim() || null,
      categories: selectedCategories,
      is_active: true,
    });

    setSubmitting(false);

    if (insertErr) {
      setError("Failed to save venue: " + insertErr.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Add Venue</h1>
        <div className="mt-8 rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Venue Added!
          </h2>
          <p className="mt-2 text-gray-600">
            &ldquo;{name}&rdquo; has been added. You can now create events for
            this venue.
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
              href="/admin/add-event"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add Event
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Add Venue</h1>
      <p className="mt-2 text-gray-600">
        Add a new venue to the database. Events can be added separately or
        picked up by the scraper.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Venue name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Venue Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cherokee County Fairgrounds"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Canton"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-gray-400">
            Defaults to Canton if left blank
          </p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Scrape URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Scrape URL
          </label>
          <input
            type="url"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://venue.com/events"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-gray-400">
            Events page URL for the scraper. Falls back to website URL if blank.
          </p>
        </div>

        {/* Categories */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Categories
          </label>
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
          <MapPin className="mr-1.5 inline h-4 w-4" />
          {submitting ? "Saving..." : "Add Venue"}
        </button>
      </form>
    </div>
  );
}
