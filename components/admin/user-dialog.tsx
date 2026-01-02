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

const userSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ASISTENTE']),
})

type UserFormData = z.infer<typeof userSchema>

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'VENDEDOR' | 'ASISTENTE'
}

interface UserDialogProps {
  open: boolean
  onClose: () => void
  user?: User | null
}

export function UserDialog({ open, onClose, user }: UserDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'ASISTENTE',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '', // No mostrar contraseña existente
        role: user.role,
      })
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: 'ASISTENTE',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      }

      // Solo incluir password si se está creando o si se proporcionó uno nuevo
      if (!user || data.password) {
        if (!data.password || data.password.length < 6) {
          toast({
            title: 'Error',
            description: 'La contraseña debe tener al menos 6 caracteres',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
        payload.password = data.password
      }

      if (user) {
        await api.put(`/users/${user.id}`, payload)
        toast({
          title: 'Éxito',
          description: 'Usuario actualizado correctamente',
        })
      } else {
        await api.post('/users', payload)
        toast({
          title: 'Éxito',
          description: 'Usuario creado correctamente',
        })
      }
      onClose()
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al guardar usuario')
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Modifica la información del usuario'
              : 'Crea un nuevo usuario en el sistema'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder={user ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASISTENTE">Asistente</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

