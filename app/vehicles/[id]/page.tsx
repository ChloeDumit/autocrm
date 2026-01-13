'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { ArrowLeft, Edit, Trash2, FileText, Share2, MoreHorizontal, ShoppingCart, Gauge, Calendar, User, Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { VehicleDocumentsDialog } from '@/components/vehicles/vehicle-documents-dialog'
import { SocialMediaDialog } from '@/components/vehicles/social-media-dialog'
import { ImageCarousel } from '@/components/vehicles/image-carousel'
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
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
}

interface VehicleDocument {
  id: string
  nombre: string
  tipo: string
  archivo: string
  descripcion?: string
  fechaVencimiento?: string
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [documents, setDocuments] = useState<VehicleDocument[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchVehicle()
      fetchDocuments()
      fetchProperties()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchVehicle = async () => {
    try {
      const res = await api.get(`/vehicles/${params.id}`)
      setVehicle(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el vehículo',
        variant: 'destructive',
      })
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/vehicle-documents/vehicle/${params.id}`)
      setDocuments(res.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await api.get(`/vehicle-properties/vehicle/${params.id}`)
      setProperties(res.data)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return

    try {
      await api.delete(`/vehicles/${params.id}`)
      toast({
        title: 'Éxito',
        description: 'Vehículo eliminado correctamente',
      })
      router.push('/vehicles')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar vehículo',
        variant: 'destructive',
      })
    }
  }

  const statusConfig: Record<string, { className: string; label: string }> = {
    DISPONIBLE: { className: 'status-available', label: 'Disponible' },
    RESERVADO: { className: 'status-reserved', label: 'Reservado' },
    VENDIDO: { className: 'status-sold', label: 'Vendido' },
    MANTENIMIENTO: { className: 'status-maintenance', label: 'En Mantenimiento' },
  }

  const getDocumentUrl = async (doc: VehicleDocument) => {
    if ((doc as any).contenido) {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      return `${baseUrl}/api/files/vehicle-document/${doc.id}?token=${token}`
    }
    if (doc.archivo.startsWith('http')) return doc.archivo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${doc.archivo}`
  }

  const handleViewDocument = async (doc: VehicleDocument) => {
    const url = await getDocumentUrl(doc)
    const token = localStorage.getItem('token')
    if ((doc as any).contenido && token) {
      try {
        const response = await api.get(`/files/vehicle-document/${doc.id}`, {
          responseType: 'blob',
        })
        const blob = new Blob([response.data], { type: (doc as any).mimetype || 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al abrir el documento',
          variant: 'destructive',
        })
      }
    } else {
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando vehículo...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!vehicle) {
    return null
  }

  const allImages = vehicle.imagenes && vehicle.imagenes.length > 0
    ? vehicle.imagenes
    : (vehicle.imagen ? [vehicle.imagen] : [])

  const status = statusConfig[vehicle.estado] || { className: '', label: vehicle.estado }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/vehicles')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  {vehicle.marca} {vehicle.modelo}
                </h1>
                <Badge className={cn("status-badge", status.className)}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{vehicle.ano}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/sales/new?vehicleId=${vehicle.id}`)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Crear Venta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDocumentsDialogOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Documentos ({documents.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSocialDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Images */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <ImageCarousel
                  images={allImages}
                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Key Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Precio</p>
                <p className="text-3xl font-bold text-primary">
                  ${vehicle.precio.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Specs */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Gauge className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kilometraje</p>
                    <p className="font-medium">{vehicle.kilometraje.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Año</p>
                    <p className="font-medium">{vehicle.ano}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marca / Modelo</p>
                    <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Registrado por</p>
                    <p className="font-medium">{vehicle.createdBy.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(vehicle.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {vehicle.descripcion && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {vehicle.descripcion}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Additional Properties */}
        {properties.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">{prop.field.nombre}</p>
                      <p className="font-medium">
                        {prop.field.tipo === 'DATE' && prop.valor
                          ? new Date(prop.valor).toLocaleDateString('es-ES')
                          : prop.field.tipo === 'BOOLEAN'
                          ? prop.valor === 'true'
                            ? 'Sí'
                            : prop.valor === 'false'
                            ? 'No'
                            : prop.valor
                          : prop.valor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleViewDocument(doc)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.nombre}</p>
                      <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                      {doc.fechaVencimiento && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VehicleDocumentsDialog
        open={documentsDialogOpen}
        onClose={() => {
          setDocumentsDialogOpen(false)
          fetchDocuments()
        }}
        vehicleId={vehicle.id}
      />

      <SocialMediaDialog
        open={socialDialogOpen}
        onClose={() => setSocialDialogOpen(false)}
        vehicleId={vehicle.id}
      />
    </MainLayout>
  )
}
