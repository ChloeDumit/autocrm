'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, Search, Car, ArrowUp, ArrowDown, X, Filter } from 'lucide-react'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { SocialMediaDialog } from '@/components/vehicles/social-media-dialog'
import { VehicleDocumentsDialog } from '@/components/vehicles/vehicle-documents-dialog'
import { SearchableSelect, SearchableMultiSelect } from '@/components/ui/searchable-select'

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

type SortField = 'precio' | 'ano' | 'kilometraje' | 'marca'
type SortOrder = 'asc' | 'desc'

const STATUS_OPTIONS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'RESERVADO', label: 'Reservado' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
]

const SORT_OPTIONS = [
  { value: 'precio', label: 'Precio' },
  { value: 'ano', label: 'Año' },
  { value: 'kilometraje', label: 'Kilometraje' },
  { value: 'marca', label: 'Marca' },
]

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [vehicleIdForSocial, setVehicleIdForSocial] = useState<string | null>(null)
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false)
  const [vehicleIdForDocuments, setVehicleIdForDocuments] = useState<string | null>(null)
  const { toast } = useToast()

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('precio')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Derived filter options from data
  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(vehicles.map((v) => v.marca))).sort()
    return brands.map((brand) => ({ value: brand, label: brand }))
  }, [vehicles])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(vehicles.map((v) => v.ano))).sort((a, b) => b - a)
    return years.map((year) => ({ value: year.toString(), label: year.toString() }))
  }, [vehicles])

  // Filtered and sorted vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles]

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.marca.toLowerCase().includes(searchLower) ||
          v.modelo.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((v) => statusFilter.includes(v.estado))
    }

    // Apply brand filter
    if (brandFilter) {
      result = result.filter((v) => v.marca === brandFilter)
    }

    // Apply year filter
    if (yearFilter) {
      result = result.filter((v) => v.ano.toString() === yearFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'precio':
          comparison = a.precio - b.precio
          break
        case 'ano':
          comparison = a.ano - b.ano
          break
        case 'kilometraje':
          comparison = a.kilometraje - b.kilometraje
          break
        case 'marca':
          comparison = a.marca.localeCompare(b.marca)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [vehicles, search, statusFilter, brandFilter, yearFilter, sortField, sortOrder])

  const hasActiveFilters = statusFilter.length > 0 || brandFilter || yearFilter

  const clearFilters = () => {
    setStatusFilter([])
    setBrandFilter('')
    setYearFilter('')
  }

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
    router.push('/vehicles/new')
  }

  const handleEdit = (vehicle: Vehicle) => {
    router.push(`/vehicles/${vehicle.id}/edit`)
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vehículos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu inventario de vehículos
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por marca o modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-primary text-primary' : ''}
            >
              <Filter className="mr-1.5 h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {(statusFilter.length > 0 ? 1 : 0) + (brandFilter ? 1 : 0) + (yearFilter ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <SearchableSelect
                options={SORT_OPTIONS}
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
                placeholder="Ordenar por"
                className="w-[140px]"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-input bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <SearchableMultiSelect
                  options={STATUS_OPTIONS}
                  values={statusFilter}
                  onValuesChange={setStatusFilter}
                  placeholder="Todos"
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Marca:</span>
                <SearchableSelect
                  options={brandOptions}
                  value={brandFilter}
                  onValueChange={setBrandFilter}
                  placeholder="Todas"
                  className="w-[140px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Año:</span>
                <SearchableSelect
                  options={yearOptions}
                  value={yearFilter}
                  onValueChange={setYearFilter}
                  placeholder="Todos"
                  className="w-[120px]"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}

          {/* Results count */}
          {!loading && vehicles.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredVehicles.length} de {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando vehículos...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Car className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No hay vehículos en el inventario</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar primer vehículo
            </Button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No se encontraron vehículos con los filtros aplicados</p>
            <Button onClick={clearFilters} variant="outline">
              <X className="mr-1.5 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVehicles.map((vehicle) => (
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
