import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { SearchResult } from '../types'
import { fetchItem } from '../api/mockApi'

const makeSearchPath = (query: string) => {
  const trimmedQuery = query.trim()
  return trimmedQuery ? `/?q=${encodeURIComponent(trimmedQuery)}` : '/'
}

export default function DetailPage() {
  const navigate = useNavigate()
  const { itemId } = useParams()
  const [searchParams] = useSearchParams()

  const [item, setItem] = useState<SearchResult | null>(null)
  const [loadingItem, setLoadingItem] = useState(true)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoadingItem(true)

      if (!itemId) {
        if (mounted) setLoadingItem(false)
        return
      }

      const found = await fetchItem(itemId)
      if (!mounted) return

      setItem(found ?? null)
      setLoadingItem(false)
    })()

    return () => {
      mounted = false
    }
  }, [itemId])

  if (loadingItem) {
    return (
      <div className="detail-page">
        <header className="detail-hero">
          <button type="button" className="detail-back" onClick={() => navigate(-1)}>
            Back
          </button>
          <p>Loading…</p>
        </header>
      </div>
    )
  }

  if (!item) {
    return <Navigate to={makeSearchPath(searchParams.get('q') ?? '')} replace />
  }

  return (
    <div className="detail-page">
      <header className="detail-hero">
        <button type="button" className="detail-back" onClick={() => navigate(-1)}>
          Back
        </button>
        <small className="detail-kicker">{item.category}</small>
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
      </header>

      <main className="detail-body">
        <section className="detail-panel">
          <h2>About this result</h2>
          <p>{item.details}</p>
        </section>

        <section className="detail-panel detail-panel--muted">
          <h2>Returning to the list</h2>
          <p>
            The search term stays in the URL, so using the back button returns to the same filtered
            page instead of resetting the list.
          </p>
        </section>
      </main>
    </div>
  )
}
