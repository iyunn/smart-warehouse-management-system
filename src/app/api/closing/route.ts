import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ── GET /api/closing — ambil semua data trend ───────────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("dat_closing")
      .select("bulan, cga, total_items, total_qty, total_nilai, total_tercatat, uploaded_at")
      .order("bulan", { ascending: true });

    if (error) throw new Error(error.message);
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[closing] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// ── POST /api/closing — upsert stats per CGA untuk bulan tertentu ───────────
// Body: { bulan: "2026-06", stats: [{ cga, total_items, total_qty, total_nilai, total_tercatat }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bulan, stats } = body;

    if (!bulan || !stats || !Array.isArray(stats) || stats.length === 0) {
      return NextResponse.json({ error: "bulan dan stats wajib diisi" }, { status: 400 });
    }

    // Validasi format bulan YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(bulan)) {
      return NextResponse.json({ error: "Format bulan harus YYYY-MM" }, { status: 400 });
    }

    // Upsert per CGA — kalau sudah ada (bulan+cga sama), timpa
    const rows = stats.map((s: any) => ({
      bulan,
      cga:            s.cga,
      total_items:    s.total_items ?? 0,
      total_qty:      s.total_qty ?? 0,
      total_nilai:    s.total_nilai ?? 0,
      total_tercatat: s.total_tercatat ?? 0,
      uploaded_at:    new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("dat_closing")
      .upsert(rows, { onConflict: "bulan,cga" });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, bulan, cga_count: rows.length });
  } catch (err) {
    console.error("[closing] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
