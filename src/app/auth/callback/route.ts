import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-client/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";
  const type  = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Kalau ini dari reset password, redirect ke halaman set password baru
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Error → redirect ke login dengan pesan
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
