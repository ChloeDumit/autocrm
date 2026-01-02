'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { SearchSelect } from '@/components/ui/search-select'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'

const saleSchema = z.object({
  vehicleId: z.string().min(1, 'El vehículo es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  etapa: z.enum(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']),
  precioFinal: z.number().positive().optional(),
  notas: z.string().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

interface Sale {
  id: string
  etapa: string
  precioFinal?: number
  notas?: string
  vehicleId: string
  clientId: string
}

interface SaleDialogProps {
  open: boolean
  onClose: () => void
  sale?: Sale | null
  initialVehicleId?: string
  initialClientId?: string
}

export function SaleDialog({ open, onClose, sale, initialVehicleId, initialClientId }: SaleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vehicleSearchResults, setVehicleSearchResults] = useState<any[]>([])
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([])
  const [vehicleSearchLoading, setVehicleSearchLoading] = useState(false)
  const [clientSearchLoading, setClientSearchLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      vehicleId: '',
      clientId: '',
      etapa: 'INTERESADO',
      precioFinal: undefined,
      notas: '',
    },
  })

  useEffect(() => {
    if (open) {
      const loadInitialData = async () => {
        // Cargar todos los vehículos y clientes disponibles para búsqueda
        searchVehicles('')
        searchClients('')
        
        // Si hay valores iniciales, cargar los datos específicos
        if (initialVehicleId) {
          await fetchVehicleById(initialVehicleId)
        }
        if (initialClientId) {
          await fetchClientById(initialClientId)
        }
        
        // Establecer los valores iniciales después de cargar los datos
        if (initialVehicleId || initialClientId) {
          reset({
            vehicleId: initialVehicleId || '',
            clientId: initialClientId || '',
            etapa: 'INTERESADO',
            precioFinal: undefined,
            notas: '',
          })
        }
      }
      
      loadInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialVehicleId, initialClientId])

  useEffect(() => {
    if (sale) {
      reset({
        vehicleId: sale.vehicleId,
        clientId: sale.clientId,
        etapa: sale.etapa as any,
        precioFinal: sale.precioFinal,
        notas: sale.notas || '',
      })
      // Cargar los datos del vehículo y cliente seleccionados
      if (sale.vehicleId) {
        fetchVehicleById(sale.vehicleId)
      }
      if (sale.clientId) {
        fetchClientById(sale.clientId)
      }
    } else if (!initialVehicleId && !initialClientId) {
      reset({
        vehicleId: '',
        clientId: '',
        etapa: 'INTERESADO',
        precioFinal: undefined,
        notas: '',
      })
    }
  }, [sale, reset, initialVehicleId, initialClientId])

  const searchVehicles = useCallback(async (search: string) => {
    setVehicleSearchLoading(true)
    try {
      const params: any = { estado: 'DISPONIBLE' }
      if (search) {
        params.search = search
      }
      const res = await api.get('/vehicles', { params })
      setVehicleSearchResults(res.data)
    } catch (error) {
      console.error('Error searching vehicles:', error)
      setVehicleSearchResults([])
    } finally {
      setVehicleSearchLoading(false)
    }
  }, [])

  const searchClients = useCallback(async (search: string) => {
    setClientSearchLoading(true)
    try {
      const params: any = {}
      if (search) {
        params.search = search
      }
      const res = await api.get('/clients', { params })
      setClientSearchResults(res.data)
    } catch (error) {
      console.error('Error searching clients:', error)
      setClientSearchResults([])
    } finally {
      setClientSearchLoading(false)
    }
  }, [])

  const fetchVehicleById = async (id: string): Promise<void> => {
    try {
      const res = await api.get(`/vehicles/${id}`)
      // Agregar el vehículo a los resultados si no está ya presente
      setVehicleSearchResults((prev) => {
        if (!prev.find((v) => v.id === id)) {
          return [res.data, ...prev]
        }
        return prev
      })
    } catch (error) {
      console.error('Error fetching vehicle:', error)
    }
  }

  const fetchClientById = async (id: string): Promise<void> => {
    try {
      const res = await api.get(`/clients/${id}`)
      // Agregar el cliente a los resultados si no está ya presente
      setClientSearchResults((prev) => {
        if (!prev.find((c) => c.id === id)) {
          return [res.data, ...prev]
        }
        return prev
      })
    } catch (error) {
      console.error('Error fetching client:', error)
    }
  }

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true)
    try {
      if (sale) {
        await api.put(`/sales/${sale.id}`, data)
        toast({
          title: 'Éxito',
          description: 'Venta actualizada correctamente',
        })
      } else {
        await api.post('/sales', data)
        toast({
          title: 'Éxito',
          description: 'Venta creada correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar venta')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sale ? 'Editar Venta' : 'Nueva Venta'}
          </DialogTitle>
          <DialogDescription>
            {sale
              ? 'Modifica la información de la venta'
              : 'Crea una nueva venta en el pipeline'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SearchSelect
              label="Vehículo *"
              placeholder="Buscar vehículo por marca o modelo..."
              value={watch('vehicleId')}
              onValueChange={(value) => setValue('vehicleId', value)}
              items={vehicleSearchResults.map((vehicle) => ({
                id: vehicle.id,
                label: `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano}) - $${vehicle.precio.toLocaleString()}`,
              }))}
              onSearch={searchVehicles}
              loading={vehicleSearchLoading}
              error={errors.vehicleId?.message}
            />
            <SearchSelect
              label="Cliente *"
              placeholder="Buscar cliente por nombre, email o teléfono..."
              value={watch('clientId')}
              onValueChange={(value) => setValue('clientId', value)}
              items={clientSearchResults.map((client) => ({
                id: client.id,
                label: `${client.nombre}${client.telefono ? ` - ${client.telefono}` : ''}${client.email ? ` (${client.email})` : ''}`,
              }))}
              onSearch={searchClients}
              loading={clientSearchLoading}
              error={errors.clientId?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etapa">Etapa *</Label>
              <Select
                value={watch('etapa')}
                onValueChange={(value) => setValue('etapa', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERESADO">Interesado</SelectItem>
                  <SelectItem value="PRUEBA">Prueba</SelectItem>
                  <SelectItem value="NEGOCIACION">Negociación</SelectItem>
                  <SelectItem value="VENDIDO">Vendido</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errors.etapa && (
                <p className="text-sm text-red-500">{errors.etapa.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioFinal">Precio Final</Label>
              <Input
                id="precioFinal"
                type="number"
                step="0.01"
                {...register('precioFinal', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              {...register('notas')}
              placeholder="Notas adicionales sobre la venta..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : sale ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

