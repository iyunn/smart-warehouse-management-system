import { createBrowserClient } from "@supabase/ssr";

// Client untuk Client Components ("use client")
// Dipakai untuk login, register, dan operasi auth dari browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
