'use client'

import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { useCursorInsert } from '@/hooks/use-cursor-insert'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TEMPLATE_VARIABLE_CATEGORIES, TemplateVariable, replaceVariablesWithExamples } from '@/lib/template-variables'
import { Eye, PenLine, Trash2 } from 'lucide-react'

interface TemplateEditorFullProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TemplateEditorFull({ value, onChange, error }: TemplateEditorFullProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const { insertAtCursor, setCursorPosition } = useCursorInsert(textareaRef)
  const [pendingCursorPosition, setPendingCursorPosition] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('editor')

  useEffect(() => {
    if (pendingCursorPosition !== null) {
      setCursorPosition(pendingCursorPosition)
      setPendingCursorPosition(null)
    }
  }, [value, pendingCursorPosition, setCursorPosition])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const highlightedContent = useMemo(() => {
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return escaped.replace(
      /\{\{([a-z_]+)\}\}/g,
      '<span class="template-variable">{{$1}}</span>'
    )
  }, [value])

  const previewContent = useMemo(() => {
    return replaceVariablesWithExamples(value)
  }, [value])

  const handleInsertVariable = useCallback((variable: TemplateVariable) => {
    const variableText = `{{${variable.key}}}`
    const result = insertAtCursor(variableText)
    if (result) {
      onChange(result.newValue)
      setPendingCursorPosition(result.newCursorPosition)
    }
    setActiveTab('editor')
  }, [insertAtCursor, onChange])

  const handleClear = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el contenido?')) {
      onChange('')
      textareaRef.current?.focus()
    }
  }, [onChange])

  return (
    <div className="flex gap-4">
      {/* Variables Panel - Left Side */}
      <div className="w-56 flex-shrink-0">
        <div className="sticky top-6 space-y-3">
          <p className="text-xs font-medium text-muted-foreground px-1">
            Clic para insertar variable
          </p>
          {TEMPLATE_VARIABLE_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{category.label}</span>
              </div>
              <div className="space-y-1">
                {category.variables.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => handleInsertVariable(variable)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-sm
                               bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/30
                               rounded-md transition-all cursor-pointer text-left"
                  >
                    <span>{variable.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor & Preview - Right Side */}
      <div className="flex-1 min-w-0">
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 pt-4">
              <TabsList>
                <TabsTrigger value="editor" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Vista Previa
                </TabsTrigger>
              </TabsList>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            <CardContent className="pt-4">
              <TabsContent value="editor" className="mt-0">
                <div className="template-editor-container">
                  <div
                    ref={highlightRef}
                    className="template-editor-highlight bg-background border border-transparent rounded-md"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlightedContent + '\n' }}
                  />
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    className="template-editor-textarea min-h-[500px]"
                    placeholder="Escribe el contenido de tu plantilla aquí...

Haz clic en las variables de la izquierda para insertarlas automáticamente."
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="border rounded-md bg-muted/20 p-6 min-h-[500px]">
                  {previewContent ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {previewContent}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                      <Eye className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">La vista previa aparecerá aquí</p>
                      <p className="text-xs mt-1">Escribe contenido en el editor para ver el resultado</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
