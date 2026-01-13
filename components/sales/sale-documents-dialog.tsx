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
import { Upload, X, FileText, CreditCard, Eye, Trash2, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const documentSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['CONTRATO', 'COMPROBANTE_PAGO', 'ENTREGA', 'IDENTIFICACION', 'OTRO']),
  categoria: z.enum(['contrato', 'pago', 'entrega', 'identificacion']).optional(),
  descripcion: z.string().optional(),
  salePaymentMethodId: z.string().optional(),
})

type DocumentFormData = z.infer<typeof documentSchema>

interface PaymentMethod {
  id: string
  nombre: string
}

interface SalePaymentMethod {
  id: string
  monto?: number
  paymentMethod: PaymentMethod
}

interface SaleDocument {
  id: string
  nombre: string
  tipo: string
  categoria?: string
  archivo: string
  descripcion?: string
  contenido?: string
  mimetype?: string
  salePaymentMethodId?: string
  salePaymentMethod?: SalePaymentMethod
}

interface SaleDocumentsDialogProps {
  open: boolean
  onClose: () => void
  saleId: string | null
}

export function SaleDocumentsDialog({ open, onClose, saleId }: SaleDocumentsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<SaleDocument[]>([])
  const [paymentMethods, setPaymentMethods] = useState<SalePaymentMethod[]>([])
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
      categoria: undefined,
      descripcion: '',
      salePaymentMethodId: undefined,
    },
  })

  useEffect(() => {
    if (open && saleId) {
      fetchData()
    }
  }, [open, saleId])

  const fetchData = async () => {
    if (!saleId) return
    setFetching(true)
    try {
      const [documentsRes, saleRes] = await Promise.all([
        api.get(`/sale-documents/sale/${saleId}`),
        api.get(`/sales/${saleId}`),
      ])
      setDocuments(documentsRes.data)
      setPaymentMethods(saleRes.data.paymentMethods || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setFetching(false)
    }
  }

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

      // Derive categoria from tipo if not set
      const categoria = data.categoria || getCategoriaFromTipo(data.tipo)

      if (selectedDocument) {
        await api.put(`/sale-documents/${selectedDocument.id}`, {
          nombre: data.nombre,
          tipo: data.tipo,
          categoria,
          descripcion: data.descripcion,
          salePaymentMethodId: data.salePaymentMethodId || null,
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
          nombre: data.nombre,
          tipo: data.tipo,
          categoria,
          descripcion: data.descripcion,
          salePaymentMethodId: data.salePaymentMethodId || null,
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
      categoria: doc.categoria as any,
      descripcion: doc.descripcion || '',
      salePaymentMethodId: doc.salePaymentMethodId || undefined,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedDocument(null)
    reset({
      nombre: '',
      tipo: 'OTRO',
      categoria: undefined,
      descripcion: '',
      salePaymentMethodId: undefined,
    })
    setShowForm(true)
  }

  const getCategoriaFromTipo = (tipo: string): string => {
    const mapping: Record<string, string> = {
      CONTRATO: 'contrato',
      COMPROBANTE_PAGO: 'pago',
      ENTREGA: 'entrega',
      IDENTIFICACION: 'identificacion',
      OTRO: 'contrato',
    }
    return mapping[tipo] || 'contrato'
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
      COMPROBANTE_PAGO: 'Comprobante de Pago',
      ENTREGA: 'Entrega',
      IDENTIFICACION: 'Identificación',
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
          {fetching ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Cargando documentos...</p>
              </div>
            </div>
          ) : !showForm ? (
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
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{doc.nombre}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getDocumentTypeLabel(doc.tipo)}
                          </Badge>
                          {doc.salePaymentMethod && (
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {doc.salePaymentMethod.paymentMethod.nombre}
                            </Badge>
                          )}
                        </div>
                        {doc.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDocument(doc)}
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(doc)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
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
                      <SelectItem value="COMPROBANTE_PAGO">Comprobante de Pago</SelectItem>
                      <SelectItem value="ENTREGA">Documento de Entrega</SelectItem>
                      <SelectItem value="IDENTIFICACION">Identificación</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentMethods.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="salePaymentMethodId">Vincular a Forma de Pago (opcional)</Label>
                  <Select
                    value={watch('salePaymentMethodId') || ''}
                    onValueChange={(value) => setValue('salePaymentMethodId', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin vincular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin vincular</SelectItem>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.paymentMethod.nombre}
                          {pm.monto ? ` - $${pm.monto.toLocaleString()}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Vincula este documento a una forma de pago específica (ej: comprobante de transferencia)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="saleDocumentFile">Archivo {!selectedDocument && '*'}</Label>
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
                    Archivo actual: {selectedDocument.nombre} (deja vacío para mantener)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...register('descripcion')}
                  rows={2}
                  placeholder="Descripción opcional del documento..."
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
