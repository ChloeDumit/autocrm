'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAppConfig } from '@/lib/app-config'
import { Car } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#3b82f6'
  const nombreEmpresa = config?.nombreEmpresa || 'AutoCRM'
  const logo = config?.logo

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30 gap-4">
      {logo ? (
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
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Car className="h-8 w-8 text-white" />
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando {nombreEmpresa}...</p>
      </div>
    </div>
  )
}
