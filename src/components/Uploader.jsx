import { useEffect, useRef, useState } from 'react'
import { parseQuiz } from '../quiz/parseQuiz.js'

// Lets the user load an ad-hoc quiz at runtime: drag a .md file, pick one, or
// paste markdown text. On success it hands the parsed quiz + its source to
// `onLoad(quiz, source)`. `initialText` prefills the editor (e.g. from "edit").
export default function Uploader({ onLoad, initialText = '', submitLabel = '生成测验' }) {
  const [text, setText] = useState(initialText)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  // Keep the textarea in sync when an external prefill arrives (edit flow).
  useEffect(() => {
    if (initialText) setText(initialText)
  }, [initialText])

  const tryLoad = (source) => {
    try {
      onLoad(parseQuiz(source), source)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const readFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const source = String(reader.result)
      setText(source)
      tryLoad(source)
    }
    reader.readAsText(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    readFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="uploader">
      <div
        className={`uploader__drop${dragging ? ' uploader__drop--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
      >
        <p className="uploader__hint">拖拽 .md 文件到此处，或点击选择文件</p>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt"
          hidden
          onChange={(e) => readFile(e.target.files?.[0])}
        />
      </div>

      <p className="uploader__or">或粘贴 Markdown 文本：</p>
      <textarea
        className="uploader__textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'---\ntitle: 我的测验\n---\n\n## 第一题...\n- [x] 正确选项\n- [ ] 错误选项'}
        rows={8}
      />

      {error && <p className="uploader__error">{error}</p>}

      <button
        type="button"
        className="button button--primary"
        onClick={() => tryLoad(text)}
        disabled={!text.trim()}
      >
        {submitLabel}
      </button>
    </div>
  )
}
