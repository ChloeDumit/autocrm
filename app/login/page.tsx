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

const adjustBrightness = (hex: string, percent: number) => {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#3b82f6'
  const secondaryColor = config?.colorSecundario || '#1e40af'
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
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`,
      }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          {logo && (
            <div className="flex justify-center">
              <div className="relative h-16 w-16">
                <Image
                  src={
                    logo.startsWith('http')
                      ? logo
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${logo}`
                  }
                  alt={nombreEmpresa}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
          <div>
            <CardTitle className="text-2xl" style={{ color: primaryColor }}>
              {nombreEmpresa}
            </CardTitle>
            <CardDescription>Inicia sesión en tu cuenta</CardDescription>
          </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = adjustBrightness(primaryColor, -10)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿No tienes cuenta? </span>
              <Link href="/register" className="text-primary hover:underline">
                Regístrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

