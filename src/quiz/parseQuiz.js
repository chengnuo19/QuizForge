// Parse a QuizForge markdown string into a structured quiz model.
//
// Format (see README.md):
//   ---
//   title: ...
//   sources: 5        (optional)
//   ---
//   ## question prompt (may contain $latex$)
//   - [ ] option text
//     indented explanation for that option
//   - [x] correct option text
//     indented explanation
//   > Explain: optional whole-question explanation
//
// Returns: { title, sources, questions: [
//   { prompt, explain, options: [ { label, text, explanation, correct } ] }
// ] }
//
// Throws Error with a human-readable message on malformed input.

const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Strip a leading "A." / "A、" / "A)" / "A）" the author may have typed by hand,
// since labels are assigned automatically by order.
const MANUAL_LABEL_RE = /^[A-Za-z][.、)）]\s+/

function parseFrontMatter(text) {
  const meta = {}
  const match = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta, body: text.replace(/^﻿/, '') }
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    // Drop inline "# comment" and surrounding quotes.
    value = value.replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '').trim()
    meta[key] = value
  }
  return { meta, body: text.slice(match[0].length) }
}

function finalizeQuestion(q, index) {
  if (q.options.length === 0) {
    throw new Error(`第 ${index} 题没有任何选项（需要至少一个 "- [ ]" 选项）。`)
  }
  const correctCount = q.options.filter((o) => o.correct).length
  if (correctCount === 0) {
    throw new Error(`第 ${index} 题没有标记正确答案（请用 "- [x]" 标记选项）。`)
  }
  // More than one [x] makes this a multiple-answer question.
  q.multi = correctCount > 1
  q.prompt = q.prompt.trim()
  q.explain = q.explain.trim() || undefined
  for (const o of q.options) {
    o.text = o.text.trim()
    o.explanation = o.explanation.trim() || undefined
  }
  return q
}

export function parseQuiz(source) {
  if (typeof source !== 'string' || source.trim() === '') {
    throw new Error('内容为空，请提供 Markdown 测验文本。')
  }

  const { meta, body } = parseFrontMatter(source)
  const lines = body.split(/\r?\n/)

  const questions = []
  let current = null // current question
  let lastOption = null // current option (for explanation continuation)
  let inFence = false // inside a ``` / ~~~ fenced code block

  const pushQuestion = () => {
    if (current) questions.push(finalizeQuestion(current, questions.length + 1))
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    const trimmed = line.trim()

    // Inside a fenced code block, take lines verbatim — never treat "##" or
    // "- [ ]" inside code as quiz structure. Strip up to 2 leading spaces (the
    // explanation indent) while keeping deeper code indentation.
    const isFence = /^(```|~~~)/.test(trimmed)
    if (current && (inFence || isFence)) {
      const content = rawLine.replace(/^ {0,2}/, '')
      if (lastOption) {
        lastOption.explanation += (lastOption.explanation ? '\n' : '') + content
      } else {
        current.prompt += '\n' + content
      }
      if (isFence) inFence = !inFence
      continue
    }

    // New question heading: "## ..." (not "### ...")
    const heading = line.match(/^##\s+(.*)$/)
    if (heading) {
      pushQuestion()
      current = { prompt: heading[1], explain: '', options: [] }
      lastOption = null
      continue
    }

    if (!current) continue // skip anything before the first question

    // Option: "- [ ] text" or "- [x] text"
    const option = trimmed.match(/^[-*]\s*\[( |x|X)\]\s*(.*)$/)
    if (option) {
      const label = OPTION_LABELS[current.options.length] ?? '?'
      const text = option[2].replace(MANUAL_LABEL_RE, '')
      lastOption = {
        label,
        text,
        explanation: '',
        correct: option[1].toLowerCase() === 'x',
      }
      current.options.push(lastOption)
      continue
    }

    // Whole-question explanation: "> Explain: ..." or following "> ..." lines
    const quote = trimmed.match(/^>\s?(.*)$/)
    if (quote) {
      const content = quote[1].replace(/^Explain[:：]\s*/i, '')
      current.explain += (current.explain ? '\n' : '') + content
      lastOption = null // explanation block ends option continuation
      continue
    }

    if (trimmed === '') continue

    // Indented continuation line → belongs to the last option's explanation,
    // otherwise it continues the question prompt.
    const indented = /^\s+/.test(rawLine)
    if (indented && lastOption) {
      lastOption.explanation += (lastOption.explanation ? '\n' : '') + trimmed
    } else if (!indented && current.options.length === 0) {
      current.prompt += '\n' + trimmed
    } else if (lastOption) {
      lastOption.explanation += (lastOption.explanation ? '\n' : '') + trimmed
    }
  }
  pushQuestion()

  if (questions.length === 0) {
    throw new Error('没有找到任何题目（题目以 "## " 开头）。')
  }

  const sources = meta.sources != null && meta.sources !== '' ? Number(meta.sources) : undefined
  const truthy = (v) => ['true', '1', 'yes', 'on'].includes(String(v).toLowerCase())
  const shuffle = truthy(meta.shuffle)
  // Options shuffle defaults to the question-shuffle setting; can be turned off explicitly.
  const shuffleOptions = meta.shuffleOptions != null ? truthy(meta.shuffleOptions) : shuffle

  return {
    title: meta.title || '未命名测验',
    sources: Number.isFinite(sources) ? sources : undefined,
    shuffle,
    shuffleOptions,
    questions,
  }
}

export default parseQuiz
