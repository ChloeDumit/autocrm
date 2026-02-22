'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { Plus, FileText, Edit, Trash2, MoreHorizontal, Share2, Instagram, ShoppingCart, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Template {
  id: string
  nombre: string
  contenido: string
  descripcion?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Social media template state
  const [socialFormData, setSocialFormData] = useState({
    plantillaInstagram: '',
    plantillaMercadolibreTitulo: '',
    plantillaMercadolibreDescripcion: '',
  })
  const [savingTemplates, setSavingTemplates] = useState(false)
  const [loadingSocial, setLoadingSocial] = useState(true)

  useEffect(() => {
    fetchTemplates()
    fetchSocialTemplates()
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

  const fetchSocialTemplates = async () => {
    try {
      const res = await api.get('/app-config')
      setSocialFormData({
        plantillaInstagram: res.data.plantillaInstagram || '',
        plantillaMercadolibreTitulo: res.data.plantillaMercadolibreTitulo || '',
        plantillaMercadolibreDescripcion: res.data.plantillaMercadolibreDescripcion || '',
      })
    } catch (error) {
      // Silently fail - social templates are optional
    } finally {
      setLoadingSocial(false)
    }
  }

  const handleSaveSocialTemplates = async () => {
    setSavingTemplates(true)
    try {
      // Fetch current config first to preserve other fields
      const configRes = await api.get('/app-config')
      await api.put('/app-config', {
        ...configRes.data,
        ...socialFormData,
      })
      toast({
        title: 'Plantillas guardadas',
        description: 'Las plantillas de redes sociales se actualizaron correctamente',
      })
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al guardar plantillas')
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setSavingTemplates(false)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) return

    try {
      await api.delete(`/document-templates/${id}`)
      toast({
        title: 'Plantilla eliminada',
        description: 'La plantilla fue eliminada correctamente',
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getLineCount = (content: string) => {
    return content.split('\n').length
  }

  const getVariableCount = (content: string) => {
    const matches = content.match(/\{\{[a-z_]+\}\}/g)
    return matches ? new Set(matches).size : 0
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Plantillas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las plantillas de documentos y redes sociales
          </p>
        </div>

        <Tabs defaultValue="documentos" className="w-full">
          <TabsList>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="redes" className="gap-2">
              <Share2 className="h-4 w-4" />
              Redes Sociales
            </TabsTrigger>
          </TabsList>

          {/* Document Templates Tab */}
          <TabsContent value="documentos" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {templates.length} plantilla{templates.length !== 1 ? 's' : ''} • {templates.filter(t => t.activo).length} activa{templates.filter(t => t.activo).length !== 1 ? 's' : ''}
              </p>
              <Button onClick={() => router.push('/templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando plantillas...</p>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No hay plantillas</h3>
                  <p className="text-muted-foreground text-sm mb-4 text-center max-w-sm">
                    Crea tu primera plantilla para generar documentos de venta como contratos, recibos y notas de entrega.
                  </p>
                  <Button onClick={() => router.push('/templates/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera plantilla
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/templates/${template.id}/edit`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{template.nombre}</h3>
                            {template.descripcion && (
                              <p className="text-sm text-muted-foreground truncate">
                                {template.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/templates/${template.id}/edit`)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(template.id, template.nombre)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Template Preview */}
                      <div className="bg-muted/50 rounded-md p-3 mb-3">
                        <p className="text-xs text-muted-foreground font-mono line-clamp-3 whitespace-pre-wrap">
                          {template.contenido || 'Sin contenido'}
                        </p>
                      </div>

                      {/* Stats & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{getLineCount(template.contenido)} líneas</span>
                          <span>•</span>
                          <span>{getVariableCount(template.contenido)} variables</span>
                        </div>
                        <Badge
                          variant={template.activo ? 'default' : 'secondary'}
                          className={template.activo ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {template.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground mt-3">
                        Actualizada {formatDate(template.updatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Social Media Templates Tab */}
          <TabsContent value="redes" className="mt-4">
            {loadingSocial ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando plantillas...</p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl space-y-6">
                <p className="text-sm text-muted-foreground">
                  Personaliza las plantillas para compartir vehículos en redes sociales.
                  Dejá vacío para usar la plantilla por defecto.
                </p>

                {/* Available placeholders */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variables disponibles (se reemplazan con datos del vehículo)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['{{marca}}', '{{modelo}}', '{{ano}}', '{{precio}}', '{{kilometraje}}', '{{descripcion}}', '{{estado}}'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Instagram template */}
                <div className="space-y-2">
                  <Label htmlFor="plantillaInstagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Plantilla de Instagram
                  </Label>
                  <Textarea
                    id="plantillaInstagram"
                    value={socialFormData.plantillaInstagram}
                    onChange={(e) => setSocialFormData({ ...socialFormData, plantillaInstagram: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder={'🚗 {{marca}} {{modelo}} {{ano}}\n\n💰 Precio: ${{precio}}\n📏 Kilometraje: {{kilometraje}} km\n{{descripcion}}\n\n#{{marca}} #{{modelo}} #AutoUsado #VentaDeAutos'}
                  />
                </div>

                {/* MercadoLibre title template */}
                <div className="space-y-2">
                  <Label htmlFor="plantillaMlTitulo" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Título de MercadoLibre
                  </Label>
                  <Input
                    id="plantillaMlTitulo"
                    value={socialFormData.plantillaMercadolibreTitulo}
                    onChange={(e) => setSocialFormData({ ...socialFormData, plantillaMercadolibreTitulo: e.target.value })}
                    placeholder="{{marca}} {{modelo}} {{ano}} - {{kilometraje}} km"
                  />
                </div>

                {/* MercadoLibre description template */}
                <div className="space-y-2">
                  <Label htmlFor="plantillaMlDesc" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Descripción de MercadoLibre
                  </Label>
                  <Textarea
                    id="plantillaMlDesc"
                    value={socialFormData.plantillaMercadolibreDescripcion}
                    onChange={(e) => setSocialFormData({ ...socialFormData, plantillaMercadolibreDescripcion: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                    placeholder={'{{marca}} {{modelo}} {{ano}}\nKilometraje: {{kilometraje}} km\nPrecio: ${{precio}}\n\n{{descripcion}}\n\n¡Contactanos para más información!'}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    disabled={savingTemplates}
                    onClick={handleSaveSocialTemplates}
                  >
                    {savingTemplates ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Plantillas'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
