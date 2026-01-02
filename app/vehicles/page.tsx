'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, Search } from 'lucide-react'
import { VehicleDialog } from '@/components/vehicles/vehicle-dialog'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { SocialMediaDialog } from '@/components/vehicles/social-media-dialog'
import { VehicleDocumentsDialog } from '@/components/vehicles/vehicle-documents-dialog'

interface Vehicle {
  id: string
  marca: string
  modelo: string
  ano: number
  precio: number
  kilometraje: number
  estado: string
  descripcion?: string
  imagen?: string
  imagenes?: string[]
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [vehicleIdForSocial, setVehicleIdForSocial] = useState<string | null>(null)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)
  const [vehicleIdForDocuments, setVehicleIdForDocuments] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles', { params: { search } })
      setVehicles(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar vehículos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchVehicles()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleCreate = () => {
    setSelectedVehicle(null)
    setDialogOpen(true)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return

    try {
      await api.delete(`/vehicles/${id}`)
      toast({
        title: 'Éxito',
        description: 'Vehículo eliminado correctamente',
      })
      fetchVehicles()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar vehículo',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedVehicle(null)
    fetchVehicles()
  }

  const handleGenerateSocial = (vehicleId: string) => {
    setVehicleIdForSocial(vehicleId)
    setSocialDialogOpen(true)
  }

  const handleSocialDialogClose = () => {
    setSocialDialogOpen(false)
    setVehicleIdForSocial(null)
  }

  const handleManageDocuments = (vehicleId: string) => {
    setVehicleIdForDocuments(vehicleId)
    setDocumentsDialogOpen(true)
  }

  const handleDocumentsDialogClose = () => {
    setDocumentsDialogOpen(false)
    setVehicleIdForDocuments(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vehículos</h1>
            <p className="text-muted-foreground">
              Gestiona tu inventario de vehículos
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca o modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay vehículos registrados
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onGenerateSocial={handleGenerateSocial}
                    onManageDocuments={handleManageDocuments}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <VehicleDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          vehicle={selectedVehicle}
        />

        <SocialMediaDialog
          open={socialDialogOpen}
          onClose={handleSocialDialogClose}
          vehicleId={vehicleIdForSocial}
        />

        <VehicleDocumentsDialog
          open={documentsDialogOpen}
          onClose={handleDocumentsDialogClose}
          vehicleId={vehicleIdForDocuments}
        />
      </div>
    </MainLayout>
  )
}

