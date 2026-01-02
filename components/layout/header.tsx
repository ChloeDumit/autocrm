'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="lg:hidden" />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-semibold">Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs text-primary hover:text-primary"
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => !notification.leida && markAsRead(notification.id)}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {notification.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.mensaje}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground/60">
                          {new Date(notification.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      {!notification.leida && (
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
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
