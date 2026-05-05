import { NextResponse } from 'next/server'
import { classifyAsset } from '@/lib/classifier'

export async function POST(req: Request) {
  const body = await req.json()
  const { data } = body

  let results: any[] = []

  for (const item of data) {
    const result = classifyAsset(item.deskripsi)
    results.push(result)
  }

  return NextResponse.json({
    success: true,
    preview: results
  })
}