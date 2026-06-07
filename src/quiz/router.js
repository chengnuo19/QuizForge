// Tiny hash-based router. No dependency; the whole app state lives in the URL
// hash so a refresh lands on the same view and links are bookmarkable.
//
// Routes:
//   #                     → { view: 'library' }
//   #book=<bookId>        → { view: 'book', bookId }
//   #play=<bookId>/<quizId> → { view: 'play', bookId, quizId }
//   #q=<compressed>       → { view: 'shared', shared: '<compressed>' }
//   #srs                  → { view: 'srs' }
//   #stats                → { view: 'stats' }
//
// bookId may itself contain a colon (e.g. "builtin:数据结构与算法") and quizId may
// contain slashes (built-in quiz ids are full paths), so #play is split on the
// FIRST "/" only.

export function parseHash(hash = window.location.hash) {
  const h = (hash || '').replace(/^#/, '')
  if (!h) return { view: 'library' }

  if (h === 'srs') return { view: 'srs' }
  if (h === 'stats') return { view: 'stats' }

  if (h.startsWith('q=')) {
    return { view: 'shared', shared: h.slice(2) }
  }
  if (h.startsWith('book=')) {
    return { view: 'book', bookId: decodeURIComponent(h.slice(5)) }
  }
  if (h.startsWith('play=')) {
    const rest = h.slice(5)
    const slash = rest.indexOf('/')
    if (slash === -1) return { view: 'library' }
    return {
      view: 'play',
      bookId: decodeURIComponent(rest.slice(0, slash)),
      quizId: decodeURIComponent(rest.slice(slash + 1)),
    }
  }
  return { view: 'library' }
}

export function libraryHash() {
  return '#'
}

export function bookHash(bookId) {
  return `#book=${encodeURIComponent(bookId)}`
}

export function playHash(bookId, quizId) {
  return `#play=${encodeURIComponent(bookId)}/${encodeURIComponent(quizId)}`
}

// Navigation helpers — set the hash; the App's hashchange listener re-renders.
export function go(hash) {
  window.location.hash = hash
}

export function goLibrary() {
  go(libraryHash())
}
export function goBook(bookId) {
  go(bookHash(bookId))
}
export function goPlay(bookId, quizId) {
  go(playHash(bookId, quizId))
}
export function goSrs() {
  go('#srs')
}
export function goStats() {
  go('#stats')
}
