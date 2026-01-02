'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Share2, FileText, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

const statusColors: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-800',
  RESERVADO: 'bg-yellow-100 text-yellow-800',
  VENDIDO: 'bg-gray-100 text-gray-800',
  MANTENIMIENTO: 'bg-red-100 text-red-800',
}

export function VehicleCard({ vehicle, onEdit, onDelete, onGenerateSocial, onManageDocuments }: VehicleCardProps) {
  const router = useRouter()
  
  const getImageUrl = (image?: string) => {
    if (!image) return null
    // Si es base64, retornarlo directamente
    if (image.startsWith('data:image')) {
      return image
    }
    // Si es una URL completa
    if (image.startsWith('http')) return image
    // Si es una ruta relativa, construir la URL completa
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${image}`
  }

  const mainImage = vehicle.imagenes && vehicle.imagenes.length > 0 
    ? vehicle.imagenes[0] 
    : vehicle.imagen

  return (
    <Card>
      {mainImage && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src={getImageUrl(mainImage) || ''}
            alt={`${vehicle.marca} ${vehicle.modelo}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {vehicle.marca} {vehicle.modelo}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Año {vehicle.ano}</p>
          </div>
          <Badge className={statusColors[vehicle.estado] || ''}>
            {vehicle.estado}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Precio:</span>
            <span className="font-semibold">${vehicle.precio.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kilometraje:</span>
            <span>{vehicle.kilometraje.toLocaleString()} km</span>
          </div>
          {vehicle.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {vehicle.descripcion}
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/vehicles/${vehicle.id}`)}
            title="Ver detalles"
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
          {onManageDocuments && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageDocuments(vehicle.id)}
              title="Gestionar documentos"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          {onGenerateSocial && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateSocial(vehicle.id)}
              title="Generar publicación para redes sociales"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(vehicle)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(vehicle.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

