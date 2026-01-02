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
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'

const clientSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  direccion: z.string().optional(),
  interes: z.string().optional(),
  notas: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface Client {
  id: string
  nombre: string
  email?: string
  telefono: string
  direccion?: string
  interes?: string
  notas?: string
}

interface ClientDialogProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      interes: '',
      notas: '',
    },
  })

  useEffect(() => {
    if (client) {
      reset({
        nombre: client.nombre,
        email: client.email || '',
        telefono: client.telefono,
        direccion: client.direccion || '',
        interes: client.interes || '',
        notas: client.notas || '',
      })
    } else {
      reset({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        interes: '',
        notas: '',
      })
    }
  }, [client, reset])

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)
    try {
      if (client) {
        await api.put(`/clients/${client.id}`, data)
        toast({
          title: 'Éxito',
          description: 'Cliente actualizado correctamente',
        })
      } else {
        await api.post('/clients', data)
        toast({
          title: 'Éxito',
          description: 'Cliente creado correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar cliente')
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
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {client
              ? 'Modifica la información del cliente'
              : 'Completa la información del nuevo cliente'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register('nombre')} />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" {...register('telefono')} />
              {errors.telefono && (
                <p className="text-sm text-red-500">{errors.telefono.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interes">Interés</Label>
            <Input
              id="interes"
              {...register('interes')}
              placeholder="Ej: SUV, Sedán, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              {...register('notas')}
              placeholder="Notas adicionales sobre el cliente..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : client ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

