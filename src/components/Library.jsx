import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import BookCard from './BookCard.jsx'
import BookEditor from './BookEditor.jsx'
import GlobalImportModal from './GlobalImportModal.jsx'
import { listBooks, createBook, addQuizToBook } from '../quiz/books.js'
import { goBook, goSrs, goStats, goPlay, goFavorites, goWrongBook, goOrganizeWrong } from '../quiz/router.js'
import { countDue } from '../quiz/srs.js'
import { countFavorites } from '../quiz/favorites.js'
import { countWrongQuestions } from '../quiz/wrongBook.js'
import { exportAllData, importAllData } from '../quiz/dataIO.js'
import { usePwaInstall } from '../hooks/usePwaInstall.js'

// Landing page: notebook (book) grid, matching the NotebookLM-style layout.
// Built-in books come from /content folders; user books live in localStorage.

function filterBooks(books, query) {
  if (!query) return books
  const q = query.toLowerCase().trim()
  return books.filter((b) => b.name.toLowerCase().includes(q))
}

function searchQuestions(books, query, limit = 30) {
  if (!query) return []
  const q = query.toLowerCase().trim()
  const hits = []
  for (const book of books) {
    for (const entry of book.quizzes ?? []) {
      if (!entry.quiz) continue
      for (const question of entry.quiz.questions) {
        if (question.prompt.toLowerCase().includes(q)) {
          hits.push({ book, entry, question })
          if (hits.length >= limit) return hits
        }
      }
    }
  }
  return hits
}

function highlightText(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="search-highlight">{part}</span>
    ) : (
      part
    ),
  )
}
export default function Library({ theme, onToggleTheme, onBooksChange }) {
  const [creating, setCreating] = useState(false)
  const [showGlobalImport, setShowGlobalImport] = useState(false)
  const [importSuccess, setImportSuccess] = useState(null)
  // Local version bump so a newly created book shows immediately.
  const [version, setVersion] = useState(0)
  const books = useMemo(() => listBooks(), [version])
  const [dueCount, setDueCount] = useState(0)
  const [favCount, setFavCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [query, setQuery] = useState('')
  const filteredBooks = useMemo(() => filterBooks(books, query), [books, query])
  const questionHits = useMemo(() => searchQuestions(books, query), [books, query])
  const { canInstall, promptInstall } = usePwaInstall()

  useEffect(() => {
    // countDue() scans all books — run asynchronously to avoid blocking paint.
    const id = requestAnimationFrame(() => {
      try { 
        setDueCount(countDue())
        setFavCount(countFavorites())
        setWrongCount(countWrongQuestions())
      } catch { /* best-effort */ }
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

  const handleGlobalImport = ({ isNew, bookId, newBookName, quiz, source }) => {
    let targetBookId = bookId
    if (isNew) {
      const book = createBook({ name: newBookName || quiz.title })
      targetBookId = book.id
    }
    const entry = addQuizToBook(targetBookId, source)
    
    setShowGlobalImport(false)
    setImportSuccess({ bookId: targetBookId, quizId: entry.id, title: quiz.title })
    setVersion((v) => v + 1)
    onBooksChange?.()
  }

  const handleExport = () => {
    const dataStr = exportAllData()
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quizforge-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const oldWrongCount = countWrongQuestions()
        if (importAllData(text)) {
          const addedWrongs = countWrongQuestions() - oldWrongCount
          if (addedWrongs > 0) {
            if (window.confirm(`导入成功！发现 ${addedWrongs} 道新错题，是否立即去整理？`)) {
              window.location.hash = '#organizeWrong'
            }
          } else {
            alert('导入成功，即将刷新页面应用更改。')
          }
          window.location.reload()
        } else {
          alert('导入失败：找不到有效的备份数据。')
        }
      } catch (err) {
        alert('读取文件失败。')
      }
    }
    input.click()
  }

  return (
    <div className="home">
      <div className="home__topbar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="button button--primary" onClick={() => { setShowGlobalImport(true); setImportSuccess(null); }} style={{ height: '36px', padding: '0 12px' }}>
            导入测验
          </button>
          <button type="button" className="button button--secondary" onClick={handleImport} style={{ height: '36px', padding: '0 12px' }}>
            导入备份
          </button>
          <button type="button" className="button button--secondary" onClick={handleExport} style={{ height: '36px', padding: '0 12px' }}>
            导出备份
          </button>
        </div>
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
            onClick={goFavorites}
            disabled={favCount === 0}
          >
            ★ 收藏题目 ({favCount})
          </button>
          <button
            type="button"
            className="button button--secondary home__stats-btn"
            onClick={goWrongBook}
            disabled={wrongCount === 0}
          >
            ❌ 错题本 ({wrongCount})
          </button>
          <button
            type="button"
            className="button button--secondary home__stats-btn"
            onClick={goOrganizeWrong}
            disabled={wrongCount === 0}
          >
            🧹 整理错题
          </button>
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

        <div className="home__search">
          <input
            type="text"
            className="search-bar"
            placeholder="搜索笔记本或题目…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
            }}
          />
          {query && (
            <button className="search-clear icon-button" onClick={() => setQuery('')} aria-label="清除搜索">
              ×
            </button>
          )}
        </div>
      </header>

      <section className="home__section">
        {query ? (
          <div className="search-results">
            <h2 className="home__heading">匹配的笔记本 ({filteredBooks.length})</h2>
            {filteredBooks.length > 0 && (
              <div className="home__grid">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            <h2 className="home__heading" style={{ marginTop: 'var(--space-xl)' }}>匹配的题目 ({questionHits.length})</h2>
            {questionHits.length > 0 && (
              <ul className="search-hits">
                {questionHits.map((hit, i) => (
                  <li key={i} className="search-hit" onClick={() => goPlay(hit.book.id, hit.entry.id)}>
                    <div className="search-hit__source">
                      <span aria-hidden="true">{hit.book.icon}</span> {hit.book.name} / {hit.entry.title}
                    </div>
                    <div className="search-hit__prompt">
                      {highlightText(hit.question.prompt, query)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {filteredBooks.length === 0 && questionHits.length === 0 && (
              <p className="home__empty stats-empty">没有找到匹配的内容。</p>
            )}
          </div>
        ) : (
          <>
            <h2 className="home__heading">我的笔记本</h2>
            {importSuccess && (
              <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span>成功导入测验：<strong>{importSuccess.title}</strong></span>
                <button type="button" className="button button--primary" onClick={() => goPlay(importSuccess.bookId, importSuccess.quizId)}>前往查看</button>
              </div>
            )}
            {showGlobalImport ? (
              <GlobalImportModal 
                userBooks={books.filter(b => !b.builtin)} 
                onImport={handleGlobalImport}
                onCancel={() => setShowGlobalImport(false)}
              />
            ) : creating ? (
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
          </>
        )}
      </section>
    </div>
  )
}
