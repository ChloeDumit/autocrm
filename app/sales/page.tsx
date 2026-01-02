'use client'

import { useEffect, useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, MoreHorizontal, Edit, Trash2, FileText, ShoppingCart, Car, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { SaleDialog } from '@/components/sales/sale-dialog'
import { GenerateDocumentDialog } from '@/components/sales/generate-document-dialog'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Sale {
  id: string
  etapa: string
  precioFinal?: number
  notas?: string
  vehicle: {
    id: string
    marca: string
    modelo: string
    ano: number
    precio: number
  }
  client: {
    id: string
    nombre: string
    telefono: string
  }
  vendedor: {
    name: string
  }
}

type SortField = 'cliente' | 'vehiculo' | 'precio' | 'etapa' | 'vendedor'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'precio', label: 'Precio' },
  { value: 'etapa', label: 'Etapa' },
  { value: 'vendedor', label: 'Vendedor' },
]

const stageConfig: Record<string, { label: string; className: string }> = {
  INTERESADO: {
    label: 'Interesado',
    className: 'bg-info/10 text-info border-info/20'
  },
  PRUEBA: {
    label: 'Prueba',
    className: 'bg-warning/10 text-warning border-warning/20'
  },
  NEGOCIACION: {
    label: 'Negociación',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  VENDIDO: {
    label: 'Vendido',
    className: 'bg-success/10 text-success border-success/20'
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'bg-muted text-muted-foreground border-border'
  },
}

const stageOrder = ['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [saleForDocument, setSaleForDocument] = useState<Sale | null>(null)
  const { toast } = useToast()

  // Search and sort
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('cliente')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Filtered and sorted sales
  const filteredSales = useMemo(() => {
    let result = [...sales]

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.client.nombre.toLowerCase().includes(searchLower) ||
          s.vehicle.marca.toLowerCase().includes(searchLower) ||
          s.vehicle.modelo.toLowerCase().includes(searchLower) ||
          s.vendedor.name.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'cliente':
          comparison = a.client.nombre.localeCompare(b.client.nombre)
          break
        case 'vehiculo':
          comparison = `${a.vehicle.marca} ${a.vehicle.modelo}`.localeCompare(`${b.vehicle.marca} ${b.vehicle.modelo}`)
          break
        case 'precio':
          comparison = (a.precioFinal || a.vehicle.precio) - (b.precioFinal || b.vehicle.precio)
          break
        case 'etapa':
          comparison = stageOrder.indexOf(a.etapa) - stageOrder.indexOf(b.etapa)
          break
        case 'vendedor':
          comparison = a.vendedor.name.localeCompare(b.vendedor.name)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [sales, search, sortField, sortOrder])

  useEffect(() => {
    fetchSales()
  }, [filter])

  const fetchSales = async () => {
    try {
      const params: any = {}
      if (filter !== 'all') {
        params.etapa = filter
      }
      const res = await api.get('/sales', { params })
      setSales(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar ventas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedSale(null)
    setDialogOpen(true)
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return

    try {
      await api.delete(`/sales/${id}`)
      toast({
        title: 'Éxito',
        description: 'Venta eliminada correctamente',
      })
      fetchSales()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar venta',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedSale(null)
    fetchSales()
  }

  const handleGenerateDocument = (sale: Sale) => {
    setSaleForDocument(sale)
    setDocumentDialogOpen(true)
  }

  const handleDocumentDialogClose = () => {
    setDocumentDialogOpen(false)
    setSaleForDocument(null)
  }

  const stages = [
    { value: 'all', label: 'Todas las etapas' },
    { value: 'INTERESADO', label: 'Interesado' },
    { value: 'PRUEBA', label: 'Prueba' },
    { value: 'NEGOCIACION', label: 'Negociación' },
    { value: 'VENDIDO', label: 'Vendido' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ]

  const salesByStage = sales.reduce((acc, sale) => {
    acc[sale.etapa] = (acc[sale.etapa] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count for pipeline (excluding cancelled)
  const pipelineCount = sales.filter(s => s.etapa !== 'CANCELADO' && s.etapa !== 'VENDIDO').length
  const closedCount = sales.filter(s => s.etapa === 'VENDIDO').length

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ventas</h1>
            <p className="text-muted-foreground mt-1">
              {pipelineCount} en pipeline, {closedCount} cerrada{closedCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>

        {/* Stage summary cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {stages.slice(1).map((stage) => {
            const config = stageConfig[stage.value]
            const count = salesByStage[stage.value] || 0
            const isActive = filter === stage.value

            return (
              <Card
                key={stage.value}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive && "ring-2 ring-primary"
                )}
                onClick={() => setFilter(isActive ? 'all' : stage.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
                    <Badge variant="outline" className={cn("text-xs", config?.className)}>
                      {count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filter dropdown for mobile */}
        <div className="sm:hidden">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, vehículo o vendedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

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

        {/* Results count */}
        {!loading && sales.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredSales.length} de {sales.length} venta{sales.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando ventas...</p>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No hay ventas registradas</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Crear primera venta
            </Button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No se encontraron ventas con la búsqueda actual</p>
            <Button onClick={() => setSearch('')} variant="outline">
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="hidden sm:table-cell">Precio</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const stage = stageConfig[sale.etapa] || { label: sale.etapa, className: '' }

                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{sale.client.nombre}</p>
                          <p className="text-sm text-muted-foreground">{sale.client.telefono}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Car className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {sale.vehicle.marca} {sale.vehicle.modelo}
                            </p>
                            <p className="text-sm text-muted-foreground">{sale.vehicle.ano}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div>
                          <p className="font-medium">
                            ${(sale.precioFinal || sale.vehicle.precio).toLocaleString()}
                          </p>
                          {sale.precioFinal && sale.precioFinal !== sale.vehicle.precio && (
                            <p className="text-sm text-muted-foreground line-through">
                              ${sale.vehicle.precio.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border", stage.className)}>
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {sale.vendedor.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEdit(sale)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateDocument(sale)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Generar documento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(sale.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        <SaleDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          sale={selectedSale}
        />

        <GenerateDocumentDialog
          open={documentDialogOpen}
          onClose={handleDocumentDialogClose}
          sale={saleForDocument}
        />
      </div>
    </MainLayout>
  )
}
