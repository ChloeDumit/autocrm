'use client'

import { TemplateVariable } from '@/lib/template-variables'

interface VariableChipProps {
  variable: TemplateVariable
  onClick: () => void
}

export function VariableChip({ variable, onClick }: VariableChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
                 bg-primary/10 text-primary border border-primary/20 rounded-full
                 hover:bg-primary/20 hover:border-primary/30
                 transition-colors cursor-pointer"
      title={`Insertar {{${variable.key}}} - Ejemplo: ${variable.exampleValue}`}
    >
      {variable.label}
    </button>
  )
}
