"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star, Hand } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Props = {
  eventId: string;
  initialStarCount: number;
  initialAttendingCount: number;
};

export default function InteractionButtons({
  eventId,
  initialStarCount,
  initialAttendingCount,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [starred, setStarred] = useState(false);
  const [attending, setAttending] = useState(false);
  const [starCount, setStarCount] = useState(initialStarCount);
  const [attendingCount, setAttendingCount] = useState(initialAttendingCount);

  const loadUserInteractions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_event_interactions")
      .select("interaction_type")
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (data) {
      setStarred(data.some((d) => d.interaction_type === "star"));
      setAttending(data.some((d) => d.interaction_type === "attending"));
    }
  }, [supabase, eventId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadUserInteractions(user.id);
    });
  }, [supabase, loadUserInteractions]);

  async function toggle(type: "star" | "attending") {
    if (!user) {
      router.push("/subscribe");
      return;
    }

    const isActive = type === "star" ? starred : attending;
    const setActive = type === "star" ? setStarred : setAttending;
    const setCount = type === "star" ? setStarCount : setAttendingCount;

    // Optimistic update
    setActive(!isActive);
    setCount((c) => (isActive ? c - 1 : c + 1));

    if (isActive) {
      const { error } = await supabase
        .from("user_event_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .eq("interaction_type", type);

      if (error) {
        // Revert on failure
        setActive(isActive);
        setCount((c) => (isActive ? c + 1 : c - 1));
      }
    } else {
      const { error } = await supabase
        .from("user_event_interactions")
        .insert({ user_id: user.id, event_id: eventId, interaction_type: type });

      if (error) {
        setActive(isActive);
        setCount((c) => (isActive ? c + 1 : c - 1));
      }
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggle("star")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5 ${
          starred
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Star className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${starred ? "fill-amber-500" : ""}`} />
        {starCount > 0 ? starCount : "Star"}
      </button>
      <button
        onClick={() => toggle("attending")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5 ${
          attending
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Hand className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${attending ? "fill-blue-500" : ""}`} />
        {attending ? (attendingCount > 0 ? `${attendingCount} Going` : "Going") : (attendingCount > 0 ? `${attendingCount} Going` : "I'm Going")}
      </button>
    </div>
  );
}
