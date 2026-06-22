/**
 * API Route: /api/cron/cleanup
 *
 * Removes past events older than 60 days.
 * Triggered by Vercel Cron weekly.
 *
 * Usage:
 *   GET /api/cron/cleanup (triggered by Vercel Cron with Authorization header)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET;
const DAYS_TO_KEEP = 60; // Keep past events for 60 days for potential reviews

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  // Verify cron authentication
  const authHeader = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  if (authHeader !== `Bearer ${CRON_SECRET}` && !vercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Calculate cutoff date (60 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    console.log(`[Cleanup] Removing events that ended before ${cutoffStr}`);

    // Delete events where end_date (or start_date if no end_date) is older than cutoff
    // First, delete events with end_date < cutoff
    const { data: deletedWithEnd, error: err1 } = await supabase
      .from("events")
      .delete()
      .lt("end_date", cutoffStr)
      .not("end_date", "is", null)
      .select("id");

    // Then delete events with no end_date where start_date < cutoff
    const { data: deletedNoEnd, error: err2 } = await supabase
      .from("events")
      .delete()
      .is("end_date", null)
      .lt("start_date", cutoffStr)
      .select("id");

    const totalDeleted = (deletedWithEnd?.length || 0) + (deletedNoEnd?.length || 0);

    if (err1 || err2) {
      console.error("[Cleanup] Errors:", err1?.message, err2?.message);
    }

    // Also clean up old scrape_runs (older than 90 days)
    const scrapeRunCutoff = new Date();
    scrapeRunCutoff.setDate(scrapeRunCutoff.getDate() - 90);
    const { data: deletedRuns } = await supabase
      .from("scrape_runs")
      .delete()
      .lt("run_date", scrapeRunCutoff.toISOString())
      .select("id");

    // Revalidate public pages
    revalidatePath("/", "layout");

    console.log(`[Cleanup] Removed ${totalDeleted} old events, ${deletedRuns?.length || 0} old scrape runs`);

    return NextResponse.json({
      success: true,
      cutoff_date: cutoffStr,
      events_deleted: totalDeleted,
      scrape_runs_deleted: deletedRuns?.length || 0,
    });
  } catch (err) {
    console.error("[Cleanup] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
