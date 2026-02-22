'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus } from 'lucide-react'
import { TestDriveDialog } from '@/components/test-drives/test-drive-dialog'
import { TestDriveCard } from '@/components/test-drives/test-drive-card'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface TestDrive {
  id: string
  fecha: string
  hora: string
  estado: string
  notas?: string
  vehicleId: string
  clientId: string
  vehicle: {
    marca: string
    modelo: string
  }
  client: {
    nombre: string
    telefono: string
  }
  vendedor: {
    name: string
  }
}

export default function TestDrivesPage() {
  const [testDrives, setTestDrives] = useState<TestDrive[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTestDrives()
  }, [dateFilter])

  const fetchTestDrives = async () => {
    try {
      const params: any = {}
      if (dateFilter) {
        params.fecha = dateFilter
      }
      const res = await api.get('/test-drives', { params })
      setTestDrives(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar test drives',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedTestDrive(null)
    setDialogOpen(true)
  }

  const handleEdit = (testDrive: TestDrive) => {
    setSelectedTestDrive(testDrive)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este test drive?')) return

    try {
      await api.delete(`/test-drives/${id}`)
      toast({
        title: 'Éxito',
        description: 'Test drive eliminado correctamente',
      })
      fetchTestDrives()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar test drive',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedTestDrive(null)
    fetchTestDrives()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Drives</h1>
            <p className="text-muted-foreground">
              Gestiona los test drives agendados
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar Test Drive
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[200px]"
                placeholder="Filtrar por fecha"
              />
              {dateFilter && (
                <Button
                  variant="outline"
                  onClick={() => setDateFilter('')}
                >
                  Limpiar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando test drives...</p>
                </div>
              </div>
            ) : testDrives.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay test drives agendados
              </div>
            ) : (
              <div className="space-y-4">
                {testDrives.map((testDrive) => (
                  <TestDriveCard
                    key={testDrive.id}
                    testDrive={testDrive}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TestDriveDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          testDrive={selectedTestDrive}
        />
      </div>
    </MainLayout>
  )
}

