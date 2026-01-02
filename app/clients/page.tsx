'use client'

import { useEffect, useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, Search, Users, MoreHorizontal, Edit, Trash2, Phone, Mail, ArrowUp, ArrowDown, X, Filter } from 'lucide-react'
import { ClientDialog } from '@/components/clients/client-dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Client {
  id: string
  nombre: string
  email?: string
  telefono: string
  direccion?: string
  interes?: string
  notas?: string
}

type SortField = 'nombre' | 'email' | 'telefono' | 'interes'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'email', label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'interes', label: 'Interés' },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const { toast } = useToast()

  // Filters
  const [interesFilter, setInteresFilter] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Derived filter options from data
  const interesOptions = useMemo(() => {
    const interests = Array.from(new Set(clients.map((c) => c.interes).filter(Boolean))) as string[]
    return interests.sort().map((interes) => ({ value: interes, label: interes }))
  }, [clients])

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let result = [...clients]

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.telefono.includes(searchLower)
      )
    }

    // Apply interest filter
    if (interesFilter) {
      result = result.filter((c) => c.interes === interesFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre)
          break
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '')
          break
        case 'telefono':
          comparison = a.telefono.localeCompare(b.telefono)
          break
        case 'interes':
          comparison = (a.interes || '').localeCompare(b.interes || '')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [clients, search, interesFilter, sortField, sortOrder])

  const hasActiveFilters = Boolean(interesFilter)

  const clearFilters = () => {
    setInteresFilter('')
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients', { params: { search } })
      setClients(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar clientes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchClients()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleCreate = () => {
    setSelectedClient(null)
    setDialogOpen(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return

    try {
      await api.delete(`/clients/${id}`)
      toast({
        title: 'Éxito',
        description: 'Cliente eliminado correctamente',
      })
      fetchClients()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar cliente',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedClient(null)
    fetchClients()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
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
                  1
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
                <span className="text-sm text-muted-foreground">Interés:</span>
                <SearchableSelect
                  options={interesOptions}
                  value={interesFilter}
                  onValueChange={setInteresFilter}
                  placeholder="Todos"
                  className="w-[180px]"
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
          {!loading && clients.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando clientes...</p>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No hay clientes registrados</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar primer cliente
            </Button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No se encontraron clientes con los filtros aplicados</p>
            <Button onClick={clearFilters} variant="outline">
              <X className="mr-1.5 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Interés</TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {client.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{client.nombre}</p>
                          {client.direccion && (
                            <p className="text-sm text-muted-foreground truncate hidden sm:block">
                              {client.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <a
                          href={`tel:${client.telefono}`}
                          className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.telefono}
                        </a>
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors truncate"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{client.email}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.interes ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {client.interes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                        {client.notas || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <ClientDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          client={selectedClient}
        />
      </div>
    </MainLayout>
  )
}
