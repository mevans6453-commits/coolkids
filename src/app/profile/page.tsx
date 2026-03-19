import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile-form";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/subscribe");
  }

  // Fetch the user's profile (auto-created by trigger on signup)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fallback if trigger hasn't fired yet
  const userProfile: Profile = profile ?? {
    id: user.id,
    email: user.email!,
    name: null,
    zip: null,
    kids_ages: [],
    interest_categories: [],
    max_distance_miles: 25,
    newsletter_preference: "none" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
      <p className="mt-2 text-gray-600">
        Set your preferences to get personalized event recommendations.
      </p>

      <div className="mt-8">
        <ProfileForm profile={userProfile} />
      </div>
    </div>
  );
}
