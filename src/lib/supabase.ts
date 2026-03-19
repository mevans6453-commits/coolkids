import { createClient } from "@supabase/supabase-js";

// Legacy public client — used by events/venues pages for anonymous reads.
// For auth-aware operations, use src/lib/supabase/server.ts or client.ts instead.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
