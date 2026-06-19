import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Reconciliation Engine — bandingkan DAT (assets_raw) vs LPP (lpp_raw) by
 * kode_asset, hasilkan 5 kondisi aktif (kondisi 3 "Aset Intransit" belum
 * diimplementasi, butuh data Report Intransit yang belum tersedia):
 *
 *   1. Ada di DAT & Ada di LPP & CGA sama    → Fisik di CGA (normal)
 *   2. Ada di DAT & Tidak di LPP             → Belum Mutasi Oracle (warning)
 *   4. Tidak di DAT & Ada di LPP             → Belum Mutasi WT (warning)
 *   5. Tidak di DAT & Tidak LPP              → Fisik Allocated (normal)
 *   6. Ada di DAT & Ada di LPP & CGA BEDA   → Mismatch CGA (warning)
 *
 * Universe pembanding untuk kondisi 5 dibatasi ke kode_asset yang PERNAH
 * tercatat di sistem (union DAT ∪ LPP ∪ surat_jalan_items.kode_asset).
 */

async function fetchAll(table: string, columns: string) {
  let allData: any[] = [];
  let from = 0;
  const FETCH_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + FETCH_SIZE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);

    const batch = data ?? [];
    allData = [...allData, ...batch];

    if (batch.length < FETCH_SIZE) break;
    from += FETCH_SIZE;
    if (from > 200000) break;
  }
  return allData;
}

// assets_raw.toko menyimpan label panjang ("CGA1 - Cadangan General Affairs
// 1"), bukan kode singkat. lpp_raw.toko SUDAH bersih (diekstrak dari nama
// file saat upload). Extract kode singkat dari toko DAT supaya konsisten
// dengan LPP & badge UI (CGA_BADGE di halaman reconciliation hanya punya
// key "CGA1"/"CGA2"/"CGA3").
function extractCGACode(toko: string): string {
  const match = toko.match(/CGA\s*\d/i);
  return match ? match[0].replace(/\s+/g, "").toUpperCase() : toko;
}

export async function GET() {
  try {
    const [datRows, lppRows, sjRows] = await Promise.all([
      fetchAll("assets_raw", "kode_asset, toko, deskripsi"),
      fetchAll("lpp_raw", "kode_asset, toko, deskripsi"),
      fetchAll("surat_jalan_items", "kode_asset, jenis, merk"),
    ]);

    const datMap = new Map<string, { toko: string; deskripsi: string }>();
    for (const r of datRows) {
      if (r.kode_asset) datMap.set(r.kode_asset, { toko: extractCGACode(r.toko ?? ""), deskripsi: r.deskripsi ?? "" });
    }

    const lppMap = new Map<string, { toko: string; deskripsi: string }>();
    for (const r of lppRows) {
      if (r.kode_asset) lppMap.set(r.kode_asset, { toko: r.toko ?? "", deskripsi: r.deskripsi ?? "" });
    }

    const sjDeskripsiMap = new Map<string, string>();
    for (const r of sjRows) {
      if (r.kode_asset && !sjDeskripsiMap.has(r.kode_asset)) {
        const label = [r.jenis, r.merk].filter(Boolean).join(" - ");
        sjDeskripsiMap.set(r.kode_asset, label || "-");
      }
    }

    // Universe: semua kode_asset yang pernah tercatat di salah satu sumber
    const universe = new Set<string>([
      ...datMap.keys(),
      ...lppMap.keys(),
      ...sjDeskripsiMap.keys(),
    ]);

    type ReconItem = {
      kode_asset: string;
      toko: string;      // CGA dari DAT (kondisi 1,2,6) atau LPP (kondisi 4) atau "-" (kondisi 5)
      tokoLPP: string | null; // CGA dari LPP, hanya diisi untuk kondisi 6 (mismatch)
      deskripsi: string;
      kondisi: 1 | 2 | 4 | 5 | 6;
      inDAT: boolean;
      inLPP: boolean;
    };

    const items: ReconItem[] = [];
    const summary = { kondisi1: 0, kondisi2: 0, kondisi4: 0, kondisi5: 0, kondisi6: 0 };

    for (const kode of universe) {
      const dat = datMap.get(kode);
      const lpp = lppMap.get(kode);
      const inDAT = !!dat;
      const inLPP = !!lpp;

      let kondisi: 1 | 2 | 4 | 5 | 6;
      let toko = "";
      let tokoLPP: string | null = null;
      let deskripsi = "";

      if (inDAT && inLPP) {
        toko = dat!.toko;
        deskripsi = dat!.deskripsi;
        if (dat!.toko === lpp!.toko) {
          // CGA sama di DAT dan LPP — normal
          kondisi = 1;
          summary.kondisi1++;
        } else {
          // CGA BEDA antara DAT dan LPP — mismatch, perlu investigasi
          kondisi = 6;
          tokoLPP = lpp!.toko; // simpan CGA sisi LPP untuk ditampilkan di UI
          summary.kondisi6++;
        }
      } else if (inDAT && !inLPP) {
        kondisi = 2; toko = dat!.toko; deskripsi = dat!.deskripsi;
        summary.kondisi2++;
      } else if (!inDAT && inLPP) {
        kondisi = 4; toko = lpp!.toko; deskripsi = lpp!.deskripsi;
        summary.kondisi4++;
      } else {
        kondisi = 5; toko = "-"; deskripsi = sjDeskripsiMap.get(kode) ?? "-";
        summary.kondisi5++;
      }

      items.push({ kode_asset: kode, toko, tokoLPP, deskripsi, kondisi, inDAT, inLPP });
    }

    return NextResponse.json({ summary, items, totalUniverse: universe.size });
  } catch (err) {
    console.error("[reconciliation]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
