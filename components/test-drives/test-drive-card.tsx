'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface TestDrive {
  id: string
  fecha: string
  hora: string
  estado: string
  notas?: string
  vehicleId: string
  clientId: string
  vehicle: {
    marca: string
    modelo: string
  }
  client: {
    nombre: string
    telefono: string
  }
  vendedor: {
    name: string
  }
}

interface TestDriveCardProps {
  testDrive: TestDrive
  onEdit: (testDrive: TestDrive) => void
  onDelete: (id: string) => void
}

const statusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

export function TestDriveCard({ testDrive, onEdit, onDelete }: TestDriveCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">
                {testDrive.vehicle.marca} {testDrive.vehicle.modelo}
              </h3>
              <Badge className={statusColors[testDrive.estado] || ''}>
                {testDrive.estado}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Cliente:</span> {testDrive.client.nombre} ({testDrive.client.telefono})
              </p>
              <p>
                <span className="font-medium">Fecha:</span> {format(new Date(testDrive.fecha), 'dd/MM/yyyy')} a las {testDrive.hora}
              </p>
              <p>
                <span className="font-medium">Vendedor:</span> {testDrive.vendedor.name}
              </p>
              {testDrive.notas && (
                <p className="mt-2">{testDrive.notas}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(testDrive)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(testDrive.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

