'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'
import { useAppConfig } from '@/lib/app-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications()
  const { config } = useAppConfig()

  const nombreEmpresa = config?.nombreEmpresa || 'AutoCRM'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">{nombreEmpresa}</h2>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <span className="font-semibold">Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs"
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3"
                    onClick={() => !notification.leida && markAsRead(notification.id)}
                  >
                    <div className="flex w-full items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.mensaje}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      {!notification.leida && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

