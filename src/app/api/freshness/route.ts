import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Endpoint ringan — hanya ambil 1 baris dari masing-masing tabel
// (MAX uploaded_at via ORDER DESC LIMIT 1). Dipakai Sidebar yang render
// di setiap halaman, jadi harus se-ringan mungkin. JANGAN pakai endpoint
// ini untuk data besar — ini khusus freshness indicator saja.
export async function GET() {
  try {
    const [dat, lpp] = await Promise.all([
      supabase
        .from("assets_raw")
        .select("uploaded_at")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("lpp_raw")
        .select("uploaded_at")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      datLastUpload: dat.data?.uploaded_at ?? null,
      lppLastUpload: lpp.data?.uploaded_at ?? null,
    });
  } catch (err) {
    console.error("[freshness]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
