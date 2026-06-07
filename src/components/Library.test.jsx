// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Library from './Library.jsx'
import BookDetail from './BookDetail.jsx'
import { createBook, addQuizToBook, loadUserBooks } from '../quiz/books.js'

const QUIZ_MD = `---
title: 冒泡排序
---
## Q
- [x] 对
- [ ] 错
`

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})
afterEach(cleanup)

describe('Library', () => {
  it('creates a user notebook from the editor and navigates to it', () => {
    render(<Library theme="light" onToggleTheme={() => {}} />)
    fireEvent.click(screen.getByText('新建笔记本'))
    fireEvent.change(screen.getByPlaceholderText(/例如/), { target: { value: '我的题库' } })
    fireEvent.click(screen.getByText('创建'))

    const books = loadUserBooks()
    expect(books).toHaveLength(1)
    expect(books[0].name).toBe('我的题库')
    expect(window.location.hash).toContain('book=')
  })
})

describe('BookDetail', () => {
  it('lists quizzes in a user book and opens one on click', () => {
    const book = createBook({ name: '题库' })
    addQuizToBook(book.id, QUIZ_MD)

    render(<BookDetail bookId={book.id} theme="light" onToggleTheme={() => {}} />)
    const card = screen.getByText('冒泡排序')
    expect(card).toBeTruthy()
    fireEvent.click(card)
    expect(window.location.hash).toContain('play=')
  })

  it('shows a read-only message for an empty built-in-like state', () => {
    const book = createBook({ name: '空本' })
    render(<BookDetail bookId={book.id} theme="light" onToggleTheme={() => {}} />)
    expect(screen.getByText(/还没有测验/)).toBeTruthy()
  })
})
