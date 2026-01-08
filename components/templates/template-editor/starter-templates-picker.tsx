'use client'

import { STARTER_TEMPLATES, StarterTemplate } from '@/lib/starter-templates'
import { Sparkles } from 'lucide-react'

interface StarterTemplatesPickerProps {
  onSelect: (template: StarterTemplate) => void
  isVisible: boolean
}

export function StarterTemplatesPicker({ onSelect, isVisible }: StarterTemplatesPickerProps) {
  if (!isVisible) return null

  return (
    <div className="mb-6 p-4 border rounded-lg bg-muted/30">
      <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        Comienza con una plantilla
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Selecciona una plantilla base para personalizar o comienza desde cero
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STARTER_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="flex flex-col items-center p-4 border rounded-lg
                       bg-card hover:bg-accent hover:border-primary/30
                       transition-all text-center group"
          >
            <template.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
            <span className="text-sm font-medium">{template.nombre}</span>
            <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.descripcion}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
