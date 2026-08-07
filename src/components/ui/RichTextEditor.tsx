import React, { useEffect, useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Image } from 'lucide-react'

export type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

function newClientId() {
  return Math.random().toString(36).substring(2, 9)
}

export function RichTextEditor({ label, value, onChange, onImageChange, minHeightClass = 'min-h-64' }: {
  label?: string
  value: string
  onChange: (value: string) => void
  onImageChange?: (value: string, pendingImage: PendingImage) => void
  minHeightClass?: string
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const selectionRef = useRef<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return
    const range = selection.getRangeAt(0)
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  const runCommand = (command: string) => {
    document.execCommand(command)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const insertHtml = (html: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    if (selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)) {
      selection?.removeAllRanges()
      selection?.addRange(selectionRef.current)
    }
    if (!document.execCommand('insertHTML', false, html)) {
      editor.insertAdjacentHTML('beforeend', html)
    }
    saveSelection()
  }

  const insertImage = (file: File) => {
    const pendingImage = {
      id: newClientId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }
    insertHtml(`<img src="${pendingImage.previewUrl}" data-pending-image-id="${pendingImage.id}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;" />`)
    if (onImageChange) {
      onImageChange(editorRef.current?.innerHTML || '', pendingImage)
    } else {
      onChange(editorRef.current?.innerHTML || '')
    }
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton title="Bold" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Bulleted list" onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
          {onImageChange && (
            <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-emerald-600" title="Upload image">
              <Image className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) insertImage(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          )}
        </div>
        <div
          ref={(node) => { editorRef.current = node }}
          contentEditable
          className={`${minHeightClass} px-4 py-3 text-sm leading-6 text-slate-900 outline-none [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6`}
          onInput={(event) => {
            saveSelection()
            onChange(event.currentTarget.innerHTML)
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onBlur={saveSelection}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}

function ToolbarButton({ title, onClick, children }: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-emerald-600" title={title}>
      {children}
    </button>
  )
}
