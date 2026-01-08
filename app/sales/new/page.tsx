'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchSelect } from '@/components/ui/search-select'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { ArrowLeft, Car, User, DollarSign, Save, Loader2, CreditCard, Plus, X, FileText, Eye, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

const saleSchema = z.object({
  vehicleId: z.string().min(1, 'El vehículo es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  etapa: z.enum(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']),
  precioFinal: z.number().positive().optional(),
  notas: z.string().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

interface Vehicle {
  id: string
  marca: string
  modelo: string
  ano: number
  precio: number
  kilometraje: number
  imagen?: string
  imagenes?: string[]
}

interface Client {
  id: string
  nombre: string
  email?: string
  telefono: string
  direccion?: string
}

interface PaymentDocument {
  id: string
  nombre: string
  archivo: string
  contenido?: string
  mimetype?: string
  descripcion?: string
}

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
  documents?: PaymentDocument[]
}

interface SelectedPaymentMethod {
  paymentMethodId: string
  monto: number
  notas: string
}

const stageConfig = {
  INTERESADO: { label: 'Interesado', description: 'El cliente mostró interés en el vehículo' },
  PRUEBA: { label: 'Prueba', description: 'Se programó o realizó una prueba de manejo' },
  NEGOCIACION: { label: 'Negociación', description: 'En proceso de negociación del precio' },
  VENDIDO: { label: 'Vendido', description: 'La venta se concretó exitosamente' },
  CANCELADO: { label: 'Cancelado', description: 'La venta fue cancelada' },
}

export default function NewSalePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const initialVehicleId = searchParams.get('vehicleId') || ''
  const initialClientId = searchParams.get('clientId') || ''

  const [loading, setLoading] = useState(false)
  const [vehicleSearchResults, setVehicleSearchResults] = useState<Vehicle[]>([])
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false)
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Payment methods
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<SelectedPaymentMethod[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      vehicleId: initialVehicleId,
      clientId: initialClientId,
      etapa: 'INTERESADO',
      precioFinal: undefined,
      notas: '',
    },
  })

  const watchedVehicleId = watch('vehicleId')
  const watchedClientId = watch('clientId')
  const watchedEtapa = watch('etapa')

  useEffect(() => {
    searchVehicles('')
    searchClients('')
    fetchPaymentMethods()

    if (initialVehicleId) {
      fetchVehicleById(initialVehicleId)
    }
    if (initialClientId) {
      fetchClientById(initialClientId)
    }
  }, [initialVehicleId, initialClientId])

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/payment-methods', { params: { activo: true } })
      setAvailablePaymentMethods(res.data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  useEffect(() => {
    if (watchedVehicleId) {
      const vehicle = vehicleSearchResults.find(v => v.id === watchedVehicleId)
      setSelectedVehicle(vehicle || null)
    } else {
      setSelectedVehicle(null)
    }
  }, [watchedVehicleId, vehicleSearchResults])

  useEffect(() => {
    if (watchedClientId) {
      const client = clientSearchResults.find(c => c.id === watchedClientId)
      setSelectedClient(client || null)
    } else {
      setSelectedClient(null)
    }
  }, [watchedClientId, clientSearchResults])

  const searchVehicles = useCallback(async (search: string) => {
    setVehicleSearchLoading(true)
    try {
      const params: any = { estado: 'DISPONIBLE' }
      if (search) {
        params.search = search
      }
      const res = await api.get('/vehicles', { params })
      setVehicleSearchResults(res.data)
    } catch (error) {
      console.error('Error searching vehicles:', error)
      setVehicleSearchResults([])
    } finally {
      setVehicleSearchLoading(false)
    }
  }, [])

  const searchClients = useCallback(async (search: string) => {
    setClientSearchLoading(true)
    try {
      const params: any = {}
      if (search) {
        params.search = search
      }
      const res = await api.get('/clients', { params })
      setClientSearchResults(res.data)
    } catch (error) {
      console.error('Error searching clients:', error)
      setClientSearchResults([])
    } finally {
      setClientSearchLoading(false)
    }
  }, [])

  const fetchVehicleById = async (id: string) => {
    try {
      const res = await api.get(`/vehicles/${id}`)
      setVehicleSearchResults((prev) => {
        if (!prev.find((v) => v.id === id)) {
          return [res.data, ...prev]
        }
        return prev
      })
      setSelectedVehicle(res.data)
    } catch (error) {
      console.error('Error fetching vehicle:', error)
    }
  }

  const fetchClientById = async (id: string) => {
    try {
      const res = await api.get(`/clients/${id}`)
      setClientSearchResults((prev) => {
        if (!prev.find((c) => c.id === id)) {
          return [res.data, ...prev]
        }
        return prev
      })
      setSelectedClient(res.data)
    } catch (error) {
      console.error('Error fetching client:', error)
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

  const addPaymentMethod = (paymentMethodId: string) => {
    if (selectedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId)) {
      return // Already added
    }
    setSelectedPaymentMethods([...selectedPaymentMethods, { paymentMethodId, monto: 0, notas: '' }])
  }

  const removePaymentMethod = (paymentMethodId: string) => {
    setSelectedPaymentMethods(selectedPaymentMethods.filter(pm => pm.paymentMethodId !== paymentMethodId))
  }

  const updatePaymentMethod = (paymentMethodId: string, field: 'monto' | 'notas', value: number | string) => {
    setSelectedPaymentMethods(selectedPaymentMethods.map(pm =>
      pm.paymentMethodId === paymentMethodId ? { ...pm, [field]: value } : pm
    ))
  }

  const handleViewDocument = async (doc: PaymentDocument) => {
    try {
      const response = await api.get(`/files/payment-document/${doc.id}`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: doc.mimetype || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al abrir el documento',
        variant: 'destructive',
      })
    }
  }

  const getPaymentMethodById = (id: string) => {
    return availablePaymentMethods.find(pm => pm.id === id)
  }

  const getTotalPaymentAmount = () => {
    return selectedPaymentMethods.reduce((sum, pm) => sum + (pm.monto || 0), 0)
  }

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true)
    try {
      const res = await api.post('/sales', data)
      const saleId = res.data.id

      // Add payment methods if stage is VENDIDO
      if (data.etapa === 'VENDIDO' && selectedPaymentMethods.length > 0) {
        for (const pm of selectedPaymentMethods) {
          await api.post('/sale-payment-methods', {
            saleId,
            paymentMethodId: pm.paymentMethodId,
            monto: pm.monto || undefined,
            notas: pm.notas || undefined,
          })
        }
      }

      toast({
        title: 'Venta creada',
        description: 'La venta se creó correctamente',
      })
      router.push(`/sales/${saleId}`)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al crear la venta')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/sales')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Venta</h1>
            <p className="text-muted-foreground">Crea una nueva venta en el pipeline</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehículo
                </CardTitle>
                <CardDescription>
                  Selecciona el vehículo para esta venta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SearchSelect
                  label="Buscar vehículo *"
                  placeholder="Buscar por marca o modelo..."
                  value={watchedVehicleId}
                  onValueChange={(value) => setValue('vehicleId', value)}
                  items={vehicleSearchResults.map((vehicle) => ({
                    id: vehicle.id,
                    label: `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano})`,
                  }))}
                  onSearch={searchVehicles}
                  loading={vehicleSearchLoading}
                  error={errors.vehicleId?.message}
                />

                {selectedVehicle && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                    <div className="flex gap-4">
                      {(() => {
                        const vehicleImageUrl = getImageUrl(selectedVehicle.imagenes?.[0] || selectedVehicle.imagen)
                        if (!vehicleImageUrl) return null
                        // Use regular img for data URIs, Next.js Image for URLs
                        if (vehicleImageUrl.startsWith('data:')) {
                          return (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                              <img
                                src={vehicleImageUrl}
                                alt={`${selectedVehicle.marca} ${selectedVehicle.modelo}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )
                        }
                        return (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                            <Image
                              src={vehicleImageUrl}
                              alt={`${selectedVehicle.marca} ${selectedVehicle.modelo}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">
                          {selectedVehicle.marca} {selectedVehicle.modelo}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Año: {selectedVehicle.ano}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedVehicle.kilometraje.toLocaleString()} km
                        </p>
                        <p className="text-lg font-bold text-primary mt-1">
                          ${selectedVehicle.precio.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
                <CardDescription>
                  Selecciona el cliente interesado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SearchSelect
                  label="Buscar cliente *"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={watchedClientId}
                  onValueChange={(value) => setValue('clientId', value)}
                  items={clientSearchResults.map((client) => ({
                    id: client.id,
                    label: `${client.nombre}${client.telefono ? ` - ${client.telefono}` : ''}`,
                  }))}
                  onSearch={searchClients}
                  loading={clientSearchLoading}
                  error={errors.clientId?.message}
                />

                {selectedClient && (
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-semibold">{selectedClient.nombre}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Tel: {selectedClient.telefono}</p>
                      {selectedClient.email && <p>Email: {selectedClient.email}</p>}
                      {selectedClient.direccion && <p>Dir: {selectedClient.direccion}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sale Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Detalles de la Venta
              </CardTitle>
              <CardDescription>
                Configura la etapa y precio de la venta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="etapa">Etapa *</Label>
                  <Select
                    value={watchedEtapa}
                    onValueChange={(value) => setValue('etapa', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {stageConfig[watchedEtapa as keyof typeof stageConfig]?.description}
                  </p>
                  {errors.etapa && (
                    <p className="text-sm text-red-500">{errors.etapa.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioFinal">Precio Final</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="precioFinal"
                      type="number"
                      step="0.01"
                      className="pl-7"
                      placeholder={selectedVehicle ? selectedVehicle.precio.toString() : '0'}
                      {...register('precioFinal', { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deja vacío para usar el precio del vehículo
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  {...register('notas')}
                  placeholder="Notas adicionales sobre la venta, preferencias del cliente, observaciones..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods - Only show when status is VENDIDO */}
          {watchedEtapa === 'VENDIDO' && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Formas de Pago
                </CardTitle>
                <CardDescription>
                  Registra las formas de pago utilizadas en esta venta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Payment Method */}
                <div className="space-y-2">
                  <Label>Agregar forma de pago</Label>
                  <div className="flex flex-wrap gap-2">
                    {availablePaymentMethods
                      .filter(pm => !selectedPaymentMethods.find(spm => spm.paymentMethodId === pm.id))
                      .map((pm) => (
                        <Button
                          key={pm.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPaymentMethod(pm.id)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          {pm.nombre}
                          {pm.documents && pm.documents.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {pm.documents.length} doc{pm.documents.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    {availablePaymentMethods.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay formas de pago configuradas
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Payment Methods */}
                {selectedPaymentMethods.length > 0 && (
                  <div className="space-y-3">
                    <Label>Formas de pago seleccionadas</Label>
                    {selectedPaymentMethods.map((spm) => {
                      const paymentMethod = getPaymentMethodById(spm.paymentMethodId)
                      if (!paymentMethod) return null
                      const hasDocuments = paymentMethod.documents && paymentMethod.documents.length > 0

                      return (
                        <div key={spm.paymentMethodId} className="border rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{paymentMethod.nombre}</span>
                                {hasDocuments && (
                                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {paymentMethod.documents!.length} doc. requerido{paymentMethod.documents!.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePaymentMethod(spm.paymentMethodId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Monto</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7 h-9"
                                    value={spm.monto || ''}
                                    onChange={(e) => updatePaymentMethod(spm.paymentMethodId, 'monto', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Notas</Label>
                                <Input
                                  className="h-9"
                                  placeholder="Ej: Cuotas, banco, etc."
                                  value={spm.notas}
                                  onChange={(e) => updatePaymentMethod(spm.paymentMethodId, 'notas', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Required Documents Section */}
                          {hasDocuments && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800 px-4 py-3">
                              <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                  Documentos Requeridos
                                </p>
                                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                                  {paymentMethod.documents!.length} pendiente{paymentMethod.documents!.length > 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                                Los siguientes documentos deben ser completados y firmados por el cliente para esta forma de pago:
                              </p>
                              <div className="space-y-2">
                                {paymentMethod.documents!.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-700"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-amber-400 flex items-center justify-center">
                                        <FileText className="h-3 w-3 text-amber-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{doc.nombre}</p>
                                        {doc.descripcion && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {doc.descripcion}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                                        Requerido
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewDocument(doc)}
                                        title="Ver plantilla del documento"
                                        className="gap-1"
                                      >
                                        <Eye className="h-3 w-3" />
                                        Ver plantilla
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 italic">
                                * Asegúrese de obtener estos documentos firmados antes de completar la venta
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total registrado</span>
                      <span className="text-lg font-bold text-green-600">
                        ${getTotalPaymentAmount().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/sales')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear Venta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
