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
import { Upload, X, FileText } from 'lucide-react'

const paymentMethodSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
})

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  documents: Array<{
    id: string
    nombre: string
    archivo: string
    descripcion?: string
  }>
}

interface PaymentMethodDialogProps {
  open: boolean
  onClose: () => void
  method?: PaymentMethod | null
}

export function PaymentMethodDialog({ open, onClose, method }: PaymentMethodDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<Array<{ id: string; nombre: string; archivo: string }>>([])
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (method) {
      reset({
        nombre: method.nombre,
        descripcion: method.descripcion || '',
        activo: method.activo,
      })
      setDocuments(method.documents || [])
    } else {
      reset({
        nombre: '',
        descripcion: '',
        activo: true,
      })
      setDocuments([])
    }
    setDocumentName('')
    setDocumentDescription('')
  }, [method, reset])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !method) return

    if (!documentName.trim()) {
      toast({
        title: 'Error',
        description: 'Debes ingresar un nombre para el documento',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const uploadRes = await api.post('/vehicle-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      await api.post(`/payment-methods/${method.id}/documents`, {
        nombre: documentName,
        archivo: uploadRes.data.url,
        contenido: uploadRes.data.base64 || undefined,
        mimetype: uploadRes.data.mimetype || undefined,
        descripcion: documentDescription || undefined,
      })

      toast({
        title: 'Éxito',
        description: 'Documento agregado correctamente',
      })

      // Recargar método para obtener documentos actualizados
      const methodRes = await api.get(`/payment-methods/${method.id}`)
      setDocuments(methodRes.data.documents || [])
      setDocumentName('')
      setDocumentDescription('')
      if (e.target) e.target.value = ''
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al subir documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    try {
      await api.delete(`/payment-methods/documents/${docId}`)
      setDocuments(documents.filter(doc => doc.id !== docId))
      toast({
        title: 'Éxito',
        description: 'Documento eliminado correctamente',
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al eliminar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: PaymentMethodFormData) => {
    setLoading(true)
    try {
      if (method) {
        await api.put(`/payment-methods/${method.id}`, data)
        toast({
          title: 'Éxito',
          description: 'Forma de pago actualizada correctamente',
        })
      } else {
        await api.post('/payment-methods', data)
        toast({
          title: 'Éxito',
          description: 'Forma de pago creada correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar forma de pago')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getDocumentUrl = (doc: { id: string; archivo: string; contenido?: string }) => {
    // Si tiene contenido base64, usar endpoint de la API
    if (doc.contenido) {
      return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}/api/files/payment-document/${doc.id}`
    }
    // Si no, usar la URL del archivo
    if (doc.archivo.startsWith('http')) return doc.archivo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${doc.archivo}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {method ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
          </DialogTitle>
          <DialogDescription>
            {method
              ? 'Modifica la forma de pago y gestiona sus documentos'
              : 'Crea una nueva forma de pago'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register('nombre')} placeholder="Ej: Efectivo" />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="activo">Estado</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={watch('activo')}
                  onChange={(e) => setValue('activo', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Activo
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Descripción de la forma de pago..."
              rows={3}
            />
          </div>

          {method && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Documentos de esta Forma de Pago</Label>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre del documento"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploading || !documentName.trim()}
                      className="flex-1"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Descripción del documento (opcional)"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.nombre}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getDocumentUrl(doc), '_blank')}
                        >
                          Ver
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : method ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

