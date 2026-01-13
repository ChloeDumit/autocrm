'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PropertyField {
  id: string
  nombre: string
  tipo: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN'
  esPredefinida: boolean
  orden: number
  activa: boolean
}

export default function VehiclePropertiesPage() {
  const { toast } = useToast()
  const [fields, setFields] = useState<PropertyField[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<PropertyField | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'TEXT' as 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN',
    orden: 0,
  })

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const res = await api.get('/vehicle-properties/fields')
      setFields(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar propiedades',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingField(null)
    setFormData({
      nombre: '',
      tipo: 'TEXT',
      orden: fields.filter(f => !f.esPredefinida).length + 1,
    })
    setDialogOpen(true)
  }

  const handleEdit = (field: PropertyField) => {
    if (field.esPredefinida) {
      toast({
        title: 'Error',
        description: 'No se pueden editar propiedades predefinidas',
        variant: 'destructive',
      })
      return
    }
    setEditingField(field)
    setFormData({
      nombre: field.nombre,
      tipo: field.tipo,
      orden: field.orden,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const field = fields.find(f => f.id === id)
    if (field?.esPredefinida) {
      toast({
        title: 'Error',
        description: 'No se pueden eliminar propiedades predefinidas',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return

    try {
      await api.delete(`/vehicle-properties/fields/${id}`)
      toast({
        title: 'Éxito',
        description: 'Propiedad eliminada correctamente',
      })
      fetchFields()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar propiedad',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'destructive',
      })
      return
    }

    try {
      if (editingField) {
        await api.put(`/vehicle-properties/fields/${editingField.id}`, formData)
        toast({
          title: 'Éxito',
          description: 'Propiedad actualizada correctamente',
        })
      } else {
        await api.post('/vehicle-properties/fields', formData)
        toast({
          title: 'Éxito',
          description: 'Propiedad creada correctamente',
        })
      }
      setDialogOpen(false)
      fetchFields()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al guardar propiedad',
        variant: 'destructive',
      })
    }
  }

  const customFields = fields.filter(f => !f.esPredefinida)
  const predefinedFields = fields.filter(f => f.esPredefinida)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Propiedades de Vehículos</h1>
            <p className="text-muted-foreground">
              Gestiona las propiedades personalizadas para los vehículos
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Propiedades Predefinidas */}
        {predefinedFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Predefinidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {predefinedFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{field.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {field.tipo} | Orden: {field.orden}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Predefinida
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Propiedades Custom */}
        <Card>
          <CardHeader>
            <CardTitle>Propiedades Personalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando propiedades...</p>
                </div>
              </div>
            ) : customFields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay propiedades personalizadas. Crea una nueva para comenzar.
              </div>
            ) : (
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{field.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        Tipo: {field.tipo} | Orden: {field.orden}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Editar Propiedad' : 'Nueva Propiedad'}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? 'Modifica la información de la propiedad'
                  : 'Crea una nueva propiedad personalizada para los vehículos'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Número de Serie"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Texto</SelectItem>
                    <SelectItem value="NUMBER">Número</SelectItem>
                    <SelectItem value="DATE">Fecha</SelectItem>
                    <SelectItem value="BOOLEAN">Sí/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  El orden determina cómo se muestran las propiedades en el formulario
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingField ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}



