'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useAppConfig } from '@/lib/app-config'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard,
  Car,
  Users,
  ShoppingCart,
  Calendar,
  FileText,
  Bell,
  LogOut,
  Settings,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vehículos', href: '/vehicles', icon: Car },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Ventas', href: '/sales', icon: ShoppingCart },
  { name: 'Test Drives', href: '/test-drives', icon: Calendar },
  { name: 'Plantillas', href: '/templates', icon: FileText },
]

const adminNavigation = [
  { name: 'Usuarios', href: '/admin/users', icon: UserPlus },
  { name: 'Formas de Pago', href: '/admin/payment-methods', icon: ShoppingCart },
  { name: 'Propiedades Vehículos', href: '/admin/vehicle-properties', icon: Car },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#3b82f6'
  const secondaryColor = config?.colorSecundario || '#1e40af'
  const nombreEmpresa = config?.nombreEmpresa || 'AutoCRM'
  const logo = config?.logo

  return (
    <div 
      className="flex h-screen w-64 flex-col text-white"
      style={{
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    >
      <div className="flex h-16 items-center justify-center border-b border-white/20 px-4">
        {logo ? (
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
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
            <h1 className="text-xl font-bold">{nombreEmpresa}</h1>
          </div>
        ) : (
          <h1 className="text-xl font-bold">{nombreEmpresa}</h1>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/20 text-white backdrop-blur-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
        
        {user?.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-gray-700"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
              Administración
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>
      <div className="border-t border-white/20 p-4">
        <div className="mb-2 text-sm text-white/80">
          <div className="font-medium text-white">{user?.name}</div>
          <div className="text-xs">{user?.role}</div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

