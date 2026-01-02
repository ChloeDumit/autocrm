'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from './api'

interface AppConfig {
  id: string
  nombreEmpresa: string
  colorPrimario: string
  colorSecundario: string
  logo?: string
}

interface AppConfigContextType {
  config: AppConfig | null
  loading: boolean
  refresh: () => void
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, Math.max(0, (num >> 16) + amt))
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  }

  const fetchConfig = async () => {
    try {
      const res = await api.get('/app-config')
      setConfig(res.data)
      
      // Aplicar colores a CSS variables y estilos dinámicos
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        
        // Colores primarios
        root.style.setProperty('--primary', res.data.colorPrimario)
        root.style.setProperty('--primary-foreground', '#ffffff')
        
        // Colores secundarios
        root.style.setProperty('--secondary', res.data.colorSecundario)
        root.style.setProperty('--secondary-foreground', '#ffffff')
        
        // Colores para hover y estados
        root.style.setProperty('--primary-hover', adjustBrightness(res.data.colorPrimario, -10))
        root.style.setProperty('--primary-active', adjustBrightness(res.data.colorPrimario, -20))
        
        // Aplicar gradiente como variable CSS
        root.style.setProperty(
          '--gradient-primary',
          `linear-gradient(135deg, ${res.data.colorPrimario} 0%, ${res.data.colorSecundario} 100%)`
        )
      }
    } catch (error) {
      console.error('Error fetching app config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <AppConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider')
  }
  return context
}

