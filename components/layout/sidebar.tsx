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
  LogOut,
  Settings,
  UserPlus,
  X,
  ChevronRight,
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
  { name: 'Propiedades', href: '/admin/vehicle-properties', icon: Car },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { config } = useAppConfig()

  const primaryColor = config?.colorPrimario || '#3b82f6'
  const secondaryColor = config?.colorSecundario || '#1e40af'
  const nombreEmpresa = config?.nombreEmpresa || 'AutoCRM'
  const logo = config?.logo

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div
      className="flex h-screen w-64 flex-col text-white"
      style={{
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {logo ? (
            <div className="relative h-8 w-8 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
              <Image
                src={
                  logo.startsWith('http')
                    ? logo
                    : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${logo}`
                }
                alt={nombreEmpresa}
                fill
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Car className="h-4 w-4" />
            </div>
          )}
          <span className="font-semibold truncate">{nombreEmpresa}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-gray-700")} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </Link>
            )
          })}
        </div>

        {/* Admin Section */}
        {user?.role === 'ADMIN' && (
          <div className="mt-6">
            <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
              Administración
            </div>
            <div className="mt-1 space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-gray-700")} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/60 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white h-9"
          onClick={logout}
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
