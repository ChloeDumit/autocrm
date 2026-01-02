'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus } from 'lucide-react'
import { TemplateDialog } from '@/components/templates/template-dialog'
import { TemplateCard } from '@/components/templates/template-card'

interface Template {
  id: string
  nombre: string
  contenido: string
  descripcion?: string
  activo: boolean
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/document-templates')
      setTemplates(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar plantillas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTemplate(null)
    setDialogOpen(true)
  }

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return

    try {
      await api.delete(`/document-templates/${id}`)
      toast({
        title: 'Éxito',
        description: 'Plantilla eliminada correctamente',
      })
      fetchTemplates()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar plantilla',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedTemplate(null)
    fetchTemplates()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plantillas de Documentos</h1>
            <p className="text-muted-foreground">
              Gestiona las plantillas para documentos de venta
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay plantillas registradas
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TemplateDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          template={selectedTemplate}
        />
      </div>
    </MainLayout>
  )
}

