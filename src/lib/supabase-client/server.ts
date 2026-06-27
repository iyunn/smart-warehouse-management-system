import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client untuk Server Components, Route Handlers, Server Actions
// Membaca/menulis session via cookies
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component — bisa diabaikan kalau
            // ada middleware yang refresh session. Ini normal.
          }
        },
      },
    }
  );
}
