"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { INTEREST_CATEGORIES, type Profile } from "@/lib/types";

const AGE_OPTIONS = Array.from({ length: 18 }, (_, i) => i);

export default function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(profile.name ?? "");
  const [zip, setZip] = useState(profile.zip ?? "");
  const [kidsAges, setKidsAges] = useState<number[]>(profile.kids_ages ?? []);
  const [interests, setInterests] = useState<string[]>(profile.interest_categories ?? []);
  const [distance, setDistance] = useState(profile.max_distance_miles ?? 25);
  const [newsletter, setNewsletter] = useState(profile.newsletter_preference ?? "none");

  function toggleAge(age: number) {
    setKidsAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age].sort((a, b) => a - b)
    );
  }

  function toggleInterest(cat: string) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await supabase.from("profiles").update({
      name: name || null,
      zip: zip || null,
      kids_ages: kidsAges,
      interest_categories: interests,
      max_distance_miles: distance,
      newsletter_preference: newsletter,
    }).eq("id", profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>

      {/* ZIP Code */}
      <div>
        <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
          ZIP Code
        </label>
        <input
          id="zip"
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="30114"
          maxLength={5}
          className="mt-1 block w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        />
        <p className="mt-1 text-xs text-gray-500">For calculating distances to events</p>
      </div>

      {/* Kids Ages */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Kids&apos; Ages
        </label>
        <p className="mt-1 text-xs text-gray-500">Select all that apply</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AGE_OPTIONS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => toggleAge(age)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                kidsAges.includes(age)
                  ? "bg-[var(--primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {age === 0 ? "<1" : age}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Interests
        </label>
        <p className="mt-1 text-xs text-gray-500">What kinds of events do you like?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTEREST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleInterest(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                interests.includes(cat)
                  ? "bg-[var(--primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
          How far are you willing to drive?
        </label>
        <div className="mt-2 flex items-center gap-4">
          <input
            id="distance"
            type="range"
            min={10}
            max={50}
            step={5}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-20 text-sm font-medium text-gray-700">
            {distance} miles
          </span>
        </div>
      </div>

      {/* Newsletter */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Newsletter
        </label>
        <div className="mt-2 space-y-2">
          {(["weekly", "monthly", "none"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-3">
              <input
                type="radio"
                name="newsletter"
                value={opt}
                checked={newsletter === opt}
                onChange={() => setNewsletter(opt)}
                className="h-4 w-4 text-[var(--primary)]"
              />
              <span className="text-sm capitalize text-gray-700">
                {opt === "none" ? "No newsletter" : `${opt} digest`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 font-medium text-white hover:bg-[var(--primary-light)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </form>
  );
}
