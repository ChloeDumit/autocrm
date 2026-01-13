'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Car,
  User,
  CreditCard,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertTriangle,
  Plus,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Schema for the sale form
const saleSchema = z.object({
  vehicleId: z.string().min(1, 'El vehículo es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  etapa: z.enum(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']),
  precioFinal: z.number().positive().optional(),
  notas: z.string().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
  documents?: { id: string; nombre: string }[]
}

interface SelectedPaymentMethod {
  paymentMethodId: string
  monto?: number
  notas?: string
}

interface PendingDocument {
  file: File
  nombre: string
  tipo: string
  paymentMethodId?: string
  paymentMethodName?: string
}

interface SaleWizardDialogProps {
  open: boolean
  onClose: () => void
  initialVehicleId?: string
  initialClientId?: string
}

const STEPS = [
  { id: 1, name: 'Vehículo y Cliente', icon: Car },
  { id: 2, name: 'Detalles', icon: FileText },
  { id: 3, name: 'Formas de Pago', icon: CreditCard },
  { id: 4, name: 'Documentos', icon: Upload },
]

export function SaleWizardDialog({
  open,
  onClose,
  initialVehicleId,
  initialClientId,
}: SaleWizardDialogProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Vehicle & Client
  const [vehicleSearchResults, setVehicleSearchResults] = useState<any[]>([])
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([])
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false)
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  // Step 3: Payment Methods
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<SelectedPaymentMethod[]>([])

  // Step 4: Documents
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      vehicleId: '',
      clientId: '',
      etapa: 'INTERESADO',
      precioFinal: undefined,
      notas: '',
    },
  })

  // Reset everything when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setSelectedPaymentMethods([])
      setPendingDocuments([])
      setSelectedVehicle(null)
      setSelectedClient(null)
      searchVehicles('')
      searchClients('')
      fetchPaymentMethods()

      if (initialVehicleId) {
        fetchVehicleById(initialVehicleId)
        setValue('vehicleId', initialVehicleId)
      }
      if (initialClientId) {
        fetchClientById(initialClientId)
        setValue('clientId', initialClientId)
      }
    } else {
      reset()
    }
  }, [open, initialVehicleId, initialClientId])

  // Update selected vehicle/client when IDs change
  useEffect(() => {
    const vehicleId = watch('vehicleId')
    if (vehicleId) {
      const vehicle = vehicleSearchResults.find(v => v.id === vehicleId)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        if (!watch('precioFinal')) {
          setValue('precioFinal', vehicle.precio)
        }
      }
    }
  }, [watch('vehicleId'), vehicleSearchResults])

  useEffect(() => {
    const clientId = watch('clientId')
    if (clientId) {
      const client = clientSearchResults.find(c => c.id === clientId)
      if (client) setSelectedClient(client)
    }
  }, [watch('clientId'), clientSearchResults])

  const searchVehicles = useCallback(async (search: string) => {
    setVehicleSearchLoading(true)
    try {
      const params: any = { estado: 'DISPONIBLE' }
      if (search) params.search = search
      const res = await api.get('/vehicles', { params })
      setVehicleSearchResults(res.data)
    } catch (error) {
      console.error('Error searching vehicles:', error)
    } finally {
      setVehicleSearchLoading(false)
    }
  }, [])

  const searchClients = useCallback(async (search: string) => {
    setClientSearchLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      const res = await api.get('/clients', { params })
      setClientSearchResults(res.data)
    } catch (error) {
      console.error('Error searching clients:', error)
    } finally {
      setClientSearchLoading(false)
    }
  }, [])

  const fetchVehicleById = async (id: string) => {
    try {
      const res = await api.get(`/vehicles/${id}`)
      setVehicleSearchResults(prev => {
        if (!prev.find(v => v.id === id)) return [res.data, ...prev]
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
      setClientSearchResults(prev => {
        if (!prev.find(c => c.id === id)) return [res.data, ...prev]
        return prev
      })
      setSelectedClient(res.data)
    } catch (error) {
      console.error('Error fetching client:', error)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/payment-methods')
      setAvailablePaymentMethods(res.data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(['vehicleId', 'clientId'])
      if (!valid) return
    }
    if (currentStep === 2) {
      const valid = await trigger(['etapa', 'precioFinal', 'notas'])
      if (!valid) return
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const togglePaymentMethod = (pmId: string) => {
    setSelectedPaymentMethods(prev => {
      const exists = prev.find(p => p.paymentMethodId === pmId)
      if (exists) {
        return prev.filter(p => p.paymentMethodId !== pmId)
      }
      return [...prev, { paymentMethodId: pmId }]
    })
  }

  const updatePaymentMethodAmount = (pmId: string, monto: number | undefined) => {
    setSelectedPaymentMethods(prev =>
      prev.map(p => (p.paymentMethodId === pmId ? { ...p, monto } : p))
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, pmId?: string, pmName?: string) => {
    const files = e.target.files
    if (!files) return

    const newDocs: PendingDocument[] = Array.from(files).map(file => ({
      file,
      nombre: file.name,
      tipo: pmId ? 'COMPROBANTE_PAGO' : 'OTRO',
      paymentMethodId: pmId,
      paymentMethodName: pmName,
    }))

    setPendingDocuments(prev => [...prev, ...newDocs])
    e.target.value = '' // Reset input
  }

  const removeDocument = (index: number) => {
    setPendingDocuments(prev => prev.filter((_, i) => i !== index))
  }

  // Get required documents based on selected payment methods
  const getRequiredDocuments = () => {
    const required: { pmId: string; pmName: string; docName: string }[] = []
    selectedPaymentMethods.forEach(spm => {
      const pm = availablePaymentMethods.find(p => p.id === spm.paymentMethodId)
      if (pm?.documents) {
        pm.documents.forEach(doc => {
          required.push({
            pmId: pm.id,
            pmName: pm.nombre,
            docName: doc.nombre,
          })
        })
      }
    })
    return required
  }

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true)
    try {
      // 1. Create the sale
      const saleRes = await api.post('/sales', data)
      const saleId = saleRes.data.id

      // 2. Add payment methods if any
      for (const pm of selectedPaymentMethods) {
        await api.post('/sale-payment-methods', {
          saleId,
          paymentMethodId: pm.paymentMethodId,
          monto: pm.monto || null,
          notas: pm.notas || null,
        })
      }

      // 3. Upload documents if any
      for (const doc of pendingDocuments) {
        setUploading(true)
        try {
          // Upload file
          const formData = new FormData()
          formData.append('image', doc.file)
          const uploadRes = await api.post('/vehicle-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })

          // Create document record
          await api.post('/sale-documents', {
            saleId,
            nombre: doc.nombre,
            tipo: doc.tipo,
            categoria: doc.tipo === 'COMPROBANTE_PAGO' ? 'pago' : 'contrato',
            archivo: uploadRes.data.url,
            contenido: uploadRes.data.base64 || '',
            mimetype: uploadRes.data.mimetype || '',
          })
        } catch (uploadError) {
          console.error('Error uploading document:', uploadError)
        }
      }

      toast({
        title: 'Venta creada',
        description: 'La venta fue creada correctamente',
      })
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al crear venta')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const requiredDocs = getRequiredDocuments()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogDescription>
            Completa los pasos para crear una nueva venta
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 py-4 border-b">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-green-500 bg-green-500 text-white',
                      !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      isActive && 'text-primary',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 w-12 sm:w-20',
                      currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Step 1: Vehicle & Client */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <SearchSelect
                  label="Vehículo *"
                  placeholder="Buscar vehículo por marca o modelo..."
                  value={watch('vehicleId')}
                  onValueChange={(value) => setValue('vehicleId', value)}
                  items={vehicleSearchResults.map((vehicle) => ({
                    id: vehicle.id,
                    label: `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano}) - $${vehicle.precio.toLocaleString()}`,
                  }))}
                  onSearch={searchVehicles}
                  loading={vehicleSearchLoading}
                  error={errors.vehicleId?.message}
                />

                {selectedVehicle && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedVehicle.marca} {selectedVehicle.modelo}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedVehicle.ano} · {selectedVehicle.kilometraje?.toLocaleString()} km · ${selectedVehicle.precio?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <SearchSelect
                  label="Cliente *"
                  placeholder="Buscar cliente por nombre, email o teléfono..."
                  value={watch('clientId')}
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
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedClient.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedClient.telefono}
                          {selectedClient.email && ` · ${selectedClient.email}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Sale Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etapa">Etapa *</Label>
                  <Select
                    value={watch('etapa')}
                    onValueChange={(value) => setValue('etapa', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERESADO">Interesado</SelectItem>
                      <SelectItem value="PRUEBA">Prueba</SelectItem>
                      <SelectItem value="NEGOCIACION">Negociación</SelectItem>
                      <SelectItem value="VENDIDO">Vendido</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioFinal">Precio Final</Label>
                  <Input
                    id="precioFinal"
                    type="number"
                    step="0.01"
                    {...register('precioFinal', { valueAsNumber: true })}
                    placeholder={selectedVehicle?.precio?.toString() || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  {...register('notas')}
                  placeholder="Notas adicionales sobre la venta..."
                  rows={4}
                />
              </div>

              {selectedVehicle && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Car className="h-4 w-4" />
                    <span className="font-medium">Vehículo seleccionado</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {selectedVehicle.marca} {selectedVehicle.modelo} ({selectedVehicle.ano}) - Precio lista: ${selectedVehicle.precio?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment Methods */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecciona las formas de pago que se utilizarán en esta venta.
                Algunas formas de pago requieren documentos adicionales.
              </div>

              {availablePaymentMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay formas de pago configuradas
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePaymentMethods.map((pm) => {
                    const isSelected = selectedPaymentMethods.some(s => s.paymentMethodId === pm.id)
                    const selectedPm = selectedPaymentMethods.find(s => s.paymentMethodId === pm.id)
                    const hasRequiredDocs = pm.documents && pm.documents.length > 0

                    return (
                      <div
                        key={pm.id}
                        className={cn(
                          'border rounded-lg p-4 transition-colors',
                          isSelected && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePaymentMethod(pm.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pm.nombre}</span>
                              {hasRequiredDocs && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {pm.documents!.length} doc. requerido{pm.documents!.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            {pm.descripcion && (
                              <p className="text-sm text-muted-foreground mt-1">{pm.descripcion}</p>
                            )}

                            {hasRequiredDocs && (
                              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                                  Documentos requeridos:
                                </p>
                                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                                  {pm.documents!.map((doc) => (
                                    <li key={doc.id} className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {doc.nombre}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {isSelected && (
                              <div className="mt-3 space-y-2">
                                <Label className="text-sm">Monto (opcional)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Monto pagado con este método"
                                  value={selectedPm?.monto || ''}
                                  onChange={(e) => updatePaymentMethodAmount(pm.id, e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPaymentMethods.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg mt-4">
                  <p className="text-sm font-medium">Resumen de pagos</p>
                  <div className="mt-2 space-y-1">
                    {selectedPaymentMethods.map(spm => {
                      const pm = availablePaymentMethods.find(p => p.id === spm.paymentMethodId)
                      return (
                        <div key={spm.paymentMethodId} className="flex justify-between text-sm">
                          <span>{pm?.nombre}</span>
                          <span>{spm.monto ? `$${spm.monto.toLocaleString()}` : '-'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {requiredDocs.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Documentos requeridos para esta venta</span>
                  </div>
                  <ul className="space-y-2">
                    {requiredDocs.map((doc, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{doc.docName}</span>
                        <span className="text-xs">({doc.pmName})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Subir Documentos</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sube los documentos necesarios para esta venta. Puedes agregar más documentos después.
                  </p>
                </div>

                {/* Upload by Payment Method */}
                {selectedPaymentMethods.length > 0 && (
                  <div className="space-y-3">
                    {selectedPaymentMethods.map(spm => {
                      const pm = availablePaymentMethods.find(p => p.id === spm.paymentMethodId)
                      if (!pm) return null
                      return (
                        <div key={spm.paymentMethodId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{pm.nombre}</span>
                            </div>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                multiple
                                onChange={(e) => handleFileChange(e, pm.id, pm.nombre)}
                              />
                              <Button type="button" variant="outline" size="sm" asChild>
                                <span>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Subir comprobante
                                </span>
                              </Button>
                            </label>
                          </div>

                          {pendingDocuments.filter(d => d.paymentMethodId === pm.id).length > 0 && (
                            <div className="space-y-2">
                              {pendingDocuments
                                .map((doc, index) => ({ doc, index }))
                                .filter(({ doc }) => doc.paymentMethodId === pm.id)
                                .map(({ doc, index }) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm truncate">{doc.nombre}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => removeDocument(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* General Documents */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Otros documentos</span>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileChange(e)}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Plus className="h-4 w-4 mr-1" />
                          Subir documento
                        </span>
                      </Button>
                    </label>
                  </div>

                  {pendingDocuments.filter(d => !d.paymentMethodId).length > 0 && (
                    <div className="space-y-2">
                      {pendingDocuments
                        .map((doc, index) => ({ doc, index }))
                        .filter(({ doc }) => !doc.paymentMethodId)
                        .map(({ doc, index }) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate">{doc.nombre}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeDocument(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
            >
              {currentStep === 1 ? (
                'Cancelar'
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </>
              )}
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Crear Venta
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
