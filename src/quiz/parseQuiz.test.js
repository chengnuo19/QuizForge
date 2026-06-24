import { describe, it, expect } from 'vitest'
import { parseQuiz } from './parseQuiz.js'

const HAPPY = `---
title: 排序算法测验
sources: 5
---

## 哪个排序在最坏情况下仍为 $O(n \\log_2 n)$ 且不稳定？

- [ ] 归并排序
  归并排序最坏 $O(n\\log_2 n)$，但稳定。
- [ ] 冒泡排序
  冒泡排序最坏 $O(n^2)$。
- [x] 堆排序
  堆排序均为 $O(n\\log_2 n)$，不稳定。

> Explain: 堆排序的交换是跨距离的。

## 第二题没有详解也可以

- [x] 对
- [ ] 错
`

describe('parseQuiz', () => {
  it('parses metadata, questions, options and explanations', () => {
    const quiz = parseQuiz(HAPPY)
    expect(quiz.title).toBe('排序算法测验')
    expect(quiz.sources).toBe(5)
    expect(quiz.questions).toHaveLength(2)

    const q1 = quiz.questions[0]
    expect(q1.options).toHaveLength(3)
    expect(q1.options.map((o) => o.label)).toEqual(['A', 'B', 'C'])
    expect(q1.options[2].correct).toBe(true)
    expect(q1.options[0].correct).toBe(false)
    expect(q1.options[0].explanation).toContain('归并排序最坏')
    expect(q1.explain).toBe('堆排序的交换是跨距离的。')

    const q2 = quiz.questions[1]
    expect(q2.options[0].correct).toBe(true)
    expect(q2.explain).toBeUndefined()
  })

  it('strips a manually typed "A." prefix from option text', () => {
    const quiz = parseQuiz(`## Q\n- [x] A. 第一项\n- [ ] B. 第二项\n`)
    expect(quiz.questions[0].options[0].text).toBe('第一项')
    expect(quiz.questions[0].options[1].text).toBe('第二项')
  })

  it('defaults the title when no front matter is given', () => {
    const quiz = parseQuiz(`## Q\n- [x] yes\n- [ ] no\n`)
    expect(quiz.title).toBe('未命名测验')
    expect(quiz.sources).toBeUndefined()
  })

  it('throws on empty input', () => {
    expect(() => parseQuiz('')).toThrow()
    expect(() => parseQuiz('   ')).toThrow()
  })

  it('throws when there are no questions', () => {
    expect(() => parseQuiz('just some text\n- [x] not under a heading')).toThrow(/题目/)
  })

  it('throws when a question has no correct answer', () => {
    expect(() => parseQuiz('## Q\n- [ ] a\n- [ ] b\n')).toThrow(/正确答案/)
  })

  it('marks a question with multiple correct answers as multi-select', () => {
    const quiz = parseQuiz('## Q\n- [x] a\n- [x] b\n- [ ] c\n')
    expect(quiz.questions[0].multi).toBe(true)
    expect(quiz.questions[0].options.filter((o) => o.correct)).toHaveLength(2)
  })

  it('marks a single-answer question as not multi', () => {
    const quiz = parseQuiz('## Q\n- [x] a\n- [ ] b\n')
    expect(quiz.questions[0].multi).toBe(false)
  })

  it('ignores headings that have no options (treating them as section headings)', () => {
    const quiz = parseQuiz('## Q\n\n## Q2\n- [x] a\n')
    expect(quiz.questions).toHaveLength(1)
    expect(quiz.questions[0].prompt).toBe('Q2')
  })

  it('does not treat "##" or "- [ ]" inside a fenced code block as structure', () => {
    const md = [
      '## 真正的题目',
      '- [x] 正确',
      '  解释里有代码：',
      '  ```md',
      '  ## 这不是新题目',
      '  - [ ] 这也不是选项',
      '  ```',
      '- [ ] 错误',
    ].join('\n')
    const quiz = parseQuiz(md)
    expect(quiz.questions).toHaveLength(1)
    expect(quiz.questions[0].options).toHaveLength(2)
    expect(quiz.questions[0].options[0].explanation).toContain('## 这不是新题目')
    expect(quiz.questions[0].options[0].explanation).toContain('```md')
  })

  it('keeps image markdown in prompts', () => {
    const quiz = parseQuiz('## 看图 ![x](a.png)\n- [x] a\n- [ ] b\n')
    expect(quiz.questions[0].prompt).toContain('![x](a.png)')
  })
})
