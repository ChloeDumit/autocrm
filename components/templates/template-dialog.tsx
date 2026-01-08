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
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { TemplateEditor } from './template-editor'
import { StarterTemplatesPicker } from './template-editor/starter-templates-picker'
import { StarterTemplate } from '@/lib/starter-templates'

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
  const [showStarterPicker, setShowStarterPicker] = useState(false)

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
    if (open) {
      if (template) {
        reset({
          nombre: template.nombre,
          contenido: template.contenido,
          descripcion: template.descripcion || '',
          activo: template.activo,
        })
        setShowStarterPicker(false)
      } else {
        reset({
          nombre: '',
          contenido: '',
          descripcion: '',
          activo: true,
        })
        setShowStarterPicker(true)
      }
    }
  }, [template, open, reset])

  const handleSelectStarterTemplate = (starterTemplate: StarterTemplate) => {
    setValue('contenido', starterTemplate.contenido)
    if (!watch('nombre') && starterTemplate.id !== 'vacio') {
      setValue('nombre', starterTemplate.nombre)
      setValue('descripcion', starterTemplate.descripcion)
    }
    setShowStarterPicker(false)
  }

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true)
    try {
      if (template) {
        await api.put(`/document-templates/${template.id}`, data)
        toast({
          title: 'Plantilla actualizada',
          description: 'La plantilla fue actualizada correctamente',
        })
      } else {
        await api.post('/document-templates', data)
        toast({
          title: 'Plantilla creada',
          description: 'La plantilla fue creada correctamente',
        })
      }
      onClose()
    } catch (error: unknown) {
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? 'Modifica la plantilla de documento'
              : 'Crea una nueva plantilla de documento para generar documentos de venta'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Starter Template Picker - only for new templates */}
          <StarterTemplatesPicker
            isVisible={showStarterPicker && !template}
            onSelect={handleSelectStarterTemplate}
          />

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la plantilla *</Label>
              <Input
                id="nombre"
                {...register('nombre')}
                placeholder="Ej: Contrato de Venta"
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                {...register('descripcion')}
                placeholder="Breve descripción del uso de esta plantilla"
              />
            </div>
          </div>

          {/* Template Editor */}
          <div className="space-y-2">
            <Label>Contenido de la plantilla *</Label>
            <TemplateEditor
              value={watch('contenido')}
              onChange={(value) => setValue('contenido', value)}
              error={errors.contenido?.message}
            />
          </div>

          {/* Active Toggle */}
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
            <span className="text-xs text-muted-foreground ml-2">
              (solo las plantillas activas aparecen al generar documentos)
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : template ? 'Actualizar' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
