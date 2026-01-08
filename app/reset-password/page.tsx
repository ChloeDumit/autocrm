'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  XCircle,
} from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false)
        setTokenValid(false)
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/validate-reset-token/${token}`
        )
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
          setUserInfo({ email: data.email, name: data.name })
        } else {
          setTokenValid(false)
          setError(data.error || 'El enlace es inválido o ha expirado')
        }
      } catch (err) {
        setTokenValid(false)
        setError('Error al validar el enlace')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Validando enlace...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 mb-6 shadow-lg shadow-red-500/30">
            <XCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Enlace Inválido
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {error || 'El enlace para restablecer la contraseña es inválido o ha expirado.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-center shadow-lg shadow-sky-500/25"
            >
              Solicitar Nuevo Enlace
            </Link>
            <Link
              href="/login"
              className="block w-full py-3.5 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors text-center"
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Contraseña Actualizada!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Tu contraseña ha sido restablecida correctamente. Ya podés iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/25"
          >
            Iniciar Sesión
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nueva Contraseña
          </h2>
          {userInfo && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Hola <strong>{userInfo.name}</strong>, creá tu nueva contraseña
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  Actualizar Contraseña
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
