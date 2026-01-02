'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { ArrowLeft, Edit, Trash2, FileText, Share2, Calendar, DollarSign, User, ShoppingCart } from 'lucide-react'
import { VehicleDocumentsDialog } from '@/components/vehicles/vehicle-documents-dialog'
import { SocialMediaDialog } from '@/components/vehicles/social-media-dialog'
import { VehicleDialog } from '@/components/vehicles/vehicle-dialog'
import { SaleDialog } from '@/components/sales/sale-dialog'
import { ImageCarousel } from '@/components/vehicles/image-carousel'

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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)

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

  const statusColors: Record<string, string> = {
    DISPONIBLE: 'bg-green-100 text-green-800',
    RESERVADO: 'bg-yellow-100 text-yellow-800',
    VENDIDO: 'bg-gray-100 text-gray-800',
    MANTENIMIENTO: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
    MANTENIMIENTO: 'En Mantenimiento',
  }


  const getDocumentUrl = async (doc: VehicleDocument) => {
    // Si tiene contenido base64, usar endpoint de la API con token
    if ((doc as any).contenido) {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      return `${baseUrl}/api/files/vehicle-document/${doc.id}?token=${token}`
    }
    // Si no, usar la URL del archivo
    if (doc.archivo.startsWith('http')) return doc.archivo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${doc.archivo}`
  }

  const handleViewDocument = async (doc: VehicleDocument) => {
    const url = await getDocumentUrl(doc)
    // Crear un iframe temporal para mostrar el documento con autenticación
    const token = localStorage.getItem('token')
    if ((doc as any).contenido && token) {
      // Para documentos con contenido base64, usar fetch con token
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/vehicles')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
              </h1>
              <p className="text-muted-foreground">Detalles del vehículo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSaleDialogOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Crear Venta
            </Button>
            <Button
              variant="outline"
              onClick={() => setDocumentsDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Documentos ({documents.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setSocialDialogOpen(true)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imágenes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageCarousel
                  images={allImages}
                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Información */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge className={statusColors[vehicle.estado] || ''}>
                    {statusLabels[vehicle.estado] || vehicle.estado}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio</span>
                  <span className="font-semibold text-lg">
                    ${vehicle.precio.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kilometraje</span>
                  <span className="font-medium">
                    {vehicle.kilometraje.toLocaleString()} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Año</span>
                  <span className="font-medium">{vehicle.ano}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Marca</span>
                  <span className="font-medium">{vehicle.marca}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modelo</span>
                  <span className="font-medium">{vehicle.modelo}</span>
                </div>
              </CardContent>
            </Card>

            {vehicle.descripcion && (
              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{vehicle.descripcion}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Creado por</span>
                  <span className="font-medium">{vehicle.createdBy.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fecha de creación</span>
                  <span className="font-medium">
                    {new Date(vehicle.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Propiedades */}
        {properties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((prop) => (
                  <div key={prop.id} className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      {prop.field.nombre}
                    </div>
                    <div className="text-base">
                      {prop.field.tipo === 'DATE' && prop.valor
                        ? new Date(prop.valor).toLocaleDateString('es-ES')
                        : prop.field.tipo === 'BOOLEAN'
                        ? prop.valor === 'true'
                          ? 'Sí'
                          : prop.valor === 'false'
                          ? 'No'
                          : prop.valor
                        : prop.valor}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos Asociados</CardTitle>
              <CardDescription>
                {documents.length} documento(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                        {doc.fechaVencimiento && (
                          <p className="text-xs text-muted-foreground">
                            Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                    >
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VehicleDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          fetchVehicle()
        }}
        vehicle={vehicle}
      />

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

      <SaleDialog
        open={saleDialogOpen}
        onClose={() => {
          setSaleDialogOpen(false)
          fetchVehicle()
        }}
        initialVehicleId={vehicle.id}
      />
    </MainLayout>
  )
}

