'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Plus } from 'lucide-react'
import { PaymentMethodDialog } from '@/components/admin/payment-method-dialog'
import { PaymentMethodCard } from '@/components/admin/payment-method-card'

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  documents: PaymentDocument[]
}

interface PaymentDocument {
  id: string
  nombre: string
  archivo: string
  descripcion?: string
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      const res = await api.get('/payment-methods')
      setMethods(res.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar formas de pago',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedMethod(null)
    setDialogOpen(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta forma de pago?')) return

    try {
      await api.delete(`/payment-methods/${id}`)
      toast({
        title: 'Éxito',
        description: 'Forma de pago eliminada correctamente',
      })
      fetchMethods()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar forma de pago',
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedMethod(null)
    fetchMethods()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Formas de Pago</h1>
            <p className="text-muted-foreground">
              Gestiona las formas de pago y sus documentos
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Forma de Pago
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay formas de pago registradas
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {methods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <PaymentMethodDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          method={selectedMethod}
        />
      </div>
    </MainLayout>
  )
}

