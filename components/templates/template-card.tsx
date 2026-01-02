'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'

interface Template {
  id: string
  nombre: string
  contenido: string
  descripcion?: string
  activo: boolean
}

interface TemplateCardProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.nombre}</CardTitle>
            {template.descripcion && (
              <p className="text-sm text-muted-foreground mt-1">
                {template.descripcion}
              </p>
            )}
          </div>
          <Badge variant={template.activo ? 'default' : 'secondary'}>
            {template.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {template.contenido}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(template)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

