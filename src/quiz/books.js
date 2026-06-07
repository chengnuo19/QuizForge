// Book (notebook) model — the single source of truth for grouping quizzes.
//
// Hybrid model:
//   - Built-in books come from /content/<folder>/*.md (read-only, shipped in repo).
//   - User books are created in-browser and persisted in localStorage.
//
// A book:  { id, name, icon, color, builtin, quizzes: [...] }
// A quiz:  { id, title, source, quiz?, error? }   (quiz/error from parseQuiz)

import { parseQuiz } from './parseQuiz.js'

// Fixed palettes so books get a stable, pleasant look without a color picker
// dependency. `color` is a key mapped to a CSS class (.book--<color>).
export const BOOK_COLORS = ['sand', 'sage', 'sky', 'rose', 'lilac', 'amber']
export const BOOK_ICONS = ['📘', '📗', '📙', '📕', '📓', '📔', '🧮', '🔬', '🧠', '⚛️', '🌐', '🔢']

// Deterministic default style from a string (folder name) or index.
function defaultStyle(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return {
    icon: BOOK_ICONS[h % BOOK_ICONS.length],
    color: BOOK_COLORS[h % BOOK_COLORS.length],
  }
}

// ---------- Built-in books (from /content) ----------

// Eagerly import every markdown file under /content (any depth) as raw text.
const modules = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Pure grouping logic, separated so it can be unit-tested without Vite's glob.
// `entries` is a map of { '/content/<folder>/<file>.md': rawSource }.
export function groupBuiltin(entries) {
  const byFolder = new Map()
  for (const [path, source] of Object.entries(entries)) {
    const rel = path.replace(/^\/content\//, '')
    const segments = rel.split('/')
    const folder = segments.length > 1 ? segments[0] : '示例'
    const file = segments[segments.length - 1].replace(/\.md$/, '')
    if (!byFolder.has(folder)) byFolder.set(folder, [])
    let quiz
    let error
    try {
      quiz = parseQuiz(source)
    } catch (err) {
      error = err.message
    }
    byFolder.get(folder).push({
      id: path,
      title: quiz ? quiz.title : file,
      source,
      quiz,
      error,
    })
  }

  return [...byFolder.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([folder, quizzes]) => ({
      id: `builtin:${folder}`,
      name: folder,
      builtin: true,
      ...defaultStyle(folder),
      quizzes: quizzes.sort((a, b) => a.title.localeCompare(b.title)),
    }))
}

export function loadBuiltinBooks() {
  return groupBuiltin(modules)
}

// ---------- User books (localStorage) ----------

const BOOKS_KEY = 'quizforge:books'

function uid() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function loadUserBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveUserBooks(books) {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
  } catch {
    /* storage unavailable / quota — best-effort */
  }
}

// Re-parse a stored user quiz's source so callers get the same shape as built-in
// quizzes ({ quiz } or { error }).
function hydrateUserBook(book) {
  return {
    ...book,
    builtin: false,
    quizzes: (book.quizzes || []).map((q) => {
      try {
        return { ...q, quiz: parseQuiz(q.source), error: undefined }
      } catch (err) {
        return { ...q, quiz: undefined, error: err.message }
      }
    }),
  }
}

export function createBook({ name, icon, color } = {}) {
  const books = loadUserBooks()
  const style = defaultStyle(name || uid())
  const book = {
    id: uid(),
    name: (name || '未命名笔记本').trim(),
    icon: icon || style.icon,
    color: color || style.color,
    quizzes: [],
  }
  books.push(book)
  saveUserBooks(books)
  return hydrateUserBook(book)
}

export function renameBook(id, name) {
  const books = loadUserBooks()
  const b = books.find((x) => x.id === id)
  if (b) {
    b.name = (name || b.name).trim()
    saveUserBooks(books)
  }
}

export function setBookStyle(id, { icon, color }) {
  const books = loadUserBooks()
  const b = books.find((x) => x.id === id)
  if (b) {
    if (icon) b.icon = icon
    if (color) b.color = color
    saveUserBooks(books)
  }
}

export function deleteBook(id) {
  saveUserBooks(loadUserBooks().filter((x) => x.id !== id))
}

// Add a quiz to a user book from raw markdown. Throws if the markdown is invalid
// (so the caller can show a parse error), otherwise stores the source + title.
export function addQuizToBook(bookId, source) {
  const quiz = parseQuiz(source) // throws on invalid markdown
  const books = loadUserBooks()
  const b = books.find((x) => x.id === bookId)
  if (!b) throw new Error('笔记本不存在。')
  const entry = { id: uid(), title: quiz.title, source }
  b.quizzes = b.quizzes || []
  b.quizzes.push(entry)
  saveUserBooks(books)
  return entry
}

export function updateQuizInBook(bookId, quizId, source) {
  const quiz = parseQuiz(source) // throws on invalid markdown
  const books = loadUserBooks()
  const b = books.find((x) => x.id === bookId)
  if (!b) throw new Error('笔记本不存在。')
  const q = (b.quizzes || []).find((x) => x.id === quizId)
  if (!q) throw new Error('测验不存在。')
  q.title = quiz.title
  q.source = source
  saveUserBooks(books)
}

export function removeQuizFromBook(bookId, quizId) {
  const books = loadUserBooks()
  const b = books.find((x) => x.id === bookId)
  if (!b) return
  b.quizzes = (b.quizzes || []).filter((x) => x.id !== quizId)
  saveUserBooks(books)
}

// ---------- Merged access ----------

// All books, built-in first then user books (hydrated).
export function listBooks() {
  return [...loadBuiltinBooks(), ...loadUserBooks().map(hydrateUserBook)]
}

export function getBook(id) {
  return listBooks().find((b) => b.id === id) || null
}
