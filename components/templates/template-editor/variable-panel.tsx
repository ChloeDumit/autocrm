'use client'

import { TEMPLATE_VARIABLE_CATEGORIES } from '@/lib/template-variables'
import { VariableChip } from './variable-chip'
import { Code2 } from 'lucide-react'

interface VariablePanelProps {
  onInsertVariable: (variableKey: string) => void
}

export function VariablePanel({ onInsertVariable }: VariablePanelProps) {
  return (
    <div className="border rounded-md p-3 bg-card">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Code2 className="h-4 w-4" />
        Variables Disponibles
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Haz clic en una variable para insertarla en el editor
      </p>

      <div className="space-y-4">
        {TEMPLATE_VARIABLE_CATEGORIES.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-2">
              <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {category.variables.map((variable) => (
                <VariableChip
                  key={variable.key}
                  variable={variable}
                  onClick={() => onInsertVariable(variable.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
