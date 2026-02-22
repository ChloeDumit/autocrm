'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { Instagram, ShoppingCart, Copy, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SocialMediaDialogProps {
  open: boolean
  onClose: () => void
  vehicleId: string | null
}

export function SocialMediaDialog({ open, onClose, vehicleId }: SocialMediaDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [instagramData, setInstagramData] = useState<any>(null)
  const [mercadolibreData, setMercadolibreData] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (open && vehicleId) {
      generateContent()
    }
  }, [open, vehicleId])

  const generateContent = async () => {
    if (!vehicleId) return

    setLoading(true)
    try {
      const [instagramRes, mercadolibreRes] = await Promise.all([
        api.post('/social-media/instagram/generate', { vehicleId }),
        api.post('/social-media/mercadolibre/generate', { vehicleId }),
      ])

      setInstagramData(instagramRes.data)
      setMercadolibreData(mercadolibreRes.data)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al generar contenido')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    toast({
      title: 'Copiado',
      description: 'Contenido copiado al portapapeles',
    })
    setTimeout(() => setCopied(null), 2000)
  }

  if (!vehicleId) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Publicaciones para Redes Sociales</DialogTitle>
          <DialogDescription>
            Genera contenido listo para publicar en Instagram y MercadoLibre
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Generando contenido...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="instagram" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instagram">
                <Instagram className="mr-2 h-4 w-4" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="mercadolibre">
                <ShoppingCart className="mr-2 h-4 w-4" />
                MercadoLibre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instagram" className="space-y-4">
              {instagramData && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Texto para Instagram</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(instagramData.caption, 'instagram')}
                      >
                        {copied === 'instagram' ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={instagramData.caption}
                      onChange={(e) => setInstagramData({ ...instagramData, caption: e.target.value })}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {instagramData.hashtags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="mercadolibre" className="space-y-4">
              {mercadolibreData && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Título</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(mercadolibreData.title, 'title')}
                      >
                        {copied === 'title' ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={mercadolibreData.title}
                      onChange={(e) => setMercadolibreData({ ...mercadolibreData, title: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Descripción</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(mercadolibreData.description, 'description')}
                      >
                        {copied === 'description' ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={mercadolibreData.description}
                      onChange={(e) => setMercadolibreData({ ...mercadolibreData, description: e.target.value })}
                      rows={8}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Precio</Label>
                      <p className="font-semibold">${mercadolibreData.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Cantidad</Label>
                      <p className="font-semibold">{mercadolibreData.available_quantity}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Categoría ID</Label>
                      <p className="font-semibold text-sm">{mercadolibreData.category_id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Moneda</Label>
                      <p className="font-semibold">{mercadolibreData.currency_id}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Nota:</strong> Para publicar en MercadoLibre, necesitas usar su API oficial. 
                      Este contenido está listo para copiar y pegar manualmente o integrar con su API.
                    </p>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

