'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { TemplateEditorFull } from '@/components/templates/template-editor-full'

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

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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
    if (params.id) {
      fetchTemplate()
    }
  }, [params.id])

  const fetchTemplate = async () => {
    try {
      const res = await api.get(`/document-templates/${params.id}`)
      const template: Template = res.data
      reset({
        nombre: template.nombre,
        contenido: template.contenido,
        descripcion: template.descripcion || '',
        activo: template.activo,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la plantilla',
        variant: 'destructive',
      })
      router.push('/templates')
    } finally {
      setFetching(false)
    }
  }

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true)
    try {
      await api.put(`/document-templates/${params.id}`, data)
      toast({
        title: 'Plantilla actualizada',
        description: 'La plantilla fue actualizada correctamente',
      })
      router.push('/templates')
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al actualizar plantilla')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.push('/templates')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Editar Plantilla</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/templates')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Name and Description inline */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="nombre" className="text-xs text-muted-foreground">Nombre *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Contrato de Venta"
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <Label htmlFor="descripcion" className="text-xs text-muted-foreground">Descripción</Label>
            <Input
              id="descripcion"
              {...register('descripcion')}
              placeholder="Breve descripción de esta plantilla"
            />
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <input
              type="checkbox"
              id="activo"
              checked={watch('activo')}
              onChange={(e) => setValue('activo', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="activo" className="cursor-pointer text-sm">
              Activa
            </Label>
          </div>
        </div>

        {/* Template Editor */}
        <TemplateEditorFull
          value={watch('contenido')}
          onChange={(value) => setValue('contenido', value)}
          error={errors.contenido?.message}
        />
      </form>
    </MainLayout>
  )
}
