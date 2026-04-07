import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mevans6453@gmail.com";

export async function POST() {
  try {
    // Admin-only: must be logged in AND email must match ADMIN_EMAIL
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { revalidated: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Revalidate all pages that use ISR caching
    revalidatePath("/", "layout");
    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { revalidated: false, error: String(err) },
      { status: 500 }
    );
  }
}
