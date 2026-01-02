'use client'

import { useEffect, useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { ImageUpload } from './image-upload'
import { VehiclePropertiesForm } from './vehicle-properties-form'

const vehicleSchema = z.object({
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  ano: z.number().min(1900).max(2100),
  precio: z.number().positive('El precio debe ser positivo'),
  kilometraje: z.number().min(0),
  estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'MANTENIMIENTO']),
  descripcion: z.string().optional(),
  imagen: z.string().optional().or(z.literal('')).refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image'),
    { message: 'La imagen debe ser una URL válida, una ruta relativa o base64' }
  ),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

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
}

interface VehicleDialogProps {
  open: boolean
  onClose: () => void
  vehicle?: Vehicle | null
}

export function VehicleDialog({ open, onClose, vehicle }: VehicleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [properties, setProperties] = useState<Array<{ fieldId: string; valor: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      precio: 0,
      kilometraje: 0,
      estado: 'DISPONIBLE',
      descripcion: '',
      imagen: '',
    },
  })

  useEffect(() => {
    if (vehicle) {
      reset({
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        ano: vehicle.ano,
        precio: vehicle.precio,
        kilometraje: vehicle.kilometraje,
        estado: vehicle.estado as any,
        descripcion: vehicle.descripcion || '',
        imagen: vehicle.imagen || '',
      })
      // Cargar imágenes si existen
      if ((vehicle as any).imagenes && Array.isArray((vehicle as any).imagenes)) {
        setImages((vehicle as any).imagenes)
      } else if (vehicle.imagen) {
        setImages([vehicle.imagen])
      } else {
        setImages([])
      }
    } else {
      reset({
        marca: '',
        modelo: '',
        ano: new Date().getFullYear(),
        precio: 0,
        kilometraje: 0,
        estado: 'DISPONIBLE',
        descripcion: '',
        imagen: '',
      })
      setImages([])
    }
  }, [vehicle, reset])

  const onSubmit = async (data: VehicleFormData) => {
    setLoading(true)
    try {
      // Si hay imágenes subidas, usar la primera como imagen principal
      // Si no, usar la URL externa si existe
      const imagenPrincipal = images.length > 0 
        ? images[0] 
        : (data.imagen && data.imagen.trim() !== '' ? data.imagen : undefined)
      
      // Las imágenes ya vienen como base64 desde el componente ImageUpload
      const payload = {
        ...data,
        imagenes: images.length > 0 ? images : undefined,
        imagen: imagenPrincipal,
      }
      
      let vehicleId: string
      if (vehicle) {
        const res = await api.put(`/vehicles/${vehicle.id}`, payload)
        vehicleId = res.data.id
        toast({
          title: 'Éxito',
          description: 'Vehículo actualizado correctamente',
        })
      } else {
        const res = await api.post('/vehicles', payload)
        vehicleId = res.data.id
        toast({
          title: 'Éxito',
          description: 'Vehículo creado correctamente',
        })
      }

      // Guardar propiedades si hay alguna
      if (properties.length > 0) {
        try {
          await api.post(`/vehicle-properties/vehicle/${vehicleId}`, { properties })
        } catch (error) {
          console.error('Error saving properties:', error)
          // No mostramos error al usuario ya que el vehículo se guardó correctamente
        }
      }

      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar vehículo')
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </DialogTitle>
          <DialogDescription>
            {vehicle
              ? 'Modifica la información del vehículo'
              : 'Completa la información del nuevo vehículo'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                {...register('marca')}
                placeholder="Ej: Toyota"
              />
              {errors.marca && (
                <p className="text-sm text-red-500">{errors.marca.message}</p>
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
                <p className="text-sm text-red-500">{errors.modelo.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Año *</Label>
              <Input
                id="ano"
                type="number"
                {...register('ano', { valueAsNumber: true })}
              />
              {errors.ano && (
                <p className="text-sm text-red-500">{errors.ano.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                {...register('precio', { valueAsNumber: true })}
              />
              {errors.precio && (
                <p className="text-sm text-red-500">{errors.precio.message}</p>
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
                <p className="text-sm text-red-500">
                  {errors.kilometraje.message}
                </p>
              )}
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
            {errors.estado && (
              <p className="text-sm text-red-500">{errors.estado.message}</p>
            )}
          </div>

          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={10}
          />
          
          <div className="space-y-2">
            <Label htmlFor="imagen">URL de Imagen Externa (Opcional)</Label>
            <Input
              id="imagen"
              type="url"
              {...register('imagen')}
              placeholder="https://... (si prefieres usar una URL externa)"
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar URLs externas además de las imágenes subidas
            </p>
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

          <VehiclePropertiesForm
            vehicleId={vehicle?.id || null}
            onPropertiesChange={setProperties}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : vehicle ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

