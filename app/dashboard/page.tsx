'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'
import { Car, Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface DashboardMetrics {
  vehicles: {
    total: number
    available: number
  }
  testDrives: {
    scheduled: number
  }
  sales: {
    total: number
    thisMonth: number
    byStage: Array<{ stage: string; count: number }>
    revenue: {
      total: number
      thisMonth: number
    }
  }
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics')
      setMetrics(res.data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu concesionaria
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vehículos Disponibles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.vehicles.available || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {metrics?.vehicles.total || 0} totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Test Drives Agendados
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.testDrives.scheduled || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Próximos test drives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Cerradas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.sales.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.sales.thisMonth || 0} este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics?.sales.revenue.total || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${(metrics?.sales.revenue.thisMonth || 0).toLocaleString()} este mes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Etapa</CardTitle>
              <CardDescription>
                Estado actual del pipeline de ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.sales.byStage.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {stage.stage.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{stage.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

