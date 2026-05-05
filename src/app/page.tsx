'use client'

import { useState } from 'react'

export default function Home() {
  const [deskripsi, setDeskripsi] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            kode: 'TEST001',
            deskripsi: deskripsi,
            status: 'CGA1'
          }
        ]
      })
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-500 p-8">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl text-black font-bold mb-4">
          Smart Warehouse - Test Classifier
        </h1>

        <input
          type="text"
          placeholder="Masukkan deskripsi barang..."
          className="w-full border p-2 rounded mb-4 text-gray-950"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Processing...' : 'Proses'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <pre className="text-sm bg-gray-900 text-white p-3 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}