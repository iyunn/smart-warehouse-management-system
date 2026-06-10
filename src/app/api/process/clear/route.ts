import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * POST /api/process/clear
 * Menghapus seluruh data assets_raw (dan assets_clean via CASCADE)
 * sebagai bagian dari strategi Full Replace upload DAT.
 *
 * Dipanggil SEKALI dari UploadSection.tsx sebelum batch pertama dikirim,
 * bukan di dalam setiap batch request.
 */
export async function POST() {
  const { error } = await supabase
    .from('assets_raw')
    .delete()
    .neq('kode_asset', '')   // delete all rows

  if (error) {
    console.error('[clear] delete error:', error)
    return NextResponse.json(
      { success: false, error: `Gagal hapus data lama: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
