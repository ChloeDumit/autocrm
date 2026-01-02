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
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'

const templateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface Template {
  id: string
  nombre: string
  contenido: string
  descripcion?: string
  activo: boolean
}

interface TemplateDialogProps {
  open: boolean
  onClose: () => void
  template?: Template | null
}

export function TemplateDialog({ open, onClose, template }: TemplateDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nombre: '',
      contenido: '',
      descripcion: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (template) {
      reset({
        nombre: template.nombre,
        contenido: template.contenido,
        descripcion: template.descripcion || '',
        activo: template.activo,
      })
    } else {
      reset({
        nombre: '',
        contenido: '',
        descripcion: '',
        activo: true,
      })
    }
  }, [template, reset])

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true)
    try {
      if (template) {
        await api.put(`/document-templates/${template.id}`, data)
        toast({
          title: 'Éxito',
          description: 'Plantilla actualizada correctamente',
        })
      } else {
        await api.post('/document-templates', data)
        toast({
          title: 'Éxito',
          description: 'Plantilla creada correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar plantilla')
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? 'Modifica la plantilla de documento'
              : 'Crea una nueva plantilla de documento. Usa placeholders como {{cliente_nombre}}, {{vehiculo_marca}}, etc.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" {...register('descripcion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contenido">Contenido *</Label>
            <Textarea
              id="contenido"
              {...register('contenido')}
              placeholder="Ej: Contrato de venta para {{cliente_nombre}}..."
              rows={10}
              className="font-mono text-sm"
            />
            {errors.contenido && (
              <p className="text-sm text-red-500">{errors.contenido.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Placeholders disponibles: {'{{cliente_nombre}}'}, {'{{cliente_email}}'}, {'{{cliente_telefono}}'}, {'{{vehiculo_marca}}'}, {'{{vehiculo_modelo}}'}, {'{{vehiculo_ano}}'}, {'{{precio_final}}'}, {'{{vendedor_nombre}}'}, {'{{fecha_venta}}'}, {'{{fecha_actual}}'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              checked={watch('activo')}
              onChange={(e) => setValue('activo', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Plantilla activa
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : template ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

