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
import { format } from 'date-fns'

const testDriveSchema = z.object({
  vehicleId: z.string().min(1, 'El vehículo es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  hora: z.string().min(1, 'La hora es requerida'),
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO']).optional(),
  notas: z.string().optional(),
})

type TestDriveFormData = z.infer<typeof testDriveSchema>

interface TestDrive {
  id: string
  fecha: string
  hora: string
  estado: string
  notas?: string
  vehicleId: string
  clientId: string
}

interface TestDriveDialogProps {
  open: boolean
  onClose: () => void
  testDrive?: TestDrive | null
}

export function TestDriveDialog({ open, onClose, testDrive }: TestDriveDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TestDriveFormData>({
    resolver: zodResolver(testDriveSchema),
    defaultValues: {
      vehicleId: '',
      clientId: '',
      fecha: '',
      hora: '',
      estado: 'PENDIENTE',
      notas: '',
    },
  })

  useEffect(() => {
    if (open) {
      fetchVehicles()
      fetchClients()
    }
  }, [open])

  useEffect(() => {
    if (testDrive) {
      const fecha = format(new Date(testDrive.fecha), 'yyyy-MM-dd')
      reset({
        vehicleId: testDrive.vehicleId,
        clientId: testDrive.clientId,
        fecha,
        hora: testDrive.hora,
        estado: testDrive.estado as any,
        notas: testDrive.notas || '',
      })
    } else {
      reset({
        vehicleId: '',
        clientId: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora: '',
        estado: 'PENDIENTE',
        notas: '',
      })
    }
  }, [testDrive, reset])

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles')
      setVehicles(res.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients')
      setClients(res.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const onSubmit = async (data: TestDriveFormData) => {
    setLoading(true)
    try {
      if (testDrive) {
        await api.put(`/test-drives/${testDrive.id}`, data)
        toast({
          title: 'Éxito',
          description: 'Test drive actualizado correctamente',
        })
      } else {
        await api.post('/test-drives', data)
        toast({
          title: 'Éxito',
          description: 'Test drive agendado correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar test drive')
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
            {testDrive ? 'Editar Test Drive' : 'Agendar Test Drive'}
          </DialogTitle>
          <DialogDescription>
            {testDrive
              ? 'Modifica la información del test drive'
              : 'Agenda un nuevo test drive'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleId">Vehículo *</Label>
              <Select
                value={watch('vehicleId')}
                onValueChange={(value) => setValue('vehicleId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-sm text-red-500">{errors.vehicleId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente *</Label>
              <Select
                value={watch('clientId')}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nombre} - {client.telefono}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                {...register('fecha')}
              />
              {errors.fecha && (
                <p className="text-sm text-red-500">{errors.fecha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                {...register('hora')}
              />
              {errors.hora && (
                <p className="text-sm text-red-500">{errors.hora.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={watch('estado')}
                onValueChange={(value) => setValue('estado', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="COMPLETADO">Completado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              {...register('notas')}
              placeholder="Notas adicionales sobre el test drive..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : testDrive ? 'Actualizar' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

