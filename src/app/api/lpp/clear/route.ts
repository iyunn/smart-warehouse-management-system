import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// DELETE semua lpp_raw — dipanggil sekali sebelum batch pertama dikirim,
// sama seperti pola /api/process/clear untuk DAT. Karena 3 file (CGA1/2/3)
// selalu diupload bersamaan, full replace seluruh tabel setiap kali aman.
export async function POST() {
  try {
    const { error } = await supabase
      .from("lpp_raw")
      .delete()
      .not("id", "is", null); // delete semua baris

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[lpp/clear]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
