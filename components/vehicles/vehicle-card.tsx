'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, FileText, Share2, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: string
  marca: string
  modelo: string
  ano: number
  precio: number
  kilometraje: number
  estado: string
  descripcion?: string
  imagen?: string
  imagenes?: string[]
}

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (id: string) => void
  onGenerateSocial?: (vehicleId: string) => void
  onManageDocuments?: (vehicleId: string) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DISPONIBLE: {
    label: 'Disponible',
    className: 'status-available'
  },
  RESERVADO: {
    label: 'Reservado',
    className: 'status-reserved'
  },
  VENDIDO: {
    label: 'Vendido',
    className: 'status-sold'
  },
  MANTENIMIENTO: {
    label: 'Mantenimiento',
    className: 'status-maintenance'
  },
}

export function VehicleCard({ vehicle, onEdit, onDelete, onGenerateSocial, onManageDocuments }: VehicleCardProps) {
  const router = useRouter()

  const getImageUrl = (image?: string) => {
    if (!image) return null
    if (image.startsWith('data:image')) return image
    if (image.startsWith('http')) return image
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${image}`
  }

  const mainImage = vehicle.imagenes && vehicle.imagenes.length > 0
    ? vehicle.imagenes[0]
    : vehicle.imagen

  const status = statusConfig[vehicle.estado] || { label: vehicle.estado, className: 'bg-muted text-muted-foreground' }

  return (
    <Card className="group overflow-hidden cursor-pointer" onClick={() => router.push(`/vehicles/${vehicle.id}`)}>
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {mainImage ? (
          <img
            src={getImageUrl(mainImage) || ''}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {console.log(status.className, status.label)}
        {/* Status Badge - positioned on image */}
        <Badge className={cn("absolute top-3 left-3 shadow-sm border", status.className)}>
          {status.label}
        </Badge>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {vehicle.marca} {vehicle.modelo}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.ano}</p>
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/vehicles/${vehicle.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {onManageDocuments && (
                <DropdownMenuItem onClick={() => onManageDocuments(vehicle.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Documentos
                </DropdownMenuItem>
              )}
              {onGenerateSocial && (
                <DropdownMenuItem onClick={() => onGenerateSocial(vehicle.id)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir en redes
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(vehicle.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Price & Mileage */}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-lg font-bold text-foreground">
            ${vehicle.precio.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            {vehicle.kilometraje.toLocaleString()} km
          </span>
        </div>

        {/* Description */}
        {vehicle.descripcion && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {vehicle.descripcion}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
