import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ─── GET: list semua template ──────────────────────────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("sj_item_templates")
      .select("id, nama, items, created_at")
      .order("nama", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    console.error("[sj/templates GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─── POST: buat template baru ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nama = (body?.nama ?? "").trim();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!nama) {
      return NextResponse.json({ error: "Nama template wajib diisi" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Minimal 1 item dalam template" }, { status: 400 });
    }

    // Sanitasi: hanya simpan field yang relevan, buang serial_number/urutan/dll
    const cleanItems = items.map((it: any) => ({
      jenis:      String(it.jenis ?? ""),
      merk:       String(it.merk ?? ""),
      qty:        Number(it.qty) > 0 ? Number(it.qty) : 1,
      satuan:     String(it.satuan ?? "Unit"),
      is_baru:    !!it.is_baru,
      is_aktiva:  !!it.is_aktiva,
      keterangan: String(it.keterangan ?? ""),
    }));

    const { data, error } = await supabase
      .from("sj_item_templates")
      .insert({ nama, items: cleanItems })
      .select("id, nama, items, created_at")
      .single();

    if (error) {
      // Unique violation (nama sudah ada)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `Template dengan nama "${nama}" sudah ada` },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ template: data });
  } catch (err) {
    console.error("[sj/templates POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─── DELETE: hapus template by id ───────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id wajib disertakan" }, { status: 400 });
    }

    const { error } = await supabase
      .from("sj_item_templates")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[sj/templates DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
