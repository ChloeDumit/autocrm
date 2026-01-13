'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  User,
  Car,
  Calendar,
  CreditCard,
  FolderOpen,
  Phone,
  Mail,
  MapPin,
  Gauge,
  Tag,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SaleDialog } from '@/components/sales/sale-dialog'
import { GenerateDocumentDialog } from '@/components/sales/generate-document-dialog'
import { SaleDocumentsDialog } from '@/components/sales/sale-documents-dialog'
import { SalePaymentMethodsDialog } from '@/components/sales/sale-payment-methods-dialog'
import Image from 'next/image'
import Link from 'next/link'

interface PaymentDocument {
  id: string
  nombre: string
  archivo: string
  descripcion?: string
}

interface PaymentMethod {
  id: string
  nombre: string
  documents?: PaymentDocument[]
}

interface SalePaymentMethod {
  id: string
  monto?: number
  notas?: string
  paymentMethod: PaymentMethod
}

interface SaleDocument {
  id: string
  nombre: string
  tipo: string
  categoria?: string
  archivo: string
  descripcion?: string
  contenido?: string
  mimetype?: string
  salePaymentMethodId?: string
  salePaymentMethod?: SalePaymentMethod
}

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
  paymentMethods?: SalePaymentMethod[]
  documents?: SaleDocument[]
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  INTERESADO: { label: 'Interesado', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  PRUEBA: { label: 'Prueba', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  NEGOCIACION: { label: 'Negociación', color: 'text-orange-700', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  VENDIDO: { label: 'Vendido', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  CANCELADO: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

const documentTypeLabels: Record<string, string> = {
  CONTRATO: 'Contrato',
  COMPROBANTE_PAGO: 'Comprobante',
  ENTREGA: 'Entrega',
  IDENTIFICACION: 'ID',
  OTRO: 'Otro',
}

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [saleDocumentsDialogOpen, setSaleDocumentsDialogOpen] = useState(false)
  const [paymentMethodsDialogOpen, setPaymentMethodsDialogOpen] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)

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

  const handleStageChange = async (newStage: string) => {
    if (!sale || sale.etapa === newStage || updatingStage) return

    // Confirmation for critical stages
    if (newStage === 'VENDIDO') {
      if (!confirm('¿Confirmas que la venta ha sido completada? Esto marcará el vehículo como vendido.')) return
    }
    if (newStage === 'CANCELADO') {
      if (!confirm('¿Estás seguro de cancelar esta venta?')) return
    }

    setUpdatingStage(true)
    try {
      await api.put(`/sales/${sale.id}`, { etapa: newStage })
      setSale({ ...sale, etapa: newStage })
      toast({
        title: 'Etapa actualizada',
        description: `La venta cambió a "${stageConfig[newStage]?.label || newStage}"`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar la etapa',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStage(false)
    }
  }

  const getImageUrl = (image?: string) => {
    if (!image || image.trim() === '') return null
    // Handle URLs and data URIs directly
    if (image.startsWith('http') || image.startsWith('data:')) return image
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    // Ensure proper path formatting
    const imagePath = image.startsWith('/') ? image : `/${image}`
    return `${baseUrl}${imagePath}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando venta...</p>
          </div>
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

  const stage = stageConfig[sale.etapa] || { label: sale.etapa, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  const totalPayments = sale.paymentMethods?.reduce((sum, pm) => sum + (pm.monto || 0), 0) || 0
  const finalPrice = sale.precioFinal || sale.vehicle.precio
  const hasDiscount = sale.precioFinal && sale.precioFinal < sale.vehicle.precio

  // Calculate pending required documents (compare with uploaded documents)
  const uploadedDocumentNames = new Set(
    sale.documents?.map(doc => doc.nombre.toLowerCase()) || []
  )

  const pendingDocuments = sale.paymentMethods?.flatMap(pm => {
    if (!pm.paymentMethod.documents || pm.paymentMethod.documents.length === 0) return []
    return pm.paymentMethod.documents
      .filter(doc => !uploadedDocumentNames.has(doc.nombre.toLowerCase()))
      .map(doc => ({
        paymentMethodName: pm.paymentMethod.nombre,
        documentName: doc.nombre,
        documentId: doc.id,
      }))
  }) || []
  const hasPendingDocuments = pendingDocuments.length > 0

  // Get all required documents for showing status
  const allRequiredDocuments = sale.paymentMethods?.flatMap(pm => {
    if (!pm.paymentMethod.documents || pm.paymentMethod.documents.length === 0) return []
    return pm.paymentMethod.documents.map(doc => ({
      paymentMethodName: pm.paymentMethod.nombre,
      documentName: doc.nombre,
      documentId: doc.id,
      isUploaded: uploadedDocumentNames.has(doc.nombre.toLowerCase()),
    }))
  }) || []

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/sales')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {sale.vehicle.marca} {sale.vehicle.modelo}
                </h1>
                {/* Stage Badge - Clickable dropdown when editable */}
                {sale.etapa !== 'VENDIDO' && sale.etapa !== 'CANCELADO' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${stage.bgColor} ${stage.color} hover:opacity-80 cursor-pointer`}
                        disabled={updatingStage}
                      >
                        {updatingStage ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        {stage.label}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO'] as const).map((stageKey) => {
                        const stageInfo = stageConfig[stageKey]
                        const isActive = sale.etapa === stageKey
                        return (
                          <DropdownMenuItem
                            key={stageKey}
                            onClick={() => handleStageChange(stageKey)}
                            disabled={isActive}
                            className={isActive ? 'bg-muted' : ''}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${stageInfo.bgColor}`} />
                            {stageInfo.label}
                            {isActive && <span className="text-xs text-muted-foreground ml-2">(actual)</span>}
                          </DropdownMenuItem>
                        )
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStageChange('CANCELADO')}
                        className="text-destructive focus:text-destructive"
                      >
                        <span className="w-2 h-2 rounded-full mr-2 bg-red-100" />
                        Cancelar venta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge className={`${stage.bgColor} ${stage.color} border-0`}>
                    {stage.label}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Venta para {sale.client.nombre} · Creada {formatDate(sale.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setDocumentDialogOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Generar Doc
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPaymentMethodsDialogOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Formas de Pago
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSaleDocumentsDialogOpen(true)}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Documentos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Venta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Required Documents Status Banner */}
        {allRequiredDocuments.length > 0 && (
          <div className={`rounded-lg p-4 border ${
            hasPendingDocuments
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                hasPendingDocuments
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'bg-green-100 dark:bg-green-900/50'
              }`}>
                {hasPendingDocuments ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${
                  hasPendingDocuments
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {hasPendingDocuments
                    ? `Documentos Pendientes (${pendingDocuments.length} de ${allRequiredDocuments.length})`
                    : 'Todos los Documentos Cargados'}
                </h3>
                <p className={`text-sm mt-1 ${
                  hasPendingDocuments
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  {hasPendingDocuments
                    ? 'Los siguientes documentos son requeridos para esta venta:'
                    : 'Todos los documentos requeridos han sido cargados correctamente.'}
                </p>
                <ul className="mt-3 space-y-2">
                  {allRequiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {doc.isUploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                      )}
                      <span className={doc.isUploaded ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300 font-medium'}>
                        {doc.documentName}
                      </span>
                      <span className="text-muted-foreground text-xs">({doc.paymentMethodName})</span>
                      {doc.isUploaded ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-400 bg-green-50">
                          Cargado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-400 bg-amber-50">
                          Pendiente
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {hasPendingDocuments && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => setSaleDocumentsDialogOpen(true)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Subir Documentos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Summary Card */}
            <Card className={sale.etapa === 'VENDIDO' ? 'border-green-200 dark:border-green-800' : ''}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {sale.etapa === 'VENDIDO' ? 'Precio de Venta' : 'Precio Acordado'}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold">
                        ${finalPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${sale.vehicle.precio.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-green-600 mt-1">
                        Descuento: ${(sale.vehicle.precio - sale.precioFinal!).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {sale.etapa === 'VENDIDO' && sale.paymentMethods && sale.paymentMethods.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Pagado</p>
                      <span className="text-2xl font-bold text-green-600">
                        ${totalPayments.toLocaleString()}
                      </span>
                      {totalPayments < finalPrice && (
                        <p className="text-sm text-amber-600 mt-1">
                          Pendiente: ${(finalPrice - totalPayments).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Card */}
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {vehicleImages.length > 0 && (() => {
                    const vehicleImageUrl = getImageUrl(vehicleImages[0])
                    if (!vehicleImageUrl) return null
                    // Use regular img for data URIs, Next.js Image for URLs
                    if (vehicleImageUrl.startsWith('data:')) {
                      return (
                        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                          <img
                            src={vehicleImageUrl}
                            alt={`${sale.vehicle.marca} ${sale.vehicle.modelo}`}
                            className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                          />
                        </div>
                      )
                    }
                    return (
                      <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                        <Image
                          src={vehicleImageUrl}
                          alt={`${sale.vehicle.marca} ${sale.vehicle.modelo}`}
                          fill
                          className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-car.png'
                          }}
                        />
                      </div>
                    )
                  })()}
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                          <Car className="h-4 w-4" />
                          Vehículo
                        </div>
                        <h3 className="text-xl font-semibold">
                          {sale.vehicle.marca} {sale.vehicle.modelo}
                        </h3>
                      </div>
                      <Link href={`/vehicles/${sale.vehicle.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Año</p>
                          <p className="font-medium">{sale.vehicle.ano}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Kilometraje</p>
                          <p className="font-medium">{sale.vehicle.kilometraje.toLocaleString()} km</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Precio Lista</p>
                          <p className="font-medium">${sale.vehicle.precio.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <User className="h-4 w-4" />
                    Cliente
                  </div>
                  <Link href="/clients">
                    <Button variant="ghost" size="sm">
                      Ver <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <h3 className="text-xl font-semibold mb-4">{sale.client.nombre}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{sale.client.telefono}</p>
                    </div>
                  </div>

                  {sale.client.email && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{sale.client.email}</p>
                      </div>
                    </div>
                  )}

                  {sale.client.direccion && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p className="font-medium truncate">{sale.client.direccion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {sale.notas && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Notas</p>
                  <p className="whitespace-pre-wrap">{sale.notas}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Seller & Timeline */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendedor</p>
                  <p className="font-medium">{sale.vendedor.name}</p>
                  <p className="text-sm text-muted-foreground">{sale.vendedor.email}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Creada</p>
                      <p className="text-sm">{formatDateTime(sale.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Actualizada</p>
                      <p className="text-sm">{formatDateTime(sale.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Formas de Pago</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPaymentMethodsDialogOpen(true)}>
                    {sale.paymentMethods && sale.paymentMethods.length > 0 ? 'Editar' : 'Agregar'}
                  </Button>
                </div>

                {sale.paymentMethods && sale.paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {sale.paymentMethods.map((pm) => {
                      const hasRequiredDocs = pm.paymentMethod.documents && pm.paymentMethod.documents.length > 0
                      return (
                        <div key={pm.id} className="space-y-2">
                          <div className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{pm.paymentMethod.nombre}</p>
                                {hasRequiredDocs && (
                                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {pm.paymentMethod.documents!.length} req.
                                  </Badge>
                                )}
                              </div>
                              {pm.notas && (
                                <p className="text-xs text-muted-foreground mt-1">{pm.notas}</p>
                              )}
                            </div>
                            {pm.monto && (
                              <span className="font-semibold">${pm.monto.toLocaleString()}</span>
                            )}
                          </div>
                          {hasRequiredDocs && (
                            <div className="ml-3 space-y-1">
                              {pm.paymentMethod.documents!.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-2 text-xs text-amber-700">
                                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-2 w-2" />
                                  </div>
                                  <span className="truncate">{doc.nombre}</span>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                                    Requerido
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <Separator />
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-lg">${totalPayments.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay formas de pago registradas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Documentos</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSaleDocumentsDialogOpen(true)}>
                    {sale.documents && sale.documents.length > 0 ? 'Ver todos' : 'Agregar'}
                  </Button>
                </div>

                {sale.documents && sale.documents.length > 0 ? (
                  <div className="space-y-2">
                    {sale.documents.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.nombre}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {documentTypeLabels[doc.tipo] || doc.tipo}
                            </span>
                            {doc.salePaymentMethod && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">
                                  {doc.salePaymentMethod.paymentMethod.nombre}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sale.documents.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setSaleDocumentsDialogOpen(true)}
                      >
                        Ver {sale.documents.length - 3} más
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay documentos adjuntos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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

      <SalePaymentMethodsDialog
        open={paymentMethodsDialogOpen}
        onClose={() => {
          setPaymentMethodsDialogOpen(false)
          fetchSale()
        }}
        saleId={sale.id}
      />

      <SaleDocumentsDialog
        open={saleDocumentsDialogOpen}
        onClose={() => {
          setSaleDocumentsDialogOpen(false)
          fetchSale()
        }}
        saleId={sale.id}
      />
    </MainLayout>
  )
}
