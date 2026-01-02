'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Phone, Mail } from 'lucide-react'

interface Client {
  id: string
  nombre: string
  email?: string
  telefono: string
  direccion?: string
  interes?: string
  notas?: string
}

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{client.nombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{client.telefono}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          {client.interes && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Interés: </span>
              {client.interes}
            </div>
          )}
          {client.notas && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {client.notas}
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(client)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(client.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

