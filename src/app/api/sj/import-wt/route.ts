import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/sj/import-wt
 * Import Surat Jalan dari Web Tracking (WT) ke SmartWMS.
 *
 * Steps:
 *   1. Lookup tujuan by kode → kalau tidak ada, auto-create
 *   2. Generate nomor SJ SmartWMS (format SJ-Manual/CGA/...)
 *   3. Insert surat_jalan record (status: submitted)
 *   4. Insert surat_jalan_items (dengan kode_asset terisi otomatis)
 *
 * Payload (dari UploadWTSJSection setelah parse PDF):
 *   tujuan_kode, tujuan_nama, tanggal, pembawa, no_sj_wt (untuk keterangan),
 *   items: [{ kode_asset, nama_barang, keterangan, jenis, merk, qty, satuan,
 *            is_baru, is_aktiva }]
 */

async function generateNoSJ(tanggal: string): Promise<string> {
  const date  = new Date(tanggal);
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `SJ-Manual/CGA/${year}/${month}/`;

  const { data } = await supabase
    .from("surat_jalan")
    .select("no_sj")
    .like("no_sj", `${prefix}%`)
    .order("no_sj", { ascending: false })
    .limit(1);

  const nextSeq = data && data.length > 0
    ? parseInt(data[0].no_sj.split("/").pop() ?? "0") + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tujuan_kode,
      tujuan_nama,
      tanggal,
      pembawa,
      no_sj_wt,
      items,
    } = body;

    if (!tujuan_kode || !tanggal || !items?.length) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // ── 1. Lookup tujuan, auto-create kalau tidak ada ────────────────────────
    let tujuanId: string;

    const { data: existingTujuan } = await supabase
      .from("sj_tujuan")
      .select("id")
      .ilike("kode", tujuan_kode)
      .maybeSingle();

    if (existingTujuan) {
      tujuanId = existingTujuan.id;
    } else {
      // Tujuan tidak ditemukan — auto-create
      const { data: newTujuan, error: tujuanError } = await supabase
        .from("sj_tujuan")
        .insert({ kode: tujuan_kode.toUpperCase(), nama: tujuan_nama })
        .select("id")
        .single();

      if (tujuanError) throw new Error(`Gagal buat tujuan baru: ${tujuanError.message}`);
      tujuanId = newTujuan.id;
    }

    // ── 2. Generate No SJ SmartWMS ─────────────────────────────────────────
    const noSJ = await generateNoSJ(tanggal);

    // ── 3. Insert surat_jalan ─────────────────────────────────────────────
    const penerimaDisplay = `${tujuan_kode} — ${tujuan_nama}`;

    const { data: sjData, error: sjError } = await supabase
      .from("surat_jalan")
      .insert({
        no_sj:       noSJ,
        tanggal,
        tujuan_id:   tujuanId,
        pembawa:     pembawa || "",
        penerima:    penerimaDisplay,
        approved_by: "SPV/Manager",
        created_by:  "Admin GA",
        status:      "submitted",
        // No SJ WT disimpan di field keterangan level SJ (kalau tidak ada field dedicated)
      })
      .select("id, no_sj")
      .single();

    if (sjError) throw new Error(`Gagal buat SJ: ${sjError.message}`);

    // ── 4. Insert surat_jalan_items ─────────────────────────────────────────
    const sjItems = (items as any[]).map((it: any, idx: number) => ({
      sj_id:          sjData.id,
      urutan:         idx + 1,
      jenis:          it.jenis ?? "",
      merk:           it.merk ?? "",
      serial_number:  "",
      qty:            it.qty ?? 1,
      satuan:         it.satuan ?? "Unit",
      is_baru:        !!it.is_baru,
      is_aktiva:      true,   // SJ WT selalu aktiva (ada kode_asset)
      keterangan:     it.keterangan ?? "",
      kode_asset:     it.kode_asset ?? null,  // auto-fill rekap alokasi
      mutasi_wt_status: true, // sudah dibuatkan SJ WT = mutasi WT sudah terjadi
      mutasi_wt_at:     new Date().toISOString(),
    }));

    const { error: itemsError } = await supabase
      .from("surat_jalan_items")
      .insert(sjItems);

    if (itemsError) {
      // Rollback SJ yang sudah dibuat
      await supabase.from("surat_jalan").delete().eq("id", sjData.id);
      throw new Error(`Gagal insert items: ${itemsError.message}`);
    }

    return NextResponse.json({
      success: true,
      no_sj: sjData.no_sj,
      no_sj_wt,
      tujuan_created: !existingTujuan,
      items_count: sjItems.length,
    });

  } catch (err) {
    console.error("[sj/import-wt]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
