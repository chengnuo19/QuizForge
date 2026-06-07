import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Library from './components/Library.jsx'
import BookDetail from './components/BookDetail.jsx'
import { getBook } from './quiz/books.js'
import { loadTheme, saveTheme } from './quiz/storage.js'
import { parseQuiz } from './quiz/parseQuiz.js'
import { decodeShare } from './quiz/share.js'
import { parseHash, goLibrary, goBook, bookHash } from './quiz/router.js'
import { getDueCards } from './quiz/srs.js'

// The player and SRS session pull in react-markdown + KaTeX — load lazily.
const QuizPlayer = lazy(() => import('./components/QuizPlayer.jsx'))
const SrsSession = lazy(() => import('./components/SrsSession.jsx'))
const StatsView = lazy(() => import('./components/StatsView.jsx'))

// Hash-routed app: Library ⇄ BookDetail ⇄ Player. State lives in location.hash so
// a refresh lands on the same view. A transient quiz (retry-wrong / shared link)
// overrides the route while active.
export default function App() {
  const [route, setRoute] = useState(() => parseHash())
  const [theme, setTheme] = useState(loadTheme())
  // { quiz, source, returnHash } for retry-wrong; null otherwise.
  const [transient, setTransient] = useState(null)
  // { bookId, quizId, source } when arriving at a book to edit a quiz.
  const [editTarget, setEditTarget] = useState(null)
  // Bump to force book reloads after user-book mutations.
  const [booksVersion, setBooksVersion] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    const onHash = () => {
      setTransient(null)
      setRoute(parseHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const refreshBooks = () => setBooksVersion((v) => v + 1)

  // Resolve a shared (#q=) quiz from the compressed hash payload.
  const shared = useMemo(() => {
    if (route.view !== 'shared') return null
    try {
      const source = decodeShare(route.shared)
      return { quiz: parseQuiz(source), source }
    } catch {
      return null
    }
  }, [route])

  // Resolve a #play route to its book + quiz entry.
  const playing = useMemo(() => {
    if (route.view !== 'play') return null
    const book = getBook(route.bookId)
    const entry = book?.quizzes.find((q) => q.id === route.quizId)
    if (!entry || !entry.quiz) return null
    return { book, entry }
  }, [route, booksVersion])

  // ----- Render -----

  // Transient quiz (retry-wrong) takes over the screen.
  if (transient) {
    return (
      <div className="app">
        <Suspense fallback={<div className="player" />}>
          <QuizPlayer
            quiz={transient.quiz}
            source={transient.source}
            transient
            onExit={() => {
              const back = transient.returnHash
              setTransient(null)
              if (back) window.location.hash = back
              else goLibrary()
            }}
            onRetry={(quiz, source) =>
              setTransient((t) => ({ quiz, source, returnHash: t?.returnHash }))
            }
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </Suspense>
      </div>
    )
  }

  let body
  if (route.view === 'srs') {
    const cards = getDueCards()
    body = (
      <Suspense fallback={<div className="player" />}>
        <SrsSession
          cards={cards}
          onExit={goLibrary}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    )
  } else if (route.view === 'stats') {
    body = (
      <Suspense fallback={<div className="player" />}>
        <StatsView onExit={goLibrary} theme={theme} onToggleTheme={toggleTheme} />
      </Suspense>
    )
  } else if (route.view === 'shared') {
    body = shared ? (
      <Suspense fallback={<div className="player" />}>
        <QuizPlayer
          quiz={shared.quiz}
          source={shared.source}
          onExit={goLibrary}
          onRetry={(quiz, source) => setTransient({ quiz, source, returnHash: '#' })}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    ) : (
      <Library theme={theme} onToggleTheme={toggleTheme} onBooksChange={refreshBooks} key={booksVersion} />
    )
  } else if (route.view === 'play' && playing) {
    const isUserBook = !playing.book.builtin
    body = (
      <Suspense fallback={<div className="player" />}>
        <QuizPlayer
          quiz={playing.entry.quiz}
          source={playing.entry.source}
          bookId={playing.book.id}
          quizId={playing.entry.id}
          onExit={() => goBook(playing.book.id)}
          onEdit={
            isUserBook
              ? () => {
                  setEditTarget({
                    bookId: playing.book.id,
                    quizId: playing.entry.id,
                    source: playing.entry.source,
                  })
                  goBook(playing.book.id)
                }
              : undefined
          }
          onRetry={(quiz, source) =>
            setTransient({ quiz, source, returnHash: bookHash(playing.book.id) })
          }
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    )
  } else if (route.view === 'book') {
    body = (
      <BookDetail
        key={`${route.bookId}:${booksVersion}`}
        bookId={route.bookId}
        editTarget={editTarget}
        onConsumeEditTarget={() => setEditTarget(null)}
        onChange={refreshBooks}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  } else {
    // library (default) — also the fallback for missing book/quiz.
    body = (
      <Library
        key={booksVersion}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBooksChange={refreshBooks}
      />
    )
  }

  return <div className="app">{body}</div>
}
