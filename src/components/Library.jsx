import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import BookCard from './BookCard.jsx'
import BookEditor from './BookEditor.jsx'
import { listBooks, createBook } from '../quiz/books.js'
import { goBook, goSrs, goStats } from '../quiz/router.js'
import { countDue } from '../quiz/srs.js'
import { usePwaInstall } from '../hooks/usePwaInstall.js'

// Landing page: notebook (book) grid, matching the NotebookLM-style layout.
// Built-in books come from /content folders; user books live in localStorage.
export default function Library({ theme, onToggleTheme, onBooksChange }) {
  const [creating, setCreating] = useState(false)
  // Local version bump so a newly created book shows immediately.
  const [version, setVersion] = useState(0)
  const books = useMemo(() => listBooks(), [version])
  const [dueCount, setDueCount] = useState(0)
  const { canInstall, promptInstall } = usePwaInstall()

  useEffect(() => {
    // countDue() scans all books — run asynchronously to avoid blocking paint.
    const id = requestAnimationFrame(() => {
      try { setDueCount(countDue()) } catch { /* best-effort */ }
    })
    return () => cancelAnimationFrame(id)
  }, [version])

  const handleCreate = ({ name, icon, color }) => {
    const book = createBook({ name, icon, color })
    setCreating(false)
    setVersion((v) => v + 1)
    onBooksChange?.()
    goBook(book.id)
  }

  return (
    <div className="home">
      <div className="home__topbar">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <header className="home__hero">
        <span className="home__mark">✳</span>
        <h1 className="home__title">QuizForge</h1>
        <p className="home__subtitle">
          把题目、答案与详解整理进笔记本，随时开始可交互的测验。
        </p>

        <div className="home__actions">
          {dueCount > 0 && (
            <button
              type="button"
              className="button button--primary home__srs-btn"
              onClick={goSrs}
            >
              🗂 今日复习
              <span className="home__srs-badge">{dueCount}</span>
            </button>
          )}
          <button
            type="button"
            className="button button--secondary home__stats-btn"
            onClick={goStats}
          >
            📊 学习报告
          </button>
          {canInstall && (
            <button
              type="button"
              className="button button--secondary home__install-btn"
              onClick={promptInstall}
            >
              📲 安装应用
            </button>
          )}
        </div>
      </header>

      <section className="home__section">
        <h2 className="home__heading">我的笔记本</h2>

        {creating ? (
          <BookEditor
            title="新建笔记本"
            submitLabel="创建"
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <div className="home__grid">
            <button
              type="button"
              className="book-card book-card--new"
              onClick={() => setCreating(true)}
            >
              <span className="book-card__icon" aria-hidden="true">
                ＋
              </span>
              <span className="book-card__name">新建笔记本</span>
              <span className="book-card__meta">创建你自己的题库</span>
            </button>

            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
