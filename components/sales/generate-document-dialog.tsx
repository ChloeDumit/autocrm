'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { Download, FileText, Save, Check } from 'lucide-react'

interface Template {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

interface Sale {
  id: string
}

interface GenerateDocumentDialogProps {
  open: boolean
  onClose: () => void
  sale: Sale | null
}

export function GenerateDocumentDialog({ open, onClose, sale }: GenerateDocumentDialogProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedToSale, setSavedToSale] = useState(false)

  useEffect(() => {
    if (open && sale) {
      fetchTemplates()
    }
  }, [open, sale])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await api.get('/document-templates', { params: { activo: true } })
      setTemplates(res.data)
      if (res.data.length > 0) {
        setSelectedTemplate(res.data[0].id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar plantillas',
        variant: 'destructive',
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || !sale) return

    setLoading(true)
    try {
      const res = await api.post(`/document-templates/${selectedTemplate}/generate`, {
        saleId: sale.id,
      })
      setGeneratedDocument(res.data.document)
      toast({
        title: 'Éxito',
        description: 'Documento generado correctamente',
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al generar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedDocument) return

    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const templateName = templates.find(t => t.id === selectedTemplate)?.nombre || 'documento'
    const fileName = `${templateName}_${new Date().toISOString().split('T')[0]}.txt`
    link.download = fileName
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Descargado',
      description: 'Documento descargado correctamente',
    })
  }

  const handleDownloadAsPDF = () => {
    if (!generatedDocument) return

    // Crear un nuevo documento HTML para convertir a PDF
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const templateName = templates.find(t => t.id === selectedTemplate)?.nombre || 'documento'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${templateName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${generatedDocument.replace(/\n/g, '<br>')}
        </body>
      </html>
    `)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleSaveToSale = async () => {
    if (!generatedDocument || !sale) return

    setSaving(true)
    try {
      const templateName = templates.find(t => t.id === selectedTemplate)?.nombre || 'Documento'
      const fileName = `${templateName}_${new Date().toISOString().split('T')[0]}.txt`

      // Create base64 content for the document
      const base64Content = btoa(unescape(encodeURIComponent(generatedDocument)))
      const base64String = `data:text/plain;base64,${base64Content}`

      await api.post('/sale-documents', {
        saleId: sale.id,
        nombre: fileName,
        tipo: 'CONTRATO',
        categoria: 'contrato',
        archivo: fileName,
        contenido: base64String,
        mimetype: 'text/plain',
        descripcion: `Documento generado desde plantilla "${templateName}"`,
      })

      setSavedToSale(true)
      toast({
        title: 'Guardado',
        description: 'Documento guardado en la venta',
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar documento')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setGeneratedDocument(null)
    setSelectedTemplate('')
    setSavedToSale(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Documento</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla y genera el documento para esta venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedDocument ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="template">Plantilla</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                  disabled={loadingTemplates}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nombre}
                        {template.descripcion && ` - ${template.descripcion}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && !loadingTemplates && (
                  <p className="text-sm text-muted-foreground">
                    No hay plantillas activas disponibles
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedTemplate || loading || templates.length === 0}
                >
                  {loading ? 'Generando...' : 'Generar Documento'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Vista Previa del Documento</Label>
                <div className="border rounded-md p-4 bg-muted max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedDocument}
                  </pre>
                </div>
              </div>

              <DialogFooter className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cerrar
                </Button>
                <Button type="button" variant="outline" onClick={handleGenerate} disabled={saving}>
                  <FileText className="mr-2 h-4 w-4" />
                  Regenerar
                </Button>
                <Button
                  type="button"
                  variant={savedToSale ? "secondary" : "default"}
                  onClick={handleSaveToSale}
                  disabled={saving || savedToSale}
                >
                  {savedToSale ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Guardado
                    </>
                  ) : saving ? (
                    'Guardando...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar en Venta
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleDownloadAsPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Imprimir/PDF
                </Button>
                <Button type="button" variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar TXT
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

