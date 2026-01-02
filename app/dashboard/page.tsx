'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { Car, Calendar, TrendingUp, DollarSign, Plus, ArrowRight, Users } from 'lucide-react'

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

const stageLabels: Record<string, string> = {
  INTERESADO: 'Interesado',
  PRUEBA: 'Prueba',
  NEGOCIACION: 'Negociación',
  VENDIDO: 'Vendido',
  CANCELADO: 'Cancelado'
}

const stageColors: Record<string, string> = {
  INTERESADO: 'bg-info',
  PRUEBA: 'bg-warning',
  NEGOCIACION: 'bg-primary',
  VENDIDO: 'bg-success',
  CANCELADO: 'bg-muted-foreground'
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const totalPipelineCount = metrics?.sales.byStage
    .filter(s => s.stage !== 'VENDIDO' && s.stage !== 'CANCELADO')
    .reduce((acc, s) => acc + s.count, 0) || 0

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Resumen de tu concesionaria
            </p>
          </div>
        </div>
              {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => router.push('/vehicles')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Car className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium">Agregar Vehículo</p>
                <p className="text-sm text-muted-foreground">Nuevo inventario</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => router.push('/clients')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Users className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium">Nuevo Cliente</p>
                <p className="text-sm text-muted-foreground">Registrar prospecto</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => router.push('/test-drives')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Calendar className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium">Agendar Test Drive</p>
                <p className="text-sm text-muted-foreground">Nueva cita</p>
              </div>
            </CardContent>
          </Card>
        </div>
      

        {/* Main Metrics Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Available Vehicles */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/vehicles')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{metrics?.vehicles.available || 0}</p>
                <p className="text-sm text-muted-foreground">Vehículos disponibles</p>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                de {metrics?.vehicles.total || 0} totales
              </div>
            </CardContent>
          </Card>

          {/* Test Drives */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/test-drives')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{metrics?.testDrives.scheduled || 0}</p>
                <p className="text-sm text-muted-foreground">Test drives</p>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                agendados
              </div>
            </CardContent>
          </Card>

          {/* Sales Pipeline */}
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/sales')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{totalPipelineCount}</p>
                <p className="text-sm text-muted-foreground">En pipeline</p>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {metrics?.sales.thisMonth || 0} cerradas este mes
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <DollarSign className="h-5 w-5 text-info" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  ${((metrics?.sales.revenue.thisMonth || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-muted-foreground">Ingresos este mes</p>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                ${(metrics?.sales.revenue.total || 0).toLocaleString()} total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pipeline de Ventas</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/sales')}>
                Ver todo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.sales.byStage
                .filter(stage => stage.stage !== 'CANCELADO')
                .map((stage) => {
                  const total = metrics?.sales.byStage
                    .filter(s => s.stage !== 'CANCELADO')
                    .reduce((acc, s) => acc + s.count, 0) || 1
                  const percentage = (stage.count / total) * 100

                  return (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">
                          {stageLabels[stage.stage] || stage.stage}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {stage.count}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${stageColors[stage.stage] || 'bg-muted-foreground'}`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
