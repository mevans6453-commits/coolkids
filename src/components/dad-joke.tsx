"use client";

import { useState } from "react";

type Props = {
  setup: string;
  punchline: string;
};

export default function DadJoke({ setup, punchline }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="bg-amber-50 px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
          Dad Joke of the Day
        </p>
        <div
          onClick={() => setRevealed(true)}
          className={`mt-4 rounded-xl border border-amber-200 bg-white p-6 shadow-sm ${
            !revealed ? "cursor-pointer hover:shadow-md" : ""
          } transition-shadow`}
        >
          <p className="text-lg font-medium text-gray-900">{setup}</p>

          {revealed ? (
            <p className="mt-4 text-lg font-semibold text-amber-700 animate-in">
              {punchline}
            </p>
          ) : (
            <button className="mt-4 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 transition-colors">
              Tap to reveal punchline
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
