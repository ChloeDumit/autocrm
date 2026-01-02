'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, FileText, CreditCard } from 'lucide-react'

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  documents: Array<{
    id: string
    nombre: string
    archivo: string
  }>
}

interface PaymentMethodCardProps {
  method: PaymentMethod
  onEdit: (method: PaymentMethod) => void
  onDelete: (id: string) => void
}

export function PaymentMethodCard({ method, onEdit, onDelete }: PaymentMethodCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{method.nombre}</CardTitle>
              {method.descripcion && (
                <p className="text-sm text-muted-foreground">{method.descripcion}</p>
              )}
            </div>
          </div>
          <Badge variant={method.activo ? 'default' : 'secondary'}>
            {method.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium">
            Documentos: {method.documents.length}
          </p>
          {method.documents.length > 0 && (
            <div className="space-y-1">
              {method.documents.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{doc.nombre}</span>
                </div>
              ))}
              {method.documents.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{method.documents.length - 3} más
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(method)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(method.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

