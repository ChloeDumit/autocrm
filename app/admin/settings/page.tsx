'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { Settings, Upload, X, Loader2 } from 'lucide-react'
import { useAppConfig } from '@/lib/app-config'

interface AppConfig {
  id: string
  nombreEmpresa: string
  logo?: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { refresh: refreshAppConfig } = useAppConfig()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    logo: '',
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await api.get('/app-config')
      setFormData({
        nombreEmpresa: res.data.nombreEmpresa || '',
        logo: res.data.logo || '',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar configuración',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Fetch current config to preserve fields not in this form (colors, templates)
      const currentConfig = await api.get('/app-config')
      await api.put('/app-config', {
        ...currentConfig.data,
        ...formData,
      })
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se aplicaron correctamente',
      })
      refreshAppConfig()
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al guardar configuración')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append('image', file)

    try {
      const res = await api.post('/upload-logo', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setFormData(prev => ({ ...prev, logo: res.data.url }))
      toast({
        title: 'Logo subido',
        description: 'El logo se subió correctamente. Guarda para aplicar los cambios.',
      })
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al subir logo')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }))
  }

  const getLogoUrl = (logo: string) => {
    if (!logo) return ''
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${logo}`
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza la información de tu automotora
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Datos de la Empresa
            </CardTitle>
            <CardDescription>
              Configura el nombre y logo de tu automotora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombreEmpresa">Nombre de la Automotora *</Label>
                <Input
                  id="nombreEmpresa"
                  value={formData.nombreEmpresa}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreEmpresa: e.target.value })
                  }
                  placeholder="Ej: AutoMax Concesionaria"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-start gap-4">
                  {formData.logo ? (
                    <div className="relative">
                      <div className="h-24 w-24 rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={getLogoUrl(formData.logo)}
                          alt="Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      <span className="text-xs text-muted-foreground">Sin logo</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {formData.logo ? 'Cambiar Logo' : 'Subir Logo'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Formatos: PNG, JPG, SVG. Tamaño recomendado: 200x200px
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Configuración'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  )
}
