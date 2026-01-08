'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TEMPLATE_VARIABLE_CATEGORIES } from '@/lib/template-variables'
import { Plus, Trash2 } from 'lucide-react'

interface TemplateToolbarProps {
  onInsertVariable: (variableKey: string) => void
  onClear: () => void
}

export function TemplateToolbar({ onInsertVariable, onClear }: TemplateToolbarProps) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b mb-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Insertar Variable
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {TEMPLATE_VARIABLE_CATEGORIES.map((category, index) => (
            <div key={category.id}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                {category.label}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {category.variables.map((variable) => (
                  <DropdownMenuItem
                    key={variable.key}
                    onClick={() => onInsertVariable(variable.key)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{variable.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {variable.exampleValue}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Limpiar
      </Button>
    </div>
  )
}
