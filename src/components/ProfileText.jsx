import { Fragment, useRef } from 'react'

export function ProfileTextEditor({ label, value, onChange, rows = 4 }) {
  const textareaRef = useRef(null)

  const makeSelectionBold = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const updated = `${value.slice(0, start)}**${selected}**${value.slice(end)}`
    onChange(updated)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 2, start + 2 + selected.length)
    })
  }

  return <div className="profile-rich-editor">
    <div className="profile-rich-toolbar">
      <button type="button" aria-label={`Bold selected text in ${label}`} title="Bold selected text" onMouseDown={event => event.preventDefault()} onClick={makeSelectionBold}><b>B</b></button>
      <span>Use Enter for a new line. Select text, then press B for bold.</span>
    </div>
    <textarea ref={textareaRef} rows={rows} value={value} onChange={event => onChange(event.target.value)} aria-label={label}/>
  </div>
}

export function ProfileText({ children }) {
  const lines = String(children ?? '').split(/\r?\n/)
  return <>{lines.map((line, lineIndex) => <Fragment key={lineIndex}>{line.split(/(\*\*.+?\*\*)/g).map((part, partIndex) => part.startsWith('**') && part.endsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part)}{lineIndex < lines.length - 1 && <br/>}</Fragment>)}</>
}