'use client'

import { useMemo } from 'react'
import { replaceVariablesWithExamples } from '@/lib/template-variables'
import { Eye } from 'lucide-react'

interface TemplatePreviewProps {
  content: string
}

export function TemplatePreview({ content }: TemplatePreviewProps) {
  const previewContent = useMemo(() => {
    return replaceVariablesWithExamples(content)
  }, [content])

  return (
    <div className="border rounded-md bg-muted/30 h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Vista Previa
        </span>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {previewContent ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
            {previewContent}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
            El contenido aparecerá aquí...
          </div>
        )}
      </div>
    </div>
  )
}
