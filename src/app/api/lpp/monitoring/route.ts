import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET semua lpp_raw — fetch dengan pagination loop (Supabase PostgREST
// default limit 1000/request), sama pola dengan dat-summary route.
export async function GET() {
  try {
    let allData: any[] = [];
    let from = 0;
    const FETCH_SIZE = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("lpp_raw")
        .select("id, kode_asset, toko, deskripsi, saldo_awal, masuk, keluar, saldo_akhir, uploaded_at")
        .range(from, from + FETCH_SIZE - 1);

      if (error) throw new Error(error.message);

      const batch = data ?? [];
      allData = [...allData, ...batch];

      if (batch.length < FETCH_SIZE) break;
      from += FETCH_SIZE;
      if (from > 100000) break;
    }

    return NextResponse.json({ items: allData });
  } catch (err) {
    console.error("[lpp/monitoring]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
