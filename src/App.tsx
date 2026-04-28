import { type FormEvent, useEffect, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import './App.css'

type SearchResult = {
  id: string
  title: string
  category: string
  summary: string
  details: string
}

const searchCatalog: SearchResult[] = Array.from({ length: 100 }, (_, index) => {
  const templates = [
    {
      title: 'Nearby coffee shops',
      category: 'Places',
      summary: 'Open now, good Wi-Fi, quick pickup.',
      details: 'Browse compact local spots with fast service, seating notes, and peak-hour hints.',
    },
    {
      title: 'Weekend flight deals',
      category: 'Travel',
      summary: 'Short-trip fares and departure times.',
      details: 'Compare fare windows, departure times, and trip length without leaving the page.',
    },
    {
      title: 'To-do templates',
      category: 'Productivity',
      summary: 'Simple daily planning lists.',
      details: 'Quick-start task layouts for planning, focus blocks, and day-end review.',
    },
    {
      title: 'Lunch spots nearby',
      category: 'Food',
      summary: 'Fast, healthy options close by.',
      details: 'Small, search-friendly summaries that make scanning options fast on mobile.',
    },
    {
      title: 'Mobile layout patterns',
      category: 'Design',
      summary: 'Sticky bars and scrollable results.',
      details: 'Detail pages keep context while the list and search state stay in the URL.',
    },
  ] as const

  const template = templates[index % templates.length]
  const sequence = String(index + 1).padStart(3, '0')

  return {
    id: `item-${sequence}`,
    title: `${template.title} ${sequence}`,
    category: template.category,
    summary: template.summary,
    details: `${template.details} Item ${sequence} keeps the example realistic for larger lists.`,
  }
})

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

const saveRecentSearches = (items: string[]) => {
  try {
    window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(items))
  } catch {
    // Ignore storage failures.
  }
}

const getSearchResultById = (id: string) => searchCatalog.find((item) => item.id === id)

const makeSearchPath = (query: string) => {
  const trimmedQuery = query.trim()

  return trimmedQuery ? `/?q=${encodeURIComponent(trimmedQuery)}` : '/'
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/items/:itemId" element={<DetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const submittedQuery = searchParams.get('q')?.trim() ?? ''
  const [draftQuery, setDraftQuery] = useState(() => submittedQuery)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

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
    saveRecentSearches(recentSearches)
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

  const commitQuery = (query: string) => {
    const normalizedInput = query.trim()

    if (!normalizedInput) {
      setDraftQuery('')
      setSearchParams({}, { replace: true })
      setIsSearchFocused(false)
      return
    }

    setDraftQuery(normalizedInput)
    addRecentSearch(normalizedInput)
    setSearchParams({ q: normalizedInput }, { replace: true })
    setIsSearchFocused(false)
  }

  const normalizedQuery = submittedQuery.toLowerCase()

  const visibleResults = searchCatalog.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return `${item.title} ${item.category} ${item.summary}`
      .toLowerCase()
      .includes(normalizedQuery)
  })

  const queryString = searchParams.toString()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    commitQuery(draftQuery)
  }

  const handleRecentSearchClick = (query: string) => {
    commitQuery(query)
  }

  const handleVoiceSearchClick = () => {
    if (!browserSupportsSpeechRecognition) {
      return
    }

    if (listening) {
      SpeechRecognition.stopListening()
      commitQuery(transcript)
      return
    }

    resetTranscript()
    setDraftQuery('')
    setIsSearchFocused(false)
    SpeechRecognition.startListening()
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
              <strong>
                {submittedQuery ? `Results for “${submittedQuery}”` : 'Trending results'}
              </strong>
              <span>{visibleResults.length} items</span>
            </div>

            {visibleResults.map((item) => (
              <Link
                key={item.id}
                className="card card--link"
                to={`/items/${item.id}${queryString ? `?${queryString}` : ''}`}
              >
                <small>{item.category}</small>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
              </Link>
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
        <button
          type="button"
          className={`searchbar__voice ${listening ? 'searchbar__voice--active' : ''}`}
          onClick={handleVoiceSearchClick}
          disabled={!browserSupportsSpeechRecognition}
          aria-pressed={listening}
          aria-label={listening ? 'Stop voice search' : 'Start voice search'}
          title={browserSupportsSpeechRecognition ? (listening ? 'Stop voice search' : 'Voice search') : 'Voice search not supported'}
        >
          {listening ? 'Stop' : 'Voice'}
        </button>
        <button type="submit">Search</button>
      </form>
    </div>
  )
}

function DetailPage() {
  const navigate = useNavigate()
  const { itemId } = useParams()
  const [searchParams] = useSearchParams()

  const item = itemId ? getSearchResultById(itemId) : undefined

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

export default App
