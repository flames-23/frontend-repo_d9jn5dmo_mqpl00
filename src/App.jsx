import { useEffect, useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking backend…' })

  // Prefer env, else fall back to the live backend URL for this session
  const backend = (import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '')) || 'https://ta-01k9w5m8nzswse2s3n9tznbaj5-8000.wo-igsd073u27x62za250v23jfsp.w.modal.host'

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${backend}/health`)
        if (!r.ok) throw new Error('Bad status')
        const j = await r.json()
        setHealth({ status: 'ok', message: j.status || 'ok' })
      } catch (e) {
        setHealth({ status: 'down', message: 'Backend unreachable' })
      }
    }
    check()
  }, [backend])

  const onUpload = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) return

    const form = new FormData()
    form.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(`${backend}/predict`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        let msg = 'Upload failed'
        try { msg = (await res.json()).detail || msg } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      const isNetwork = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
      setError(isNetwork ? 'Cannot reach backend. Please check the server status or VITE_BACKEND_URL.' : (err.message || 'Upload failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AI Lung Cancer Detection</h1>
            <p className="text-gray-600 mt-2">Upload a chest X-ray image to get a prediction. This demo uses a CNN model to estimate cancer likelihood.</p>
          </div>
          <div className="text-sm">
            {health.status === 'ok' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">● Backend Online</span>
            ) : health.status === 'down' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700">● Backend Down</span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700">● Checking…</span>
            )}
          </div>
        </div>

        <form onSubmit={onUpload} className="mt-8 p-6 bg-white rounded-xl shadow">
          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" onChange={(e)=> setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700" />
            <button disabled={!file || loading || health.status !== 'ok'} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 break-all">Backend: {backend}</p>
          {error && <p className="text-red-600 mt-3">{error}</p>}
        </form>

        {result && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-800">Result</h2>
            <p className="mt-2 text-gray-700">Prediction: <span className={`font-bold ${result.label === 'cancer' ? 'text-red-600' : 'text-emerald-600'}`}>{result.label}</span></p>
            <p className="text-gray-700">Confidence: <span className="font-semibold">{(result.confidence * 100).toFixed(2)}%</span></p>
            <p className="text-gray-500 text-sm mt-2">Time: {new Date(result.timestamp).toLocaleString()}</p>
            {result.heatmap && (
              <div className="mt-4">
                <img src={`data:image/png;base64,${result.heatmap}`} alt="Heatmap" className="rounded" />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-xs text-gray-500">
          <p>Note: This is a demo and not a medical device. For clinical decisions, consult qualified professionals.</p>
        </div>
      </div>
    </div>
  )
}

export default App
