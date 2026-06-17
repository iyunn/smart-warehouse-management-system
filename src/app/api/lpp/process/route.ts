import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface LPPRecordPayload {
  kode_asset: string;
  toko: string;
  deskripsi: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  saldo_akhir: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, isLastBatch } = body as { data: LPPRecordPayload[]; isLastBatch?: boolean };

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "Data batch kosong" }, { status: 400 });
    }

    const rows = data.map((r) => ({
      kode_asset: r.kode_asset,
      toko: r.toko,
      deskripsi: r.deskripsi ?? "",
      saldo_awal: r.saldo_awal ?? 0,
      masuk: r.masuk ?? 0,
      keluar: r.keluar ?? 0,
      saldo_akhir: r.saldo_akhir ?? 0,
      uploaded_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("lpp_raw").insert(rows);

    if (error) {
      console.error("[lpp/process] insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      isLastBatch: !!isLastBatch,
    });
  } catch (err) {
    console.error("[lpp/process]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
