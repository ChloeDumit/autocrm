'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { ArrowLeft, Edit, Trash2, FileText, User, Car, DollarSign, Calendar } from 'lucide-react'
import { SaleDialog } from '@/components/sales/sale-dialog'
import { GenerateDocumentDialog } from '@/components/sales/generate-document-dialog'
import Image from 'next/image'

interface Sale {
  id: string
  etapa: string
  precioFinal?: number
  notas?: string
  createdAt: string
  updatedAt: string
  vehicle: {
    id: string
    marca: string
    modelo: string
    ano: number
    precio: number
    kilometraje: number
    imagen?: string
    imagenes?: string[]
  }
  client: {
    id: string
    nombre: string
    email?: string
    telefono: string
    direccion?: string
  }
  vendedor: {
    id: string
    name: string
    email: string
  }
}

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchSale()
    }
  }, [params.id])

  const fetchSale = async () => {
    try {
      const res = await api.get(`/sales/${params.id}`)
      setSale(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar la venta',
        variant: 'destructive',
      })
      router.push('/sales')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return

    try {
      await api.delete(`/sales/${params.id}`)
      toast({
        title: 'Éxito',
        description: 'Venta eliminada correctamente',
      })
      router.push('/sales')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar venta',
        variant: 'destructive',
      })
    }
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

  const getImageUrl = (image?: string) => {
    if (!image) return null
    if (image.startsWith('http')) return image
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${image}`
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

  if (!sale) {
    return null
  }

  const vehicleImages = sale.vehicle.imagenes && sale.vehicle.imagenes.length > 0
    ? sale.vehicle.imagenes
    : (sale.vehicle.imagen ? [sale.vehicle.imagen] : [])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/sales')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Venta #{sale.id.slice(-8)}</h1>
              <p className="text-muted-foreground">Detalles de la venta</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDocumentDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar Documento
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
          {/* Información de la Venta */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Etapa</span>
                  <Badge className={stageColors[sale.etapa] || ''}>
                    {stageLabels[sale.etapa] || sale.etapa}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio del Vehículo</span>
                  <span className="font-semibold text-lg">
                    ${sale.vehicle.precio.toLocaleString()}
                  </span>
                </div>
                {sale.precioFinal && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio Final</span>
                    <span className="font-semibold text-xl text-green-600">
                      ${sale.precioFinal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fecha de Creación</span>
                  <span className="font-medium">
                    {new Date(sale.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Última Actualización</span>
                  <span className="font-medium">
                    {new Date(sale.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {sale.notas && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Notas</span>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                      {sale.notas}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {vehicleImages.length > 0 && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border flex-shrink-0">
                      <Image
                        src={getImageUrl(vehicleImages[0]) || '/placeholder-car.png'}
                        alt={`${sale.vehicle.marca} ${sale.vehicle.modelo}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-car.png'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {sale.vehicle.marca} {sale.vehicle.modelo} ({sale.vehicle.ano})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Precio: </span>
                        <span className="font-medium">${sale.vehicle.precio.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kilometraje: </span>
                        <span className="font-medium">{sale.vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vehicles/${sale.vehicle.id}`)}
                    >
                      Ver Detalles del Vehículo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Nombre: </span>
                  <span className="font-semibold text-lg">{sale.client.nombre}</span>
                </div>
                {sale.client.email && (
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{sale.client.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Teléfono: </span>
                  <span className="font-medium">{sale.client.telefono}</span>
                </div>
                {sale.client.direccion && (
                  <div>
                    <span className="text-muted-foreground">Dirección: </span>
                    <span className="font-medium">{sale.client.direccion}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/clients`)}
                >
                  Ver Cliente
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-muted-foreground text-sm">Nombre: </span>
                  <span className="font-medium">{sale.vendedor.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Email: </span>
                  <span className="font-medium">{sale.vendedor.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio Base</span>
                  <span className="font-medium">${sale.vehicle.precio.toLocaleString()}</span>
                </div>
                {sale.precioFinal && (
                  <>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Precio Final</span>
                        <span className="font-bold text-lg text-green-600">
                          ${sale.precioFinal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {sale.precioFinal < sale.vehicle.precio && (
                      <div className="text-sm text-muted-foreground">
                        Descuento: ${(sale.vehicle.precio - sale.precioFinal).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SaleDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          fetchSale()
        }}
        sale={sale}
      />

      <GenerateDocumentDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        sale={sale}
      />
    </MainLayout>
  )
}

