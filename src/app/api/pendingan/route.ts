import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET — list semua item pendingan (join tujuan untuk kota/kecamatan/kode/nama).
// Query optional: ?tujuan_id=xxx untuk filter satu tujuan.
export async function GET(req: NextRequest) {
  try {
    const tujuanId = req.nextUrl.searchParams.get('tujuan_id')

    let query = supabase
      .from('pendingan_items')
      .select(`
        id, tujuan_id, jenis, qty, keterangan, created_at,
        tujuan:sj_tujuan!inner(id, kode, nama, kota, kecamatan)
      `)
      .order('created_at', { ascending: true })

    if (tujuanId) query = query.eq('tujuan_id', tujuanId)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// POST — tambah item pendingan.
// Body: { tujuan_id, items: [{ jenis, qty, keterangan }] } (batch)
//   ATAU { tujuan_id, jenis, qty, keterangan } (single)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tujuan_id } = body

    if (!tujuan_id) {
      return NextResponse.json({ error: 'tujuan_id wajib diisi' }, { status: 400 })
    }

    // Normalisasi jadi array
    const rawItems = Array.isArray(body.items)
      ? body.items
      : [{ jenis: body.jenis, qty: body.qty, keterangan: body.keterangan }]

    const rows = rawItems
      .filter((it: { jenis?: string }) => it.jenis && it.jenis.trim())
      .map((it: { jenis: string; qty?: number; keterangan?: string }) => ({
        tujuan_id,
        jenis: it.jenis.trim(),
        qty: Math.max(1, Number(it.qty) || 1),
        keterangan: (it.keterangan ?? '').trim(),
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Minimal satu item dengan jenis valid' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pendingan_items')
      .insert(rows)
      .select()

    if (error) throw new Error(error.message)
    return NextResponse.json({ items: data ?? [] }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// DELETE — clear item (hard delete). Body: { ids: string[] } atau ?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id')
    let ids: string[] = []

    if (idParam) {
      ids = [idParam]
    } else {
      const body = await req.json().catch(() => ({}))
      if (Array.isArray(body.ids)) ids = body.ids
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Tidak ada id untuk dihapus' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pendingan_items')
      .delete()
      .in('id', ids)

    if (error) throw new Error(error.message)
    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
