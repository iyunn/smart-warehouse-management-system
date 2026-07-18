import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Ekstrak kode CGA dari field toko: "CGA1 – ..." → "CGA1"
function extractCGA(toko: string): string {
  const m = (toko ?? "").match(/CGA\d/i);
  return m ? m[0].toUpperCase() : "";
}

// ── GET /api/staging — ambil semua item staging ─────────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("staging_area")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// ── PATCH /api/staging — update catatan item staging ────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { id, catatan } = await req.json();
    if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

    const { error } = await supabase
      .from("staging_area")
      .update({ catatan: catatan ?? "", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/staging — hapus item staging manual ─────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

    const { error } = await supabase.from("staging_area").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

// ── POST /api/staging (action: sync) — sinkronisasi ke monitoring ───────────
// Cek tiap item staging: kalau kode_asset ADA di assets_raw (DAT terbaru) DAN
// toko-nya CGA1/2/3 → pindahkan catatan ke asset_notes, hapus dari staging.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action !== "sync") {
      return NextResponse.json({ error: "action tidak valid" }, { status: 400 });
    }

    // Ambil semua staging yang punya kode_asset (AT Lebih tidak ikut sync)
    const { data: stagingItems, error: stagingError } = await supabase
      .from("staging_area")
      .select("id, kode_asset, catatan")
      .not("kode_asset", "is", null)
      .neq("kode_asset", "");

    if (stagingError) throw new Error(stagingError.message);
    if (!stagingItems || stagingItems.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: "Tidak ada item untuk disinkronkan." });
    }

    const kodeList = stagingItems.map(s => s.kode_asset);

    // Cek keberadaan kode_asset di assets_raw + ambil toko untuk validasi CGA
    // Pagination loop untuk hindari limit 1000
    const foundInDAT = new Map<string, string>(); // kode_asset -> toko
    const BATCH = 200;
    for (let i = 0; i < kodeList.length; i += BATCH) {
      const batch = kodeList.slice(i, i + BATCH);
      const { data: ratRows } = await supabase
        .from("assets_raw")
        .select("kode_asset, toko")
        .in("kode_asset", batch);

      for (const r of (ratRows ?? [])) {
        const kode = (r as any).kode_asset;
        const toko = (r as any).toko ?? "";
        if (kode && extractCGA(toko)) {  // hanya kalau toko mengandung CGA
          foundInDAT.set(kode, toko);
        }
      }
    }

    // Migrasi catatan untuk item yang ketemu di DAT + CGA
    let synced = 0;
    const idsToDelete: string[] = [];

    for (const item of stagingItems) {
      if (!foundInDAT.has(item.kode_asset)) continue;

      // Upsert catatan ke asset_notes (kalau catatan tidak kosong)
      if (item.catatan && item.catatan.trim()) {
        await supabase
          .from("asset_notes")
          .upsert(
            { kode_asset: item.kode_asset, catatan: item.catatan, updated_at: new Date().toISOString() },
            { onConflict: "kode_asset" }
          );
      }
      idsToDelete.push(item.id);
      synced++;
    }

    // Hapus item yang sudah dimigrasi dari staging
    if (idsToDelete.length > 0) {
      await supabase.from("staging_area").delete().in("id", idsToDelete);
    }

    return NextResponse.json({ success: true, synced });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
