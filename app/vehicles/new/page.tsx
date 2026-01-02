'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { ArrowLeft, ArrowRight, Check, Car, Image, Settings, FileText, X, Upload } from 'lucide-react'
import { ImageUpload } from '@/components/vehicles/image-upload'
import { VehiclePropertiesForm } from '@/components/vehicles/vehicle-properties-form'
import { cn } from '@/lib/utils'

const vehicleSchema = z.object({
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  ano: z.number().min(1900).max(2100),
  precio: z.number().positive('El precio debe ser positivo'),
  moneda: z.string().min(1, 'La moneda es requerida'),
  kilometraje: z.number().min(0),
  estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'MANTENIMIENTO']),
  descripcion: z.string().optional(),
  imagen: z.string().optional().or(z.literal('')),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface PendingDocument {
  id: string
  nombre: string
  tipo: string
  descripcion?: string
  fechaVencimiento?: string
  file: File
}

const STEPS = [
  { id: 1, title: 'Información', icon: Car },
  { id: 2, title: 'Imágenes', icon: Image },
  { id: 3, title: 'Documentos', icon: FileText },
  { id: 4, title: 'Características', icon: Settings },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'UYU', label: 'UYU - Peso Uruguayo' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'BRL', label: 'BRL - Real' },
]

export default function NewVehiclePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [properties, setProperties] = useState<Array<{ fieldId: string; valor: string }>>([])
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const [documentForm, setDocumentForm] = useState({
    nombre: '',
    tipo: 'OTRO',
    descripcion: '',
    fechaVencimiento: '',
  })
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      precio: 0,
      moneda: 'USD',
      kilometraje: 0,
      estado: 'DISPONIBLE',
      descripcion: '',
      imagen: '',
    },
  })

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['marca', 'modelo', 'ano', 'precio', 'moneda', 'kilometraje', 'estado'])
      case 2:
        return true // Images are optional
      case 3:
        return true // Documents are optional
      case 4:
        return true // Properties are optional
      default:
        return true
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    } else if (step > currentStep) {
      for (let i = currentStep; i < step; i++) {
        const isValid = await validateStep(i)
        if (!isValid) return
      }
      setCurrentStep(step)
    }
  }

  const handleAddDocument = () => {
    if (!documentForm.nombre || !selectedFile) {
      toast({
        title: 'Error',
        description: 'El nombre y el archivo son requeridos',
        variant: 'destructive',
      })
      return
    }

    const newDoc: PendingDocument = {
      id: crypto.randomUUID(),
      nombre: documentForm.nombre,
      tipo: documentForm.tipo,
      descripcion: documentForm.descripcion,
      fechaVencimiento: documentForm.fechaVencimiento,
      file: selectedFile,
    }

    setPendingDocuments([...pendingDocuments, newDoc])
    setDocumentForm({ nombre: '', tipo: 'OTRO', descripcion: '', fechaVencimiento: '' })
    setSelectedFile(null)
    setShowDocumentForm(false)
  }

  const handleRemoveDocument = (id: string) => {
    setPendingDocuments(pendingDocuments.filter((doc) => doc.id !== id))
  }

  const uploadDocuments = async (vehicleId: string) => {
    for (const doc of pendingDocuments) {
      try {
        const formData = new FormData()
        formData.append('image', doc.file)
        const uploadRes = await api.post('/vehicle-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        await api.post('/vehicle-documents', {
          nombre: doc.nombre,
          tipo: doc.tipo,
          descripcion: doc.descripcion,
          fechaVencimiento: doc.fechaVencimiento || undefined,
          archivo: uploadRes.data.url,
          contenido: uploadRes.data.base64 || '',
          mimetype: uploadRes.data.mimetype || '',
          vehicleId,
        })
      } catch (error) {
        console.error('Error uploading document:', error)
      }
    }
  }

  const onSubmit = async (data: VehicleFormData) => {
    setLoading(true)
    try {
      const imagenPrincipal = images.length > 0
        ? images[0]
        : (data.imagen && data.imagen.trim() !== '' ? data.imagen : undefined)

      const payload = {
        ...data,
        imagenes: images.length > 0 ? images : undefined,
        imagen: imagenPrincipal,
      }

      const res = await api.post('/vehicles', payload)
      const vehicleId = res.data.id

      if (properties.length > 0) {
        try {
          await api.post(`/vehicle-properties/vehicle/${vehicleId}`, { properties })
        } catch (error) {
          console.error('Error saving properties:', error)
        }
      }

      if (pendingDocuments.length > 0) {
        await uploadDocuments(vehicleId)
      }

      toast({
        title: 'Éxito',
        description: 'Vehículo creado correctamente',
      })
      router.push(`/vehicles/${vehicleId}`)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al crear vehículo')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const watchedValues = watch()

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/vehicles')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Nuevo Vehículo</h1>
                <p className="text-muted-foreground text-sm">Paso {currentStep} de {STEPS.length}</p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg transition-colors',
                        isCurrent && 'bg-primary/10',
                        !isCurrent && 'hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                          isCompleted && 'bg-primary border-primary text-primary-foreground',
                          isCurrent && 'border-primary text-primary',
                          !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'font-medium hidden sm:block',
                          isCurrent && 'text-primary',
                          !isCurrent && !isCompleted && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-2',
                          isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} id="vehicle-form">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Vehículo</CardTitle>
                    <CardDescription>Ingresa los datos básicos del vehículo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="marca">Marca *</Label>
                        <Input
                          id="marca"
                          {...register('marca')}
                          placeholder="Ej: Toyota"
                        />
                        {errors.marca && (
                          <p className="text-sm text-destructive">{errors.marca.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modelo">Modelo *</Label>
                        <Input
                          id="modelo"
                          {...register('modelo')}
                          placeholder="Ej: Corolla"
                        />
                        {errors.modelo && (
                          <p className="text-sm text-destructive">{errors.modelo.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ano">Año *</Label>
                        <Input
                          id="ano"
                          type="number"
                          {...register('ano', { valueAsNumber: true })}
                        />
                        {errors.ano && (
                          <p className="text-sm text-destructive">{errors.ano.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kilometraje">Kilometraje *</Label>
                        <Input
                          id="kilometraje"
                          type="number"
                          {...register('kilometraje', { valueAsNumber: true })}
                        />
                        {errors.kilometraje && (
                          <p className="text-sm text-destructive">{errors.kilometraje.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="precio">Precio *</Label>
                        <Input
                          id="precio"
                          type="number"
                          step="0.01"
                          {...register('precio', { valueAsNumber: true })}
                        />
                        {errors.precio && (
                          <p className="text-sm text-destructive">{errors.precio.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="moneda">Moneda *</Label>
                        <Select
                          value={watch('moneda')}
                          onValueChange={(value) => setValue('moneda', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Select
                        value={watch('estado')}
                        onValueChange={(value) => setValue('estado', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                          <SelectItem value="RESERVADO">Reservado</SelectItem>
                          <SelectItem value="VENDIDO">Vendido</SelectItem>
                          <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        {...register('descripcion')}
                        placeholder="Descripción del vehículo..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Images */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Imágenes del Vehículo</CardTitle>
                    <CardDescription>Sube fotos del vehículo (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ImageUpload
                      images={images}
                      onImagesChange={setImages}
                      maxImages={10}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="imagen">URL de Imagen Externa</Label>
                      <Input
                        id="imagen"
                        type="url"
                        {...register('imagen')}
                        placeholder="https://... (opcional)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Puedes usar una URL externa si prefieres no subir imágenes
                      </p>
                    </div>

                    {images.length === 0 && !watchedValues.imagen && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No has agregado imágenes aún</p>
                        <p className="text-sm">Puedes continuar sin imágenes y agregarlas después</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos del Vehículo</CardTitle>
                    <CardDescription>Agrega documentos como título, seguro, etc. (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!showDocumentForm ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDocumentForm(true)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Agregar Documento
                        </Button>

                        {pendingDocuments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No has agregado documentos aún</p>
                            <p className="text-sm">Puedes continuar sin documentos y agregarlos después</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pendingDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{doc.nombre}</span>
                                    <span className="text-xs text-muted-foreground">({doc.tipo})</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {doc.file.name}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveDocument(doc.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre del Documento *</Label>
                            <Input
                              value={documentForm.nombre}
                              onChange={(e) => setDocumentForm({ ...documentForm, nombre: e.target.value })}
                              placeholder="Ej: Título de propiedad"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select
                              value={documentForm.tipo}
                              onValueChange={(value) => setDocumentForm({ ...documentForm, tipo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TITULO">Título</SelectItem>
                                <SelectItem value="SEGURO">Seguro</SelectItem>
                                <SelectItem value="REVISION">Revisión</SelectItem>
                                <SelectItem value="OTRO">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Archivo *</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                          </div>
                          {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                              Archivo seleccionado: {selectedFile.name}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Fecha de Vencimiento</Label>
                          <Input
                            type="date"
                            value={documentForm.fechaVencimiento}
                            onChange={(e) => setDocumentForm({ ...documentForm, fechaVencimiento: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            value={documentForm.descripcion}
                            onChange={(e) => setDocumentForm({ ...documentForm, descripcion: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowDocumentForm(false)
                              setSelectedFile(null)
                              setDocumentForm({ nombre: '', tipo: 'OTRO', descripcion: '', fechaVencimiento: '' })
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="button" onClick={handleAddDocument}>
                            <Upload className="mr-2 h-4 w-4" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Additional Properties */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Características Adicionales</CardTitle>
                    <CardDescription>Agrega propiedades personalizadas (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehiclePropertiesForm
                      vehicleId={null}
                      onPropertiesChange={setProperties}
                    />

                    {/* Summary */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-4">Resumen del vehículo</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Marca/Modelo:</span>
                          <p className="font-medium">{watchedValues.marca} {watchedValues.modelo}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Año:</span>
                          <p className="font-medium">{watchedValues.ano}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Precio:</span>
                          <p className="font-medium">{watchedValues.moneda} {watchedValues.precio?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kilometraje:</span>
                          <p className="font-medium">{watchedValues.kilometraje?.toLocaleString()} km</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estado:</span>
                          <p className="font-medium">{watchedValues.estado}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Imágenes:</span>
                          <p className="font-medium">{images.length} subida(s)</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Documentos:</span>
                          <p className="font-medium">{pendingDocuments.length} agregado(s)</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-background border-t py-4 px-6 z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={currentStep === 1 ? () => router.push('/vehicles') : handlePrev}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" form="vehicle-form" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Vehículo'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
