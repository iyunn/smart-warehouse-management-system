import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET — list semua tujuan
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sj_tujuan')
      .select('*')
      .order('kode', { ascending: true })

    if (error) throw new Error(error.message)
    return NextResponse.json({ tujuan: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// POST — tambah tujuan baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kode, nama } = body

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sj_tujuan')
      .insert({ kode: kode.trim().toUpperCase(), nama: nama.trim() })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ tujuan: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// PATCH — edit tujuan
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, kode, nama } = body

    if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })

    const { data, error } = await supabase
      .from('sj_tujuan')
      .update({ kode: kode.trim().toUpperCase(), nama: nama.trim() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ tujuan: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// DELETE — hapus tujuan
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })

    const { error } = await supabase.from('sj_tujuan').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
