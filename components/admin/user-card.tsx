'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, User } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'VENDEDOR' | 'ASISTENTE'
  createdAt: string
}

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  VENDEDOR: 'bg-blue-100 text-blue-800',
  ASISTENTE: 'bg-gray-100 text-gray-800',
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  ASISTENTE: 'Asistente',
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge className={roleColors[user.role] || ''}>
            {roleLabels[user.role] || user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(user)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(user.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

