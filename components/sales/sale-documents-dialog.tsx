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
  tipo: z.enum(['CONTRATO', 'RECIBO', 'TRANSFERENCIA', 'OTRO']),
  descripcion: z.string().optional(),
})

type DocumentFormData = z.infer<typeof documentSchema>

interface SaleDocument {
  id: string
  nombre: string
  tipo: string
  archivo: string
  descripcion?: string
  contenido?: string
  mimetype?: string
}

interface SaleDocumentsDialogProps {
  open: boolean
  onClose: () => void
  saleId: string | null
}

export function SaleDocumentsDialog({ open, onClose, saleId }: SaleDocumentsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<SaleDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<SaleDocument | null>(null)
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
    },
  })

  useEffect(() => {
    if (open && saleId) {
      fetchDocuments()
    }
  }, [open, saleId])

  const fetchDocuments = async () => {
    if (!saleId) return
    try {
      const res = await api.get(`/sale-documents/sale/${saleId}`)
      setDocuments(res.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const onSubmit = async (data: DocumentFormData) => {
    if (!saleId) return

    setLoading(true)
    try {
      const fileInput = document.getElementById('saleDocumentFile') as HTMLInputElement
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
        contenido = selectedDocument.contenido || ''
        mimetype = selectedDocument.mimetype || ''
      }

      if (selectedDocument) {
        await api.put(`/sale-documents/${selectedDocument.id}`, {
          ...data,
          archivo,
          contenido,
          mimetype,
        })
        toast({
          title: 'Documento actualizado',
          description: 'El documento fue actualizado correctamente',
        })
      } else {
        await api.post('/sale-documents', {
          ...data,
          archivo,
          contenido,
          mimetype,
          saleId,
        })
        toast({
          title: 'Documento agregado',
          description: 'El documento fue agregado correctamente',
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
      await api.delete(`/sale-documents/${id}`)
      toast({
        title: 'Documento eliminado',
        description: 'El documento fue eliminado correctamente',
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

  const handleEdit = (doc: SaleDocument) => {
    setSelectedDocument(doc)
    reset({
      nombre: doc.nombre,
      tipo: doc.tipo as any,
      descripcion: doc.descripcion || '',
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedDocument(null)
    reset({
      nombre: '',
      tipo: 'OTRO',
      descripcion: '',
    })
    setShowForm(true)
  }

  const handleViewDocument = async (doc: SaleDocument) => {
    if (doc.contenido) {
      try {
        const response = await api.get(`/files/sale-document/${doc.id}`, {
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
    } else {
      let url = doc.archivo
      if (!doc.archivo.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
        url = `${baseUrl}${doc.archivo}`
      }
      window.open(url, '_blank')
    }
  }

  const getDocumentTypeLabel = (tipo: string) => {
    const types: Record<string, string> = {
      CONTRATO: 'Contrato',
      RECIBO: 'Recibo',
      TRANSFERENCIA: 'Transferencia',
      OTRO: 'Otro',
    }
    return types[tipo] || tipo
  }

  if (!saleId) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos de la Venta</DialogTitle>
          <DialogDescription>
            Gestiona los documentos asociados a esta venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleNew}>
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
                          <span className="text-xs text-muted-foreground">
                            ({getDocumentTypeLabel(doc.tipo)})
                          </span>
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
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
                      <SelectItem value="CONTRATO">Contrato</SelectItem>
                      <SelectItem value="RECIBO">Recibo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleDocumentFile">Archivo *</Label>
                <Input
                  id="saleDocumentFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                )}
                {selectedDocument && (
                  <p className="text-sm text-muted-foreground">
                    Archivo actual: {selectedDocument.nombre}
                  </p>
                )}
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
