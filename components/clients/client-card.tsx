'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'

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
    <Card className="group">
      <CardContent className="p-4">
        {/* Header with avatar and menu */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>

          {/* Name and contact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {client.nombre}
                </h3>
                {client.interes && (
                  <p className="text-sm text-primary font-medium truncate">
                    {client.interes}
                  </p>
                )}
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(client.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="mt-4 space-y-2">
          <a
            href={`tel:${client.telefono}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{client.telefono}</span>
          </a>

          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{client.email}</span>
            </a>
          )}

          {client.direccion && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.direccion}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {client.notas && (
          <p className="mt-3 pt-3 border-t text-sm text-muted-foreground line-clamp-2">
            {client.notas}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
