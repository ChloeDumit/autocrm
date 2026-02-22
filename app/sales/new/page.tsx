'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
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
import {
  ArrowLeft,
  Car,
  User,
  DollarSign,
  Save,
  Loader2,
  CreditCard,
  Plus,
  X,
  FileText,
  Eye,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Download,
  Wand2,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

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
  monto?: number
  notas?: string
}

interface PendingDocument {
  file: File
  nombre: string
  tipo: string
  categoria: string
  paymentMethodId?: string
  paymentMethodName?: string
}

const stageConfig = {
  INTERESADO: { label: 'Interesado', description: 'El cliente mostró interés en el vehículo' },
  PRUEBA: { label: 'Prueba', description: 'Se programó o realizó una prueba de manejo' },
  NEGOCIACION: { label: 'Negociación', description: 'En proceso de negociación del precio' },
  VENDIDO: { label: 'Vendido', description: 'La venta se concretó exitosamente' },
  CANCELADO: { label: 'Cancelado', description: 'La venta fue cancelada' },
}

const STEPS = [
  { id: 1, name: 'Vehículo y Cliente', icon: Car, description: 'Selecciona el vehículo y cliente' },
  { id: 2, name: 'Detalles', icon: DollarSign, description: 'Define la etapa y precio' },
  { id: 3, name: 'Formas de Pago', icon: CreditCard, description: 'Registra los pagos' },
  { id: 4, name: 'Documentos', icon: Upload, description: 'Sube los documentos requeridos' },
]

interface Template {
  id: string
  nombre: string
  descripcion?: string
  contenido?: string
  activo: boolean
}

interface GeneratedDocument {
  templateId: string
  templateName: string
  content: string
  generatedAt: Date
}

export default function NewSalePageWrapper() {
  return (
    <Suspense>
      <NewSalePage />
    </Suspense>
  )
}

function NewSalePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const initialVehicleId = searchParams.get('vehicleId') || ''
  const initialClientId = searchParams.get('clientId') || ''

  // Step state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingSale, setSavingSale] = useState(false)
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null)

  // Step 1: Vehicle & Client
  const [vehicleSearchResults, setVehicleSearchResults] = useState<Vehicle[]>([])
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false)
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Step 3: Payment methods
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<SelectedPaymentMethod[]>([])

  // Step 4: Documents
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const [activeTemplates, setActiveTemplates] = useState<Template[]>([])
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
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
    fetchActiveTemplates()

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

  const fetchActiveTemplates = async () => {
    try {
      const res = await api.get('/document-templates', { params: { activo: true } })
      setActiveTemplates(res.data.filter((t: Template) => t.activo))
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  useEffect(() => {
    if (watchedVehicleId) {
      const vehicle = vehicleSearchResults.find(v => v.id === watchedVehicleId)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        if (!watch('precioFinal')) {
          setValue('precioFinal', vehicle.precio)
        }
      }
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

  const getImageUrl = (image?: string) => {
    if (!image || image.trim() === '') return null
    if (image.startsWith('http') || image.startsWith('data:')) return image
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    const imagePath = image.startsWith('/') ? image : `/${image}`
    return `${baseUrl}${imagePath}`
  }

  // Save sale (called at end of step 3)
  const saveSale = async (): Promise<string | null> => {
    if (savedSaleId) {
      // Sale already saved, just return the ID
      return savedSaleId
    }

    setSavingSale(true)
    try {
      const formData = watch()
      
      // 1. Create the sale
      const saleData = {
        vehicleId: formData.vehicleId,
        clientId: formData.clientId,
        etapa: formData.etapa,
        precioFinal: formData.precioFinal || undefined,
        notas: formData.notas || undefined,
      }
      const res = await api.post('/sales', saleData)
      const saleId = res.data.id
      setSavedSaleId(saleId)

      // 2. Add payment methods
      for (const pm of selectedPaymentMethods) {
        await api.post('/sale-payment-methods', {
          saleId,
          paymentMethodId: pm.paymentMethodId,
          monto: pm.monto || undefined,
          notas: pm.notas || undefined,
        })
      }

      toast({
        title: 'Venta guardada',
        description: 'La venta se guardó correctamente. Ahora puedes generar documentos.',
      })

      return saleId
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar la venta')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    } finally {
      setSavingSale(false)
    }
  }

  // Step navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(['vehicleId', 'clientId'])
      if (!valid) return
    }
    if (currentStep === 2) {
      const valid = await trigger(['etapa', 'precioFinal', 'notas'])
      if (!valid) return
    }
    if (currentStep === 3) {
      // Before moving to step 4, save the sale
      const saleId = await saveSale()
      if (!saleId) {
        // If saving failed, don't advance
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Payment methods
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

  // Documents
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: string,
    categoria: string,
    pmId?: string,
    pmName?: string
  ) => {
    const files = e.target.files
    if (!files) return

    const newDocs: PendingDocument[] = Array.from(files).map(file => ({
      file,
      nombre: file.name,
      tipo,
      categoria,
      paymentMethodId: pmId,
      paymentMethodName: pmName,
    }))

    setPendingDocuments(prev => [...prev, ...newDocs])
    e.target.value = ''
  }

  const removeDocument = (index: number) => {
    setPendingDocuments(prev => prev.filter((_, i) => i !== index))
  }

  // Get required documents based on selected payment methods
  const getPaymentMethodRequiredDocs = () => {
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

  // Generate document from template
  const generateDocumentFromTemplate = async (template: Template) => {
    // If sale is already saved, use saleId (preferred method)
    if (savedSaleId) {
      setGeneratingTemplate(template.id)
      try {
        const res = await api.post(`/document-templates/${template.id}/generate`, {
          saleId: savedSaleId,
        })

        const generatedDoc: GeneratedDocument = {
          templateId: template.id,
          templateName: template.nombre,
          content: res.data.document,
          generatedAt: new Date(),
        }

        // Add or replace the generated document
        setGeneratedDocuments(prev => {
          const existing = prev.findIndex(d => d.templateId === template.id)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = generatedDoc
            return updated
          }
          return [...prev, generatedDoc]
        })

        setPreviewDocument(generatedDoc)

        toast({
          title: 'Documento generado',
          description: `${template.nombre} generado correctamente`,
        })
      } catch (error: any) {
        const errorMessage = getErrorMessage(error, 'Error al generar documento')
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setGeneratingTemplate(null)
      }
      return
    }

    // Fallback: if sale not saved yet, use client/vehicle data
    if (!selectedVehicle || !selectedClient) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un vehículo y cliente primero',
        variant: 'destructive',
      })
      return
    }

    setGeneratingTemplate(template.id)
    try {
      // Build context for template generation
      // If client has an ID, use it. Otherwise, send client data directly
      const context: any = {
        vehicleId: selectedVehicle.id,
        precioFinal: watch('precioFinal') || selectedVehicle.precio,
      }

      // If client has an ID (exists in DB), use clientId
      // Otherwise, send client data directly from form
      if (selectedClient.id) {
        context.clientId = selectedClient.id
      } else {
        // Client not yet saved, send data directly
        context.client = {
          nombre: selectedClient.nombre,
          email: selectedClient.email || undefined,
          telefono: selectedClient.telefono,
          direccion: selectedClient.direccion || undefined,
        }
      }

      const res = await api.post(`/document-templates/${template.id}/generate`, context)

      const generatedDoc: GeneratedDocument = {
        templateId: template.id,
        templateName: template.nombre,
        content: res.data.document,
        generatedAt: new Date(),
      }

      // Add or replace the generated document
      setGeneratedDocuments(prev => {
        const existing = prev.findIndex(d => d.templateId === template.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = generatedDoc
          return updated
        }
        return [...prev, generatedDoc]
      })

      setPreviewDocument(generatedDoc)

      toast({
        title: 'Documento generado',
        description: `${template.nombre} generado correctamente`,
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al generar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setGeneratingTemplate(null)
    }
  }

  const removeGeneratedDocument = (templateId: string) => {
    setGeneratedDocuments(prev => prev.filter(d => d.templateId !== templateId))
    if (previewDocument?.templateId === templateId) {
      setPreviewDocument(null)
    }
  }

  const downloadGeneratedDocument = (doc: GeneratedDocument) => {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.templateName}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const onSubmit = async (data: SaleFormData) => {
    // Ensure sale is saved first
    let saleId = savedSaleId
    if (!saleId) {
      saleId = await saveSale()
      if (!saleId) {
        return // Error already shown in saveSale
      }
    }

    setLoading(true)
    try {
      // 1. Upload documents
      for (const doc of pendingDocuments) {
        try {
          const formData = new FormData()
          formData.append('image', doc.file)
          const uploadRes = await api.post('/vehicle-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })

          await api.post('/sale-documents', {
            saleId,
            nombre: doc.nombre,
            tipo: doc.tipo,
            categoria: doc.categoria,
            archivo: uploadRes.data.url,
            contenido: uploadRes.data.base64 || '',
            mimetype: uploadRes.data.mimetype || '',
          })
        } catch (uploadError) {
          console.error('Error uploading document:', uploadError)
        }
      }

      // 2. Save generated documents from templates
      for (const genDoc of generatedDocuments) {
        try {
          const fileName = `${genDoc.templateName}_${new Date().toISOString().split('T')[0]}.txt`
          const base64Content = btoa(unescape(encodeURIComponent(genDoc.content)))
          const base64String = `data:text/plain;base64,${base64Content}`

          await api.post('/sale-documents', {
            saleId,
            nombre: fileName,
            tipo: 'CONTRATO',
            categoria: 'contrato',
            archivo: fileName,
            contenido: base64String,
            mimetype: 'text/plain',
            descripcion: `Documento generado desde plantilla "${genDoc.templateName}"`,
          })
        } catch (genError) {
          console.error('Error saving generated document:', genError)
        }
      }

      toast({
        title: 'Venta completada',
        description: 'Todos los documentos se guardaron correctamente',
      })
      router.push(`/sales/${saleId}`)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar documentos')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const paymentMethodRequiredDocs = getPaymentMethodRequiredDocs()

  const handleDownloadTemplate = async (doc: PaymentDocument) => {
    try {
      const response = await api.get(`/files/payment-document/${doc.id}`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: doc.mimetype || 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nombre
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al descargar la plantilla',
        variant: 'destructive',
      })
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
            <p className="text-muted-foreground">Completa los pasos para registrar una nueva venta</p>
          </div>
        </div>

        {/* Step Indicator */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
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
                          'mt-2 text-xs font-medium text-center hidden sm:block',
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
                          'mx-2 h-0.5 w-8 sm:w-16 lg:w-24',
                          currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Vehicle & Client */}
          {currentStep === 1 && (
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
          )}

          {/* Step 2: Sale Details */}
          {currentStep === 2 && (
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
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {stageConfig[watchedEtapa as keyof typeof stageConfig]?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precioFinal">Precio Final</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                    placeholder="Notas adicionales sobre la venta..."
                    rows={4}
                  />
                </div>

                {selectedVehicle && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Car className="h-4 w-4" />
                      <span className="font-medium">Vehículo: {selectedVehicle.marca} {selectedVehicle.modelo}</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Precio lista: ${selectedVehicle.precio?.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment Methods */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Formas de Pago
                </CardTitle>
                <CardDescription>
                  Selecciona las formas de pago utilizadas. Algunas requieren documentos adicionales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                    Documentos requeridos para esta forma de pago:
                                  </p>
                                  <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                                    {pm.documents!.map((doc) => (
                                      <li key={doc.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" />
                                          {doc.nombre}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => handleViewDocument(doc)}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => handleDownloadTemplate(doc)}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            Descargar
                                          </Button>
                                        </div>
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
                  <div className="p-4 bg-muted/50 rounded-lg">
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
              </CardContent>
            </Card>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos de la Venta
                </CardTitle>
                <CardDescription>
                  {savedSaleId 
                    ? 'La venta ya está guardada. Puedes generar y subir documentos (opcional).'
                    : 'Gestiona los documentos necesarios para completar la venta'
                  }
                </CardDescription>
                {savedSaleId && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Venta guardada correctamente. Los documentos son opcionales.
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SECTION 1: Required Payment Method Documents */}
                {paymentMethodRequiredDocs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">1</div>
                      <h3 className="font-semibold text-amber-700 dark:text-amber-300">Comprobantes de Pago Requeridos</h3>
                    </div>

                    {selectedPaymentMethods.map(spm => {
                      const pm = availablePaymentMethods.find(p => p.id === spm.paymentMethodId)
                      if (!pm || !pm.documents || pm.documents.length === 0) return null
                      const pmDocs = pendingDocuments.filter(d => d.paymentMethodId === pm.id)

                      return (
                        <div key={`required-${spm.paymentMethodId}`} className="border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CreditCard className="h-4 w-4 text-amber-600" />
                                <span className="font-medium">{pm.nombre}</span>
                                {pmDocs.length > 0 ? (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                    <Check className="h-3 w-3 mr-1" />
                                    Completado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-400">
                                    Pendiente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Sube el comprobante de pago para esta forma de pago
                              </p>
                              {pm.documents.map(doc => (
                                <div key={doc.id} className="flex items-center gap-2 mt-2 text-xs">
                                  <span className="text-amber-600">Plantilla disponible:</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-xs px-2"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-xs px-2"
                                    onClick={() => handleDownloadTemplate(doc)}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Descargar
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <label className="cursor-pointer flex-shrink-0">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                multiple
                                onChange={(e) => handleFileChange(e, 'COMPROBANTE_PAGO', 'pago', pm.id, pm.nombre)}
                              />
                              <Button type="button" variant={pmDocs.length > 0 ? "outline" : "default"} size="sm" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-1" />
                                  {pmDocs.length > 0 ? 'Agregar otro' : 'Subir comprobante'}
                                </span>
                              </Button>
                            </label>
                          </div>

                          {pmDocs.length > 0 && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Archivos subidos:</p>
                              {pmDocs.map((doc, index) => {
                                const globalIndex = pendingDocuments.indexOf(doc)
                                return (
                                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-600" />
                                      <span className="text-sm truncate">{doc.nombre}</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => removeDocument(globalIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* SECTION 2: Generate Documents from Templates */}
                {activeTemplates.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold">
                        {paymentMethodRequiredDocs.length > 0 ? '2' : '1'}
                      </div>
                      <h3 className="font-semibold text-purple-700 dark:text-purple-300">Generar Documentos</h3>
                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                    </div>

                    <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera contratos y documentos automáticamente con los datos del vehículo y cliente.
                      </p>

                      {!savedSaleId && (!selectedVehicle || !selectedClient) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            La venta debe guardarse primero (paso 3) antes de generar documentos.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {activeTemplates.map((template) => {
                          const isGenerated = generatedDocuments.some(d => d.templateId === template.id)
                          const isGenerating = generatingTemplate === template.id

                          return (
                            <div
                              key={template.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                                isGenerated
                                  ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">{template.nombre}</span>
                                  {isGenerated && (
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                      <Check className="h-3 w-3 mr-1" />
                                      Listo
                                    </Badge>
                                  )}
                                </div>
                                {template.descripcion && (
                                  <p className="text-xs text-muted-foreground mt-1">{template.descripcion}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {isGenerated ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        const doc = generatedDocuments.find(d => d.templateId === template.id)
                                        if (doc) setPreviewDocument(doc)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => generateDocumentFromTemplate(template)}
                                      disabled={isGenerating}
                                    >
                                      <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-destructive"
                                      onClick={() => removeGeneratedDocument(template.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateDocumentFromTemplate(template)}
                                    disabled={isGenerating || !savedSaleId}
                                  >
                                    {isGenerating ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        Generando...
                                      </>
                                    ) : (
                                      <>
                                        <Wand2 className="h-4 w-4 mr-1" />
                                        Generar
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Generated documents summary */}
                      {generatedDocuments.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {generatedDocuments.length} documento{generatedDocuments.length > 1 ? 's' : ''} listo{generatedDocuments.length > 1 ? 's' : ''} para guardar con la venta
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document preview */}
                    {previewDocument && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">Vista previa: {previewDocument.templateName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => downloadGeneratedDocument(previewDocument)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPreviewDocument(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="border rounded-md p-4 bg-white dark:bg-gray-900 max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm font-mono">{previewDocument.content}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 3: Other Documents */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">
                      {paymentMethodRequiredDocs.length > 0 && activeTemplates.length > 0 ? '3' :
                       paymentMethodRequiredDocs.length > 0 || activeTemplates.length > 0 ? '2' : '1'}
                    </div>
                    <h3 className="font-semibold text-muted-foreground">Otros Documentos</h3>
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  </div>

                  <div className="border rounded-lg p-4 border-dashed">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sube documentos adicionales como identificaciones, contratos firmados, etc.
                        </p>
                      </div>
                      <label className="cursor-pointer flex-shrink-0">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleFileChange(e, 'OTRO', 'contrato')}
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Plus className="h-4 w-4 mr-1" />
                            Subir archivo
                          </span>
                        </Button>
                      </label>
                    </div>

                    {pendingDocuments.filter(d => d.tipo === 'OTRO').length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t">
                        {pendingDocuments
                          .filter(d => d.tipo === 'OTRO')
                          .map((doc, index) => {
                            const globalIndex = pendingDocuments.indexOf(doc)
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm truncate">{doc.nombre}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => removeDocument(globalIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG. Puedes agregar más documentos después de crear la venta.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? () => router.push('/sales') : handleBack}
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
            <Button 
              type="button" 
              onClick={handleNext}
              disabled={currentStep === 3 && savingSale}
            >
              {currentStep === 3 && savingSale ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando venta...
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={loading || !savedSaleId}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando documentos...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Finalizar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
