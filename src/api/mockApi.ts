import type { SearchResult } from '../types'

// Generate a sample catalog (same data shape as before).
const generateCatalog = (): SearchResult[] =>
  Array.from({ length: 100 }, (_, index) => {
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

let _catalogCache: SearchResult[] | null = null

export const fetchCatalog = async (): Promise<SearchResult[]> => {
  if (_catalogCache) return _catalogCache

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600))

  _catalogCache = generateCatalog()
  return _catalogCache
}

export const fetchItem = async (id: string): Promise<SearchResult | undefined> => {
  if (_catalogCache) return _catalogCache.find((i) => i.id === id)

  const catalog = await fetchCatalog()
  return catalog.find((i) => i.id === id)
}
