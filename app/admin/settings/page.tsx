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
import { Palette, Upload } from 'lucide-react'

interface AppConfig {
  id: string
  nombreEmpresa: string
  colorPrimario: string
  colorSecundario: string
  logo?: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    colorPrimario: '#3b82f6',
    colorSecundario: '#1e40af',
    logo: '',
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await api.get('/app-config')
      setConfig(res.data)
      setFormData({
        nombreEmpresa: res.data.nombreEmpresa || '',
        colorPrimario: res.data.colorPrimario || '#3b82f6',
        colorSecundario: res.data.colorSecundario || '#1e40af',
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
      const res = await api.put('/app-config', formData)
      setConfig(res.data)
      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente',
      })
      // Recargar la página para aplicar los cambios
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
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

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post('/vehicle-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setFormData({ ...formData, logo: res.data.url })
      toast({
        title: 'Éxito',
        description: 'Logo subido correctamente',
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al subir logo')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración de la Aplicación</h1>
          <p className="text-muted-foreground">
            Personaliza el nombre y colores de tu automotora
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalización
            </CardTitle>
            <CardDescription>
              Configura la apariencia de tu aplicación
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colorPrimario">Color Primario *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="colorPrimario"
                      type="color"
                      value={formData.colorPrimario}
                      onChange={(e) =>
                        setFormData({ ...formData, colorPrimario: e.target.value })
                      }
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.colorPrimario}
                      onChange={(e) =>
                        setFormData({ ...formData, colorPrimario: e.target.value })
                      }
                      placeholder="#3b82f6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorSecundario">Color Secundario *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="colorSecundario"
                      type="color"
                      value={formData.colorSecundario}
                      onChange={(e) =>
                        setFormData({ ...formData, colorSecundario: e.target.value })
                      }
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.colorSecundario}
                      onChange={(e) =>
                        setFormData({ ...formData, colorSecundario: e.target.value })
                      }
                      placeholder="#1e40af"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo && (
                    <div className="h-20 w-20 rounded-lg overflow-hidden border">
                      <img
                        src={
                          formData.logo.startsWith('http')
                            ? formData.logo
                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${formData.logo}`
                        }
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {formData.logo ? 'Cambiar Logo' : 'Subir Logo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${formData.colorPrimario} 0%, ${formData.colorSecundario} 100%)`,
                color: 'white',
              }}
            >
              <h2 className="text-2xl font-bold">{formData.nombreEmpresa || 'AutoCRM'}</h2>
              <p className="text-white/80 mt-2">Sistema de Gestión para Automotoras</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

