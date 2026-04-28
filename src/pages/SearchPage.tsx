import { type FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import type { SearchResult } from '../types'
import { fetchCatalog } from '../api/mockApi'
import { readRecentSearches, saveRecentSearches } from '../utils/storage'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const splitQueryWords = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean)

const highlightMatch = (text: string, query: string) => {
  const words = splitQueryWords(query)

  if (words.length === 0) {
    return text
  }

  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'ig')
  const segments = text.split(pattern)

  return segments.map((segment, index) =>
    index % 2 === 1 ? (
      <mark key={`${segment}-${index}`} className="card__title-mark">
        {segment}
      </mark>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    ),
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const submittedQuery = searchParams.get('q')?.trim() ?? ''
  const [draftQuery, setDraftQuery] = useState(() => submittedQuery)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches())
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()
  const [catalog, setCatalog] = useState<SearchResult[] | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(true)

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

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoadingCatalog(true)
      const data = await fetchCatalog()
      if (!mounted) return
      setCatalog(data)
      setLoadingCatalog(false)
    })()

    return () => {
      mounted = false
    }
  }, [])

  const addRecentSearch = (query: string) => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return
    const normalizedKey = normalizedQuery.toLowerCase()
    setRecentSearches((currentSearches) => {
      const nextSearches = [normalizedQuery, ...currentSearches.filter((item) => item.toLowerCase() !== normalizedKey)]
      return nextSearches.slice(0, 8)
    })
  }

  const commitQuery = (query: string) => {
    const normalizedInput = query.trim()
    const next = new URLSearchParams(searchParams)

    if (!normalizedInput) {
      setDraftQuery('')
      next.delete('q')
      setSearchParams(next, { replace: true })
      setIsSearchFocused(false)
      return
    }

    setDraftQuery(normalizedInput)
    addRecentSearch(normalizedInput)
    next.set('q', normalizedInput)
    setSearchParams(next, { replace: true })
    setIsSearchFocused(false)
  }

  const queryWords = splitQueryWords(submittedQuery)
  const source = catalog ?? []
  const filterTimerLabel = 'Search filter time'

  console.time(filterTimerLabel)
  const visibleResults = source.filter((item) => {
    if (queryWords.length === 0) return true

    const searchableText = [item.title, item.category, item.summary].join(' ').toLowerCase()

    return queryWords.every((word) => searchableText.includes(word))
  })
  console.timeEnd(filterTimerLabel)

  const queryString = searchParams.toString()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    commitQuery(draftQuery)
  }

  const handleRecentSearchClick = (query: string) => {
    commitQuery(query)
  }

  const handleVoiceSearchClick = () => {
    if (!browserSupportsSpeechRecognition) return
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
        {loadingCatalog ? (
          <div className="results__loading">Loading results…</div>
        ) : isSearchFocused ? (
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
              <strong>{submittedQuery ? `Results for “${submittedQuery}”` : 'Trending results'}</strong>
              <span>{visibleResults.length} items</span>
            </div>

            {visibleResults.map((item) => (
              <Link key={item.id} className="card card--link" to={`/items/${item.id}${queryString ? `?${queryString}` : ''}`}>
                <small>{item.category}</small>
                <h2>{highlightMatch(item.title, submittedQuery)}</h2>
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
