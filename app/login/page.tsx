'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import { useAppConfig } from '@/lib/app-config'
import Link from 'next/link'
import Image from 'next/image'
import { Car, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#3b82f6'
  const nombreEmpresa = config?.nombreEmpresa || 'AutoCRM'
  const logo = config?.logo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente',
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = getErrorMessage(error, 'Error al iniciar sesión')

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          {logo ? (
            <div className="flex justify-center mb-4">
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                <Image
                  src={
                    logo.startsWith('http')
                      ? logo
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${logo}`
                  }
                  alt={nombreEmpresa}
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Car className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">{nombreEmpresa}</h1>
          <p className="text-muted-foreground mt-1">Sistema de gestión automotriz</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿No tienes cuenta? </span>
              <Link
                href="/register"
                className="font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                Regístrate
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Al iniciar sesión, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  )
}
