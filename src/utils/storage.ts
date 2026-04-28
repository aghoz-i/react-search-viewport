export const recentSearchStorageKey = 'recent-searches'

export const readRecentSearches = (): string[] => {
  try {
    const storedValue = window.localStorage.getItem(recentSearchStorageKey)
    if (!storedValue) return []
    const parsed = JSON.parse(storedValue) as unknown
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export const saveRecentSearches = (items: string[]) => {
  try {
    window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(items))
  } catch {
    // ignore
  }
}
