'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, FileText, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  etapa: string
  precioFinal?: number
  notas?: string
  vehicle: {
    marca: string
    modelo: string
    ano: number
    precio: number
  }
  client: {
    nombre: string
    telefono: string
  }
  vendedor: {
    name: string
  }
}

interface SaleCardProps {
  sale: Sale
  onEdit: (sale: Sale) => void
  onDelete: (id: string) => void
  onGenerateDocument?: (sale: Sale) => void
}

const stageColors: Record<string, string> = {
  INTERESADO: 'bg-blue-100 text-blue-800',
  PRUEBA: 'bg-yellow-100 text-yellow-800',
  NEGOCIACION: 'bg-orange-100 text-orange-800',
  VENDIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

const stageLabels: Record<string, string> = {
  INTERESADO: 'Interesado',
  PRUEBA: 'Prueba',
  NEGOCIACION: 'Negociación',
  VENDIDO: 'Vendido',
  CANCELADO: 'Cancelado',
}

export function SaleCard({ sale, onEdit, onDelete, onGenerateDocument }: SaleCardProps) {
  const router = useRouter()
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">
                {sale.vehicle.marca} {sale.vehicle.modelo} ({sale.vehicle.ano})
              </h3>
              <Badge className={stageColors[sale.etapa] || ''}>
                {stageLabels[sale.etapa] || sale.etapa}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Cliente:</span> {sale.client.nombre}
              </p>
              <p>
                <span className="font-medium">Vendedor:</span> {sale.vendedor.name}
              </p>
              <p>
                <span className="font-medium">Precio:</span> ${sale.vehicle.precio.toLocaleString()}
                {sale.precioFinal && sale.precioFinal !== sale.vehicle.precio && (
                  <span className="ml-2">
                    → ${sale.precioFinal.toLocaleString()}
                  </span>
                )}
              </p>
              {sale.notas && (
                <p className="mt-2">{sale.notas}</p>
              )}
            </div>
          </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/sales/${sale.id}`)}
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {onGenerateDocument && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGenerateDocument(sale)}
                    title="Generar documento"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                    size="sm"
                  onClick={() => onEdit(sale)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(sale.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
        </div>
      </CardContent>
    </Card>
  )
}

