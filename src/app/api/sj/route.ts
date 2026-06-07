import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Helper: generate No SJ format SJ-Manual/CGA/YYYY/MM/XXXX ──────────────
async function generateNoSJ(tanggal: string): Promise<string> {
  const date = new Date(tanggal)
  const year  = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const prefix = `SJ-Manual/CGA/${year}/${month}/`

  // Cari sequence terbesar di bulan ini
  const { data } = await supabase
    .from('surat_jalan')
    .select('no_sj')
    .like('no_sj', `${prefix}%`)
    .order('no_sj', { ascending: false })
    .limit(1)

  let nextSeq = 1
  if (data && data.length > 0) {
    const lastSeq = data[0].no_sj.split('/').pop() ?? '0000'
    nextSeq = parseInt(lastSeq) + 1
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`
}

// POST — create new SJ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tanggal, tujuan_id, pembawa, penerima, approved_by, items, status } = body

    if (!tanggal || !tujuan_id) {
      return NextResponse.json({ error: 'Tanggal dan tujuan wajib diisi' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 item barang' }, { status: 400 })
    }

    // Generate No SJ
    const no_sj = await generateNoSJ(tanggal)

    // Insert header
    const { data: sjData, error: sjError } = await supabase
      .from('surat_jalan')
      .insert({
        no_sj,
        tanggal,
        tujuan_id,
        pembawa:     pembawa ?? '',
        penerima:    penerima ?? '',
        approved_by: approved_by ?? '',
        status:      status ?? 'draft',
      })
      .select()
      .single()

    if (sjError) throw new Error(sjError.message)

    // Insert items (bulk)
    const itemsToInsert = items.map((item: any, idx: number) => ({
      sj_id:         sjData.id,
      urutan:        idx + 1,
      jenis:         item.jenis ?? '',
      merk:          item.merk ?? '',
      serial_number: item.serial_number ?? '',
      qty:           item.qty ?? 1,
      satuan:        item.satuan ?? 'Unit',
      is_baru:       !!item.is_baru,
      is_aktiva:     !!item.is_aktiva,
      keterangan:    item.keterangan ?? '',
    }))

    const { error: itemsError } = await supabase
      .from('surat_jalan_items')
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback: hapus header juga
      await supabase.from('surat_jalan').delete().eq('id', sjData.id)
      throw new Error(itemsError.message)
    }

    return NextResponse.json({ sj: sjData, no_sj })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
