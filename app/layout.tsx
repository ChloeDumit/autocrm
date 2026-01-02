import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { AppConfigProvider } from '@/lib/app-config'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoCRM - Sistema de Gestión para Automotoras',
  description: 'CRM completo para gestión de vehículos, clientes y ventas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <AppConfigProvider>
            {children}
            <Toaster />
          </AppConfigProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

