'use client';

import { useEffect, useState } from 'react';
import superAdminApi from '@/lib/super-admin-api';
import {
  TrendingUp,
  Users,
  Building2,
  ShoppingCart,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Car,
  UserCircle,
} from 'lucide-react';

interface GrowthMetrics {
  period: number;
  tenants: Record<string, number>;
  users: Record<string, number>;
  sales: Record<string, number>;
  totals: {
    newTenants: number;
    newUsers: number;
    newSales: number;
  };
}

interface TopTenant {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
  };
  salesCount?: number;
  vehicleCount?: number;
  clientCount?: number;
}

interface RevenueData {
  mrr: number;
  arr: number;
  breakdown: Array<{
    plan: string;
    count: number;
    pricePerTenant: number;
    monthlyRevenue: number;
  }>;
}

interface HealthData {
  status: string;
  database: string;
  tenantsNearLimits: Array<{
    id: string;
    name: string;
    subdomain: string;
    userUsage: number;
    vehicleUsage: number;
  }>;
  largestTenants: Array<{
    id: string;
    name: string;
    subdomain: string;
    counts: {
      users: number;
      vehicles: number;
      clients: number;
      sales: number;
    };
  }>;
}

export default function AnalyticsPage() {
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [topBySales, setTopBySales] = useState<TopTenant[]>([]);
  const [topByVehicles, setTopByVehicles] = useState<TopTenant[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [growthRes, salesRes, vehiclesRes, revenueRes, healthRes] = await Promise.all([
        superAdminApi.get(`/super-admin/dashboard/growth?period=${period}`),
        superAdminApi.get('/super-admin/dashboard/top-tenants?metric=sales&limit=5'),
        superAdminApi.get('/super-admin/dashboard/top-tenants?metric=vehicles&limit=5'),
        superAdminApi.get('/super-admin/dashboard/revenue'),
        superAdminApi.get('/super-admin/dashboard/health'),
      ]);

      setGrowth(growthRes.data);
      setTopBySales(salesRes.data);
      setTopByVehicles(vehiclesRes.data);
      setRevenue(revenueRes.data);
      setHealth(healthRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const planColors: Record<string, string> = {
    FREE: 'bg-slate-500',
    STARTER: 'bg-blue-500',
    PROFESSIONAL: 'bg-purple-500',
    ENTERPRISE: 'bg-amber-500',
  };

  // Generate chart data from growth metrics
  const generateChartBars = (data: Record<string, number>, maxBars = 14) => {
    const entries = Object.entries(data).slice(-maxBars);
    if (entries.length === 0) return [];
    const maxValue = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([date, value]) => ({
      date,
      value,
      height: (value / maxValue) * 100,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-400">Platform performance and insights</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Growth Summary Cards */}
      {growth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUp className="h-4 w-4" />
                {growth.totals.newTenants}
              </span>
            </div>
            <p className="text-slate-400 text-sm">New Tenants</p>
            <p className="text-3xl font-bold">{growth.totals.newTenants}</p>
            <p className="text-slate-500 text-sm mt-1">in last {period} days</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUp className="h-4 w-4" />
                {growth.totals.newUsers}
              </span>
            </div>
            <p className="text-slate-400 text-sm">New Users</p>
            <p className="text-3xl font-bold">{growth.totals.newUsers}</p>
            <p className="text-slate-500 text-sm mt-1">in last {period} days</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-pink-500 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUp className="h-4 w-4" />
                {growth.totals.newSales}
              </span>
            </div>
            <p className="text-slate-400 text-sm">New Sales</p>
            <p className="text-3xl font-bold">{growth.totals.newSales}</p>
            <p className="text-slate-500 text-sm mt-1">in last {period} days</p>
          </div>
        </div>
      )}

      {/* Revenue Overview */}
      {revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Revenue Overview
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">MRR</p>
                <p className="text-2xl font-bold text-green-400">${revenue.mrr.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">ARR</p>
                <p className="text-2xl font-bold text-green-400">${revenue.arr.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              {revenue.breakdown.map((item) => (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${planColors[item.plan]}`} />
                    <span>{item.plan}</span>
                    <span className="text-slate-400">({item.count} tenants)</span>
                  </div>
                  <span className="font-semibold">${item.monthlyRevenue}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Chart */}
          {growth && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Activity Over Time
              </h2>
              <div className="space-y-6">
                {/* Tenants Chart */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">New Tenants</p>
                  <div className="flex items-end gap-1 h-16">
                    {generateChartBars(growth.tenants).map((bar) => (
                      <div
                        key={bar.date}
                        className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                        style={{ height: `${Math.max(bar.height, 5)}%` }}
                        title={`${bar.date}: ${bar.value}`}
                      />
                    ))}
                    {Object.keys(growth.tenants).length === 0 && (
                      <p className="text-slate-500 text-sm">No data</p>
                    )}
                  </div>
                </div>

                {/* Users Chart */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">New Users</p>
                  <div className="flex items-end gap-1 h-16">
                    {generateChartBars(growth.users).map((bar) => (
                      <div
                        key={bar.date}
                        className="flex-1 bg-purple-500 rounded-t transition-all hover:bg-purple-400"
                        style={{ height: `${Math.max(bar.height, 5)}%` }}
                        title={`${bar.date}: ${bar.value}`}
                      />
                    ))}
                    {Object.keys(growth.users).length === 0 && (
                      <p className="text-slate-500 text-sm">No data</p>
                    )}
                  </div>
                </div>

                {/* Sales Chart */}
                <div>
                  <p className="text-sm text-slate-400 mb-2">New Sales</p>
                  <div className="flex items-end gap-1 h-16">
                    {generateChartBars(growth.sales).map((bar) => (
                      <div
                        key={bar.date}
                        className="flex-1 bg-pink-500 rounded-t transition-all hover:bg-pink-400"
                        style={{ height: `${Math.max(bar.height, 5)}%` }}
                        title={`${bar.date}: ${bar.value}`}
                      />
                    ))}
                    {Object.keys(growth.sales).length === 0 && (
                      <p className="text-slate-500 text-sm">No data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Sales */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-pink-400" />
            Top Tenants by Sales
          </h2>
          <div className="space-y-3">
            {topBySales.length > 0 ? (
              topBySales.map((item, index) => (
                <div
                  key={item.tenant?.id || index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-500">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{item.tenant?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-400">{item.tenant?.subdomain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-pink-400">{item.salesCount}</p>
                    <p className="text-xs text-slate-400">sales</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Top by Vehicles */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-orange-400" />
            Top Tenants by Vehicles
          </h2>
          <div className="space-y-3">
            {topByVehicles.length > 0 ? (
              topByVehicles.map((item, index) => (
                <div
                  key={item.tenant?.id || index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-500">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{item.tenant?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-400">{item.tenant?.subdomain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-400">{item.vehicleCount}</p>
                    <p className="text-xs text-slate-400">vehicles</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No vehicle data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            System Health
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tenants Near Limits */}
            <div>
              <h3 className="font-medium mb-3 text-slate-300">Tenants Approaching Limits</h3>
              {health.tenantsNearLimits.length > 0 ? (
                <div className="space-y-2">
                  {health.tenantsNearLimits.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                    >
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-slate-400">{tenant.subdomain}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className={tenant.userUsage >= 80 ? 'text-yellow-400' : 'text-slate-400'}>
                          Users: {tenant.userUsage}%
                        </span>
                        <span className={tenant.vehicleUsage >= 80 ? 'text-yellow-400' : 'text-slate-400'}>
                          Vehicles: {tenant.vehicleUsage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No tenants near limits</p>
              )}
            </div>

            {/* Largest Tenants */}
            <div>
              <h3 className="font-medium mb-3 text-slate-300">Largest Tenants</h3>
              <div className="space-y-2">
                {health.largestTenants.map((tenant) => (
                  <div key={tenant.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="font-medium">{tenant.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-400">
                      <span>{tenant.counts.users} users</span>
                      <span>{tenant.counts.vehicles} vehicles</span>
                      <span>{tenant.counts.clients} clients</span>
                      <span>{tenant.counts.sales} sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
