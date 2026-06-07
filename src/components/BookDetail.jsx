import { useEffect, useMemo, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import Uploader from './Uploader.jsx'
import BookEditor from './BookEditor.jsx'
import {
  getBook,
  addQuizToBook,
  updateQuizInBook,
  removeQuizFromBook,
  renameBook,
  setBookStyle,
  deleteBook,
} from '../quiz/books.js'
import { goLibrary, goPlay } from '../quiz/router.js'

// A single book: header + quiz list. User books can add/edit/delete quizzes and
// edit the book's name/icon/color; built-in books are read-only.
export default function BookDetail({
  bookId,
  editTarget,
  onConsumeEditTarget,
  onChange,
  theme,
  onToggleTheme,
}) {
  const [version, setVersion] = useState(0)
  const book = useMemo(() => getBook(bookId), [bookId, version])

  // adder UI: null | 'new' | quizId (editing an existing quiz)
  const [adder, setAdder] = useState(null)
  const [prefill, setPrefill] = useState('')
  const [editingBook, setEditingBook] = useState(false)

  // If we arrived here via the player's pencil, open the editor for that quiz.
  useEffect(() => {
    if (editTarget && editTarget.bookId === bookId) {
      setAdder(editTarget.quizId)
      setPrefill(editTarget.source)
      onConsumeEditTarget?.()
    }
  }, [editTarget, bookId, onConsumeEditTarget])

  const bump = () => {
    setVersion((v) => v + 1)
    onChange?.()
  }

  if (!book) {
    return (
      <div className="home">
        <p className="home__empty">笔记本不存在。</p>
        <button type="button" className="button button--secondary" onClick={goLibrary}>
          ← 返回笔记本
        </button>
      </div>
    )
  }

  const editable = !book.builtin

  const handleAdd = (_quiz, source) => {
    addQuizToBook(book.id, source)
    setAdder(null)
    setPrefill('')
    bump()
  }

  const handleUpdate = (quizId) => (_quiz, source) => {
    updateQuizInBook(book.id, quizId, source)
    setAdder(null)
    setPrefill('')
    bump()
  }

  const handleRemove = (quizId) => {
    if (confirm('确定删除这个测验？')) {
      removeQuizFromBook(book.id, quizId)
      bump()
    }
  }

  const startEdit = (entry) => {
    setAdder(entry.id)
    setPrefill(entry.source)
  }

  const handleDeleteBook = () => {
    if (confirm(`确定删除笔记本「${book.name}」及其中所有测验？`)) {
      deleteBook(book.id)
      onChange?.()
      goLibrary()
    }
  }

  const handleBookStyle = ({ name, icon, color }) => {
    renameBook(book.id, name)
    setBookStyle(book.id, { icon, color })
    setEditingBook(false)
    bump()
  }

  return (
    <div className="home">
      <div className="home__topbar">
        <button type="button" className="button button--secondary" onClick={goLibrary}>
          ← 笔记本
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {editingBook ? (
        <BookEditor
          title="编辑笔记本"
          submitLabel="保存"
          initial={{ name: book.name, icon: book.icon, color: book.color }}
          onSubmit={handleBookStyle}
          onCancel={() => setEditingBook(false)}
        />
      ) : (
        <header className={`book-detail__hero book--${book.color}`}>
          <span className="book-detail__icon" aria-hidden="true">
            {book.icon}
          </span>
          <div className="book-detail__heading">
            <h1 className="book-detail__title">{book.name}</h1>
            <p className="book-detail__meta">
              {book.quizzes.length} 个测验{book.builtin ? ' · 内置（只读）' : ''}
            </p>
          </div>
          {editable && (
            <div className="book-detail__tools">
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditingBook(true)}
                title="编辑笔记本"
                aria-label="编辑笔记本"
              >
                ✎
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={handleDeleteBook}
                title="删除笔记本"
                aria-label="删除笔记本"
              >
                🗑
              </button>
            </div>
          )}
        </header>
      )}

      <section className="home__section">
        {book.quizzes.length === 0 ? (
          <p className="home__empty">
            {editable ? '这个笔记本还没有测验，在下方添加一个。' : '这个笔记本暂无测验。'}
          </p>
        ) : (
          <div className="home__grid">
            {book.quizzes.map((entry) => (
              <div key={entry.id} className="quiz-card-wrap">
                <button
                  type="button"
                  className="quiz-card"
                  disabled={!!entry.error}
                  onClick={() => entry.quiz && goPlay(book.id, entry.id)}
                >
                  <span className="quiz-card__name">{entry.title}</span>
                  {entry.error ? (
                    <span className="quiz-card__error">解析失败：{entry.error}</span>
                  ) : (
                    <span className="quiz-card__meta">{entry.quiz.questions.length} 道题</span>
                  )}
                </button>
                {editable && (
                  <div className="quiz-card__tools">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => startEdit(entry)}
                      title="编辑"
                      aria-label="编辑测验"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleRemove(entry.id)}
                      title="删除"
                      aria-label="删除测验"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {editable && (
        <section className="home__section">
          {adder && adder !== 'new' ? (
            <>
              <h2 className="home__heading">编辑测验</h2>
              <Uploader
                onLoad={handleUpdate(adder)}
                initialText={prefill}
                submitLabel="保存修改"
              />
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setAdder(null)
                  setPrefill('')
                }}
              >
                取消
              </button>
            </>
          ) : adder === 'new' ? (
            <>
              <h2 className="home__heading">添加测验</h2>
              <Uploader onLoad={handleAdd} submitLabel="添加到笔记本" />
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setAdder(null)}
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setAdder('new')}
            >
              ＋ 添加测验
            </button>
          )}
        </section>
      )}
    </div>
  )
}
