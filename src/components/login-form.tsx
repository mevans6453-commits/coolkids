"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Check your email!</h2>
        <p className="mt-3 text-gray-600">
          We sent a magic link to <strong>{email}</strong>.
          <br />
          Click the link in your inbox to sign in.
        </p>
        <button
          onClick={() => { setStatus("idle"); setEmail(""); }}
          className="mt-6 text-sm text-[var(--primary)] hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 font-medium text-white hover:bg-[var(--primary-light)] disabled:opacity-50"
      >
        <Mail className="h-4 w-4" />
        {status === "loading" ? "Sending..." : "Send Magic Link"}
      </button>

      <p className="text-center text-xs text-gray-500">
        No password needed. We&apos;ll email you a link to sign in.
      </p>
    </form>
  );
}
