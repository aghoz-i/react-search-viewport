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

const recentSearchStorageKey = 'recent-searches'

const readRecentSearches = () => {
  try {
    const storedValue = window.localStorage.getItem(recentSearchStorageKey)

    if (!storedValue) {
      return [] as string[]
    }

    const parsedValue = JSON.parse(storedValue) as unknown

    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return [] as string[]
  }
}

function App() {
  const [draftQuery, setDraftQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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

    return () => {
      window.removeEventListener('resize', updateAppHeight)
      window.removeEventListener('orientationchange', updateAppHeight)
      window.visualViewport?.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('scroll', updateAppHeight)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(recentSearches))
    } catch {
      // Ignore storage failures.
    }
  }, [recentSearches])

  const addRecentSearch = (query: string) => {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      return
    }

    const normalizedKey = normalizedQuery.toLowerCase()

    setRecentSearches((currentSearches) => {
      const nextSearches = [
        normalizedQuery,
        ...currentSearches.filter((item) => item.toLowerCase() !== normalizedKey),
      ]

      return nextSearches.slice(0, 8)
    })
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

    const normalizedQuery = draftQuery.trim()

    if (!normalizedQuery) {
      setSubmittedQuery('')
      setIsSearchFocused(false)
      return
    }

    addRecentSearch(normalizedQuery)
    setSubmittedQuery(normalizedQuery)
    setIsSearchFocused(false)
  }

  const handleRecentSearchClick = (query: string) => {
    setDraftQuery(query)
    setSubmittedQuery(query)
    addRecentSearch(query)
    setIsSearchFocused(false)
  }

  return (
    <div className="search-page">
      <header className="topbar">
        <div>
          <h1>Search</h1>
          <p>Mobile search page.</p>
        </div>
      </header>

      <main className="results" aria-label={isSearchFocused ? 'Recent searches' : 'Search results'}>
        {isSearchFocused ? (
          <section className="recent-searches" aria-label="Recent searches">
            <div className="results__header">
              <strong>Recent searches</strong>
              <span>{recentSearches.length} items</span>
            </div>

            {recentSearches.length > 0 ? (
              <div className="recent-searches__list">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    type="button"
                    className="recent-searches__item"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleRecentSearchClick(search)
                    }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            ) : (
              <p className="recent-searches__empty">Your recent searches will appear here.</p>
            )}
          </section>
        ) : (
          <>
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
          </>
        )}
      </main>

      <form className="searchbar" onSubmit={handleSubmit}>
        <input
          id="search-input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Search"
          value={draftQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  )
}

export default App
