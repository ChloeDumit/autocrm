'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from './api'

interface AppConfig {
  id: string
  nombreEmpresa: string
  colorPrimario: string
  colorSecundario: string
  logo?: string
  plantillaInstagram?: string | null
  plantillaMercadolibreTitulo?: string | null
  plantillaMercadolibreDescripcion?: string | null
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

  const fetchConfig = async () => {
    try {
      const res = await api.get('/app-config')
      setConfig(res.data)
      // Colors are now defined in globals.css - no dynamic override needed
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

