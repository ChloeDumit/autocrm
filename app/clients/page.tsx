'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus, Search } from 'lucide-react'
import { ClientDialog } from '@/components/clients/client-dialog'
import { ClientCard } from '@/components/clients/client-card'

interface Client {
  id: string
  nombre: string
  email?: string
  telefono: string
  direccion?: string
  interes?: string
  notas?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const { toast } = useToast()

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gestiona tu base de datos de clientes
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
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
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay clientes registrados
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ClientDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          client={selectedClient}
        />
      </div>
    </MainLayout>
  )
}

