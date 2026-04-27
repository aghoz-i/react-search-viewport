import { type FormEvent, useEffect, useState } from 'react'
import './App.css'

type SearchResult = {
  title: string
  category: string
  summary: string
}

const searchCatalog: SearchResult[] = [
  { title: 'Nearby coffee shops', category: 'Places', summary: 'Open now, good Wi-Fi, quick pickup.' },
  { title: 'Weekend flight deals', category: 'Travel', summary: 'Short-trip fares and departure times.' },
  { title: 'To-do templates', category: 'Productivity', summary: 'Simple daily planning lists.' },
  { title: 'Lunch spots nearby', category: 'Food', summary: 'Fast, healthy options close by.' },
  { title: 'Mobile layout patterns', category: 'Design', summary: 'Sticky bars and scrollable results.' },
]

function App() {
  const [draftQuery, setDraftQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const root = document.documentElement

    const updateAppHeight = () => {
      const viewport = window.visualViewport
      const height = Math.round(viewport?.height ?? window.innerHeight)

      root.style.setProperty('--app-height', `${height}px`)
    }

    updateAppHeight()

    window.addEventListener('resize', updateAppHeight)
    window.addEventListener('orientationchange', updateAppHeight)
    window.visualViewport?.addEventListener('resize', updateAppHeight)
    window.visualViewport?.addEventListener('scroll', updateAppHeight)

    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', updateFullscreenState)

    updateFullscreenState()

    return () => {
      window.removeEventListener('resize', updateAppHeight)
      window.removeEventListener('orientationchange', updateAppHeight)
      window.visualViewport?.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('scroll', updateAppHeight)
      document.removeEventListener('fullscreenchange', updateFullscreenState)
    }
  }, [])

  const handleFullscreenToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }

  const normalizedQuery = submittedQuery.trim().toLowerCase()

  const visibleResults = searchCatalog.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return `${item.title} ${item.category} ${item.summary}`
      .toLowerCase()
      .includes(normalizedQuery)
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmittedQuery(draftQuery)
  }

  return (
    <div className="search-page">
      <header className="topbar">
        <div>
          <h1>Search</h1>
          <p>Mobile search page.</p>
        </div>
        <button type="button" className="topbar__button" onClick={handleFullscreenToggle}>
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
      </header>

      <main className="results" aria-label="Search results">
        <div className="results__header">
          <strong>{submittedQuery.trim() ? `Results for “${submittedQuery.trim()}”` : 'Trending results'}</strong>
          <span>{visibleResults.length} items</span>
        </div>

        {visibleResults.map((item) => (
          <article className="card" key={item.title}>
            <small>{item.category}</small>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </article>
        ))}
      </main>

      <form className="searchbar" onSubmit={handleSubmit}>
        <input
          id="search-input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  )
}

export default App
