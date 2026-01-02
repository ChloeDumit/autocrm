'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus } from 'lucide-react'
import { SaleDialog } from '@/components/sales/sale-dialog'
import { SaleCard } from '@/components/sales/sale-card'
import { GenerateDocumentDialog } from '@/components/sales/generate-document-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [saleForDocument, setSaleForDocument] = useState<Sale | null>(null)
  const { toast } = useToast()

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
    { value: 'all', label: 'Todas' },
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ventas</h1>
            <p className="text-muted-foreground">
              Gestiona el pipeline de ventas
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {stages.slice(1).map((stage) => (
            <Card key={stage.value}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesByStage[stage.value] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay ventas registradas
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onGenerateDocument={handleGenerateDocument}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

