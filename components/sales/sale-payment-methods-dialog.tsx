'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { CreditCard, X, Plus } from 'lucide-react'

const paymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'La forma de pago es requerida'),
  monto: z.number().positive().optional(),
  notas: z.string().optional(),
})

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

interface PaymentMethod {
  id: string
  nombre: string
  descripcion?: string
}

interface SalePaymentMethod {
  id: string
  monto?: number
  notas?: string
  paymentMethod: PaymentMethod
}

interface SalePaymentMethodsDialogProps {
  open: boolean
  onClose: () => void
  saleId: string | null
}

export function SalePaymentMethodsDialog({ open, onClose, saleId }: SalePaymentMethodsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [salePaymentMethods, setSalePaymentMethods] = useState<SalePaymentMethod[]>([])
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SalePaymentMethod | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      paymentMethodId: '',
      monto: undefined,
      notas: '',
    },
  })

  useEffect(() => {
    if (open && saleId) {
      fetchSalePaymentMethods()
      fetchAvailablePaymentMethods()
    }
  }, [open, saleId])

  const fetchSalePaymentMethods = async () => {
    if (!saleId) return
    try {
      const res = await api.get(`/sale-payment-methods/sale/${saleId}`)
      setSalePaymentMethods(res.data)
    } catch (error) {
      console.error('Error fetching sale payment methods:', error)
    }
  }

  const fetchAvailablePaymentMethods = async () => {
    try {
      const res = await api.get('/payment-methods', { params: { activo: true } })
      setAvailablePaymentMethods(res.data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const onSubmit = async (data: PaymentMethodFormData) => {
    if (!saleId) return

    setLoading(true)
    try {
      if (selectedPaymentMethod) {
        await api.put(`/sale-payment-methods/${selectedPaymentMethod.id}`, data)
        toast({
          title: 'Forma de pago actualizada',
          description: 'La forma de pago fue actualizada correctamente',
        })
      } else {
        await api.post('/sale-payment-methods', {
          ...data,
          saleId,
        })
        toast({
          title: 'Forma de pago agregada',
          description: 'La forma de pago fue agregada correctamente',
        })
      }

      reset()
      setSelectedPaymentMethod(null)
      setShowForm(false)
      fetchSalePaymentMethods()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar forma de pago')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta forma de pago?')) return

    try {
      await api.delete(`/sale-payment-methods/${id}`)
      toast({
        title: 'Forma de pago eliminada',
        description: 'La forma de pago fue eliminada correctamente',
      })
      fetchSalePaymentMethods()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al eliminar forma de pago')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (spm: SalePaymentMethod) => {
    setSelectedPaymentMethod(spm)
    reset({
      paymentMethodId: spm.paymentMethod.id,
      monto: spm.monto,
      notas: spm.notas || '',
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setSelectedPaymentMethod(null)
    reset({
      paymentMethodId: '',
      monto: undefined,
      notas: '',
    })
    setShowForm(true)
  }

  const getTotalAmount = () => {
    return salePaymentMethods.reduce((sum, spm) => sum + (spm.monto || 0), 0)
  }

  if (!saleId) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formas de Pago</DialogTitle>
          <DialogDescription>
            Gestiona las formas de pago asociadas a esta venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total registrado: <span className="font-medium text-foreground">${getTotalAmount().toLocaleString()}</span>
                </div>
                <Button variant="outline" onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Forma de Pago
                </Button>
              </div>

              {salePaymentMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay formas de pago registradas
                </div>
              ) : (
                <div className="space-y-2">
                  {salePaymentMethods.map((spm) => (
                    <div
                      key={spm.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{spm.paymentMethod.nombre}</span>
                          {spm.monto && (
                            <span className="text-sm text-primary font-medium">
                              ${spm.monto.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {spm.notas && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {spm.notas}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(spm)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(spm.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethodId">Forma de Pago *</Label>
                <Select
                  value={watch('paymentMethodId')}
                  onValueChange={(value) => setValue('paymentMethodId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paymentMethodId && (
                  <p className="text-sm text-red-500">{errors.paymentMethodId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  placeholder="Monto pagado con esta forma"
                  {...register('monto', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  {...register('notas')}
                  placeholder="Ej: Número de cheque, cuotas, banco, etc."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setSelectedPaymentMethod(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : selectedPaymentMethod ? 'Actualizar' : 'Agregar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
