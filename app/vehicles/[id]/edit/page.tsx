'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { ArrowLeft, ArrowRight, Check, Car, Image, Settings, FileText } from 'lucide-react'
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

interface Vehicle {
  id: string
  marca: string
  modelo: string
  ano: number
  precio: number
  moneda?: string
  kilometraje: number
  estado: string
  descripcion?: string
  imagen?: string
  imagenes?: string[]
}

interface VehicleDocument {
  id: string
  nombre: string
  tipo: string
  archivo: string
  descripcion?: string
  fechaVencimiento?: string
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

export default function EditVehiclePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [properties, setProperties] = useState<Array<{ fieldId: string; valor: string }>>([])
  const [documents, setDocuments] = useState<VehicleDocument[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  useEffect(() => {
    if (params.id) {
      fetchVehicle()
      fetchDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchVehicle = async () => {
    try {
      const res = await api.get(`/vehicles/${params.id}`)
      const data = res.data
      setVehicle(data)
      reset({
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        precio: data.precio,
        moneda: data.moneda || 'USD',
        kilometraje: data.kilometraje,
        estado: data.estado as any,
        descripcion: data.descripcion || '',
        imagen: data.imagen || '',
      })
      if (data.imagenes && Array.isArray(data.imagenes)) {
        setImages(data.imagenes)
      } else if (data.imagen) {
        setImages([data.imagen])
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el vehículo',
        variant: 'destructive',
      })
      router.push('/vehicles')
    } finally {
      setFetching(false)
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

  const onSubmit = async (data: VehicleFormData) => {
    if (!vehicle) return

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

      await api.put(`/vehicles/${vehicle.id}`, payload)

      if (properties.length > 0) {
        try {
          await api.post(`/vehicle-properties/vehicle/${vehicle.id}`, { properties })
        } catch (error) {
          console.error('Error saving properties:', error)
        }
      }

      toast({
        title: 'Éxito',
        description: 'Vehículo actualizado correctamente',
      })
      router.push(`/vehicles/${vehicle.id}`)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al actualizar vehículo')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (doc: VehicleDocument) => {
    if ((doc as any).contenido) {
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
      let url = doc.archivo
      if (!doc.archivo.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
        url = `${baseUrl}${doc.archivo}`
      }
      window.open(url, '_blank')
    }
  }

  const watchedValues = watch()

  if (fetching) {
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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/vehicles/${vehicle.id}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Editar Vehículo</h1>
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
                    <CardDescription>Modifica los datos básicos del vehículo</CardDescription>
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
                    <CardDescription>Administra las fotos del vehículo</CardDescription>
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
                        <p>No hay imágenes agregadas</p>
                        <p className="text-sm">Puedes continuar sin imágenes</p>
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
                    <CardDescription>Los documentos se gestionan desde la página de detalle del vehículo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {documents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay documentos registrados</p>
                        <p className="text-sm">Puedes agregar documentos desde la página de detalle</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
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
                              {doc.descripcion && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.descripcion}
                                </p>
                              )}
                              {doc.fechaVencimiento && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                            >
                              Ver
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Para agregar o eliminar documentos, ve a la{' '}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                      >
                        página de detalle
                      </button>
                      {' '}del vehículo.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Additional Properties */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Características Adicionales</CardTitle>
                    <CardDescription>Modifica propiedades personalizadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehiclePropertiesForm
                      vehicleId={vehicle.id}
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
                          <p className="font-medium">{images.length} imagen(es)</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Documentos:</span>
                          <p className="font-medium">{documents.length} registrado(s)</p>
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
              onClick={currentStep === 1 ? () => router.push(`/vehicles/${vehicle.id}`) : handlePrev}
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
                {loading ? 'Guardando...' : 'Guardar Cambios'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
