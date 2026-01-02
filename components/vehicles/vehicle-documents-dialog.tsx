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
import { Upload, X, FileText } from 'lucide-react'

const documentSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['TITULO', 'SEGURO', 'REVISION', 'OTRO']),
  descripcion: z.string().optional(),
  fechaVencimiento: z.string().optional(),
})

type DocumentFormData = z.infer<typeof documentSchema>

interface VehicleDocument {
  id: string
  nombre: string
  tipo: string
  archivo: string
  descripcion?: string
  fechaVencimiento?: string
}

interface VehicleDocumentsDialogProps {
  open: boolean
  onClose: () => void
  vehicleId: string | null
}

export function VehicleDocumentsDialog({ open, onClose, vehicleId }: VehicleDocumentsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<VehicleDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      nombre: '',
      tipo: 'OTRO',
      descripcion: '',
      fechaVencimiento: '',
    },
  })

  useEffect(() => {
    if (open && vehicleId) {
      fetchDocuments()
    }
  }, [open, vehicleId])

  const fetchDocuments = async () => {
    if (!vehicleId) return
    try {
      const res = await api.get(`/vehicle-documents/vehicle/${vehicleId}`)
      setDocuments(res.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post('/vehicle-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setValue('archivo' as any, res.data.url)
      toast({
        title: 'Éxito',
        description: 'Archivo subido correctamente',
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al subir archivo')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: DocumentFormData) => {
    if (!vehicleId) return

    setLoading(true)
    try {
      const fileInput = document.getElementById('documentFile') as HTMLInputElement
      if (!fileInput?.files?.[0] && !selectedDocument) {
        toast({
          title: 'Error',
          description: 'Debes subir un archivo',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      let archivo = ''
      let contenido = ''
      let mimetype = ''
      
      if (fileInput?.files?.[0]) {
        const formData = new FormData()
        formData.append('image', fileInput.files[0])
        const uploadRes = await api.post('/vehicle-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        archivo = uploadRes.data.url
        contenido = uploadRes.data.base64 || ''
        mimetype = uploadRes.data.mimetype || ''
      } else if (selectedDocument) {
        archivo = selectedDocument.archivo
        contenido = (selectedDocument as any).contenido || ''
        mimetype = (selectedDocument as any).mimetype || ''
      }

      if (selectedDocument) {
        await api.put(`/vehicle-documents/${selectedDocument.id}`, {
          ...data,
          archivo,
          contenido,
          mimetype,
        })
        toast({
          title: 'Éxito',
          description: 'Documento actualizado correctamente',
        })
      } else {
        await api.post('/vehicle-documents', {
          ...data,
          archivo,
          contenido,
          mimetype,
          vehicleId,
        })
        toast({
          title: 'Éxito',
          description: 'Documento creado correctamente',
        })
      }

      reset()
      setSelectedDocument(null)
      setShowForm(false)
      fetchDocuments()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    try {
      await api.delete(`/vehicle-documents/${id}`)
      toast({
        title: 'Éxito',
        description: 'Documento eliminado correctamente',
      })
      fetchDocuments()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al eliminar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (doc: VehicleDocument) => {
    setSelectedDocument(doc)
    reset({
      nombre: doc.nombre,
      tipo: doc.tipo as any,
      descripcion: doc.descripcion || '',
      fechaVencimiento: doc.fechaVencimiento
        ? new Date(doc.fechaVencimiento).toISOString().split('T')[0]
        : '',
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedDocument(null)
    reset({
      nombre: '',
      tipo: 'OTRO',
      descripcion: '',
      fechaVencimiento: '',
    })
    setShowForm(true)
  }

  const getDocumentUrl = (doc: VehicleDocument) => {
    // Si tiene contenido base64, usar endpoint de la API
    if ((doc as any).contenido) {
      return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}/api/files/vehicle-document/${doc.id}`
    }
    // Si no, usar la URL del archivo
    if (doc.archivo.startsWith('http')) return doc.archivo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${doc.archivo}`
  }

  if (!vehicleId) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos del Vehículo</DialogTitle>
          <DialogDescription>
            Gestiona los documentos asociados a este vehículo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-end">
                <Button onClick={handleNew}>
                  <FileText className="mr-2 h-4 w-4" />
                  Nuevo Documento
                </Button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay documentos registrados
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getDocumentUrl(doc), '_blank')}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(doc)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Documento *</Label>
                  <Input id="nombre" {...register('nombre')} />
                  {errors.nombre && (
                    <p className="text-sm text-red-500">{errors.nombre.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={watch('tipo')}
                    onValueChange={(value) => setValue('tipo', value as any)}
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
                <Label htmlFor="documentFile">Archivo *</Label>
                <Input
                  id="documentFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="fechaVencimiento"
                    type="date"
                    {...register('fechaVencimiento')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...register('descripcion')}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setSelectedDocument(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || uploading}>
                  {loading ? 'Guardando...' : selectedDocument ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

