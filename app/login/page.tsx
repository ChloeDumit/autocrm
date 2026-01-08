'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import { useAppConfig } from '@/lib/app-config'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#75AADB'
  const nombreEmpresa = config?.nombreEmpresa || 'CarsUY'
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

  const features = [
    { icon: Car, text: 'Gestión de inventario' },
    { icon: Users, text: 'CRM de clientes' },
    { icon: TrendingUp, text: 'Pipeline de ventas' },
    { icon: FileText, text: 'Documentación digital' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <Link href="/">
              <svg width="140" height="58" viewBox="0 0 120 50" className="h-14 w-auto">
                <text x="60" y="26"
                  fontFamily="Arial Black, sans-serif"
                  fontSize="30" fontWeight="900"
                  fill="white"
                  textAnchor="middle">CARS</text>
                <rect x="12" y="32" width="96" height="3" fill="rgba(255,255,255,0.6)" rx="1"/>
                <text x="60" y="46"
                  fontFamily="Helvetica Neue, sans-serif"
                  fontSize="11" fontWeight="600"
                  letterSpacing="6" fill="rgba(255,255,255,0.8)"
                  textAnchor="middle">UY</text>
              </svg>
            </Link>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Gestioná tu automotora de forma simple
              </h1>
              <p className="text-xl text-sky-100">
                Todo lo que necesitás para administrar tu negocio en un solo lugar.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white text-lg">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-sky-200 text-sm">
            © 2024 CarsUY. Software para automotoras.
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block">
              <svg width="120" height="50" viewBox="0 0 120 50" className="h-12 w-auto">
                <text x="60" y="26"
                  fontFamily="Arial Black, sans-serif"
                  fontSize="30" fontWeight="900"
                  className="fill-gray-900 dark:fill-white"
                  textAnchor="middle">CARS</text>
                <rect x="12" y="32" width="96" height="3" fill="#75AADB" rx="1"/>
                <text x="60" y="46"
                  fontFamily="Helvetica Neue, sans-serif"
                  fontSize="11" fontWeight="600"
                  letterSpacing="6" fill="#75AADB"
                  textAnchor="middle">UY</text>
              </svg>
            </Link>
          </div>

          {/* Tenant branding (if has custom config) */}
          {logo && (
            <div className="flex justify-center mb-6">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-slate-800">
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
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ingresá tus credenciales para acceder
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Recordarme
                </span>
              </label>
              <Link href="/forgot-password" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-500 dark:text-gray-400">
              ¿No tenés cuenta?{' '}
            </span>
            <Link
              href="/register-company"
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              Registrá tu empresa
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al iniciar sesión, aceptás nuestros{' '}
            <a href="#" className="text-sky-600 hover:underline">Términos</a>
            {' '}y{' '}
            <a href="#" className="text-sky-600 hover:underline">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  )
}
