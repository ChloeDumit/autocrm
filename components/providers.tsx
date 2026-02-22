'use client'

import { AuthProvider } from '@/lib/auth-context'
import { AppConfigProvider } from '@/lib/app-config'
import { TenantProvider } from '@/lib/tenant-context'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <AuthProvider>
        <AppConfigProvider>
          {children}
          <Toaster />
        </AppConfigProvider>
      </AuthProvider>
    </TenantProvider>
  )
}
