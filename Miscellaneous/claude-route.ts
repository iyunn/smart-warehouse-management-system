/**
 * app/api/process/route.ts
 * Receives a batch of AssetRecords and forwards them to the upstream
 * data-store / Oracle service.
 *
 * Replace the placeholder logic inside processBatch() with your real
 * database insert / external API call.
 *
 * Payload: POST { data: AssetRecord[] }
 * Returns: 200 { success: true, inserted: number }
 *        | 400 { error: string }
 *        | 500 { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import type { AssetRecord } from "@/lib/types";

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidRecord(r: unknown): r is AssetRecord {
  if (typeof r !== "object" || r === null) return false;
  const obj = r as Record<string, unknown>;
  return (
    typeof obj.toko === "string" &&
    typeof obj.kategori_oracle === "string" &&
    typeof obj.kode_asset === "string" &&
    typeof obj.deskripsi === "string" &&
    typeof obj.status === "string"
  );
}

// ─── Placeholder business logic ───────────────────────────────────────────────
// Replace this with your actual DB insert / downstream API call.

async function processBatch(records: AssetRecord[]): Promise<void> {
  // Example: await db.insert(records);
  // Example: await externalApi.post("/assets/bulk", { assets: records });
  //
  // For now we just simulate a short async operation so the code is runnable.
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body bukan JSON yang valid." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).data)
  ) {
    return NextResponse.json(
      { error: 'Payload harus berbentuk { "data": [...] }.' },
      { status: 400 }
    );
  }

  const data = (body as { data: unknown[] }).data;

  if (data.length === 0) {
    return NextResponse.json(
      { error: "Array data kosong." },
      { status: 400 }
    );
  }

  const invalidIndex = data.findIndex((r) => !isValidRecord(r));
  if (invalidIndex !== -1) {
    return NextResponse.json(
      {
        error: `Record pada index ${invalidIndex} tidak valid. Semua field wajib (toko, kategori_oracle, kode_asset, deskripsi, status) harus berupa string.`,
      },
      { status: 400 }
    );
  }

  try {
    await processBatch(data as AssetRecord[]);
    return NextResponse.json({ success: true, inserted: data.length });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error.";
    console.error("[/api/process]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}