'use client'

import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useCursorInsert } from '@/hooks/use-cursor-insert'
import { TemplateToolbar } from './template-toolbar'
import { VariablePanel } from './variable-panel'
import { TemplatePreview } from './template-preview'

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TemplateEditor({ value, onChange, error }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const { insertAtCursor, setCursorPosition } = useCursorInsert(textareaRef)
  const [pendingCursorPosition, setPendingCursorPosition] = useState<number | null>(null)

  // Apply pending cursor position after value update
  useEffect(() => {
    if (pendingCursorPosition !== null) {
      setCursorPosition(pendingCursorPosition)
      setPendingCursorPosition(null)
    }
  }, [value, pendingCursorPosition, setCursorPosition])

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  // Generate highlighted HTML content
  const highlightedContent = useMemo(() => {
    // Escape HTML entities first
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Then highlight variables
    return escaped.replace(
      /\{\{([a-z_]+)\}\}/g,
      '<span class="template-variable">{{$1}}</span>'
    )
  }, [value])

  const handleInsertVariable = useCallback((variableKey: string) => {
    const variableText = `{{${variableKey}}}`
    const result = insertAtCursor(variableText)
    if (result) {
      onChange(result.newValue)
      setPendingCursorPosition(result.newCursorPosition)
    }
  }, [insertAtCursor, onChange])

  const handleClear = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el contenido?')) {
      onChange('')
      textareaRef.current?.focus()
    }
  }, [onChange])

  return (
    <div className="space-y-3">
      <TemplateToolbar
        onInsertVariable={handleInsertVariable}
        onClear={handleClear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Editor + Variable Panel */}
        <div className="space-y-3">
          {/* Editor with highlighting overlay */}
          <div className="template-editor-container">
            {/* Background highlighting layer */}
            <div
              ref={highlightRef}
              className="template-editor-highlight bg-background border border-transparent rounded-md"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightedContent + '\n' }}
            />

            {/* Actual textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              className="template-editor-textarea"
              placeholder="Escribe el contenido de tu plantilla aquí...

Tip: Usa el botón 'Insertar Variable' o haz clic en las variables de abajo para agregar datos dinámicos como {{cliente_nombre}} o {{vehiculo_marca}}."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Variable Panel */}
          <VariablePanel onInsertVariable={handleInsertVariable} />
        </div>

        {/* Right column: Preview */}
        <div className="lg:min-h-[400px]">
          <TemplatePreview content={value} />
        </div>
      </div>
    </div>
  )
}
